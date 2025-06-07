const Docker = require("dockerode");
const docker = new Docker(); // Assumes Docker is running locally and accessible
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const Submission = require("./models/submission");
const Problem = require("./models/problem");

const PYTHON_IMAGE = "python:3.12-slim"; // Using a specific, lightweight Python image
const C_IMAGE = "gcc:latest"; // Docker image with GCC compiler for C
const CPP_IMAGE = "gcc:latest"; // Can use the same GCC image for C++
const JAVA_IMAGE = "openjdk:21-jdk-oracle";
const TIME_LIMIT_MS = 2000; // Time limit for execution in milliseconds (e.g., 2 seconds)
const MEMORY_LIMIT_MB = 256; // Memory limit in MB

/**
 * Judges a given submission.
 * @param {String} submissionId - The ID of the submission to judge.
 */
async function judgeSubmission(submissionId) {
  let submission;
  let problem;

  console.log(`Starting judgment for submission: ${submissionId}`);

  try {
    submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error(`[JudgeService] Submission ${submissionId} not found.`);
      return;
    }

    // Prevent re-judging if it's already judged or actively being judged by another process
    if (submission.status !== "Pending") {
      console.log(
        `[JudgeService] Submission ${submissionId} is not 'Pending' (current: ${submission.status}). Skipping.`
      );
      return;
    }

    problem = await Problem.findById(submission.problem);
    if (!problem) {
      await Submission.findByIdAndUpdate(submissionId, {
        status: "System Error" /*, executionOutput: "Problem details not found." */,
      });
      console.error(
        `[JudgeService] Problem ${submission.problem} for submission ${submissionId} not found.`
      );
      return;
    }

    // Mark submission as "Judging"
    submission.status = "Judging";
    await submission.save();
    console.log(`[JudgeService] Submission ${submissionId} marked as 'Judging'.`);
  } catch (dbError) {
    console.error(
      `[JudgeService] DB error before starting Docker for submission ${submissionId}:`,
      dbError
    );
    if (submission && submission._id) {
      // If submission was fetched, try to mark error
      await Submission.findByIdAndUpdate(submissionId, {
        status: "System Error" /*, executionOutput: "DB error during pre-judge setup."*/,
      }).catch((err) => console.error("Failed to mark System Error", err));
    }
    return;
  }

  const userCode = submission.code;
  const testCases = problem.cases;
  const language = submission.language.toLowerCase();
  let finalStatus = "Judging"; // Default, will be updated based on test cases

  // Create a temporary directory for the user's code and any I/O files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `oj-${language}-${submissionId}-`));

  // Prepare file paths and commands based on language
  let codeFilePath, imageName, compileCmd, execCmd;
  if (language === "python") {
    codeFilePath = path.join(tempDir, "user_script.py");
    imageName = PYTHON_IMAGE;
    compileCmd = null; // Python does not need a separate compilation step
    execCmd = ["python", "user_script.py"];
  } else if (language === "c") {
    codeFilePath = path.join(tempDir, "user_code.c");
    imageName = C_IMAGE;
    compileCmd = ["gcc", "user_code.c", "-o", "a.out"];
    execCmd = ["./a.out"];
  } else if (language === "cpp") {
    codeFilePath = path.join(tempDir, "user_code.cpp");
    imageName = CPP_IMAGE;
    compileCmd = ["g++", "user_code.cpp", "-o", "a.out"];
    execCmd = ["./a.out"];
  } else if (language === "java") {
    // For Java, the main class file must be named Main.java
    codeFilePath = path.join(tempDir, "Main.java");
    imageName = JAVA_IMAGE;
    compileCmd = ["javac", "Main.java"];
    execCmd = ["java", "Main"];
  } else {
    console.warn(`[JudgeService] Unsupported language: ${language}. Marking as Compilation Error.`);
    await Submission.findByIdAndUpdate(submissionId, { status: "Compilation Error" });
    await fs
      .rm(tempDir, { recursive: true, force: true })
      .catch((e) => console.warn(`Failed to clean temp dir ${tempDir}:`, e));
    return;
  }

  try {
    await fs.writeFile(codeFilePath, userCode);
    console.log(`[JudgeService] User code for ${submissionId} written to ${codeFilePath}`);

    // --- Compilation Step (for compiled languages like C, C++, Java) ---
    if (compileCmd) {
      console.log(`[JudgeService] Compiling ${language} code for submission ${submissionId}`);
      let compileContainer;
      try {
        compileContainer = await docker.createContainer({
          Image: imageName,
          WorkingDir: "/tmp",
          Cmd: compileCmd, // Use the dynamic compile command
          User: `${os.userInfo().uid}:${os.userInfo().gid}`,
          HostConfig: {
            Mounts: [
              {
                Target: "/tmp",
                Source: tempDir,
                Type: "bind",
              },
            ],
            Memory: MEMORY_LIMIT_MB * 1024 * 1024,
            NetworkMode: "none",
          },
        });

        await compileContainer.start();
        const waitResult = await compileContainer.wait({ timeout: 5000 }); // 5-second compile time limit

        if (waitResult.StatusCode !== 0) {
          const logs = await compileContainer.logs({ stdout: true, stderr: true });
          console.error(`[JudgeService] Compilation failed for ${submissionId}.`, logs.toString());
          finalStatus = "Compilation Error";
        } else {
          console.log(`[JudgeService] Compilation successful for ${submissionId}.`);
        }
      } finally {
        if (compileContainer) {
          await compileContainer
            .remove({ force: true })
            .catch((e) => console.warn(`Failed to remove compile container:`, e));
        }
      }
    }
    // If compilation failed, skip execution
    if (finalStatus === "Compilation Error") {
      // This throws an error to jump to the `catch` and `finally` blocks
      // to ensure cleanup and status update happens in one place.
      throw new Error("Compilation failed, aborting judgment.");
    }

    // --- Execution Step (for all languages) ---
    if (!testCases || testCases.length === 0) {
      // If there are no test cases, it can be considered "Accepted" or an error
      // For typical OJ, this might be a "System Error" or needs clarification.
      // Let's assume "Accepted" if no test cases, or you can change to "System Error".
      finalStatus = "Accepted"; // Or "System Error" if test cases are mandatory
      console.log(
        `[JudgeService] No test cases for problem ${problem._id}. Marking ${submissionId} as ${finalStatus}.`
      );
    } else {
      console.log(`[JudgeService] Processing ${testCases.length} test cases for ${submissionId}.`);
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(
          `[JudgeService] Running test case ${i + 1}/${testCases.length} for ${submissionId}.`
        );

        const hostConfig = {
          Memory: MEMORY_LIMIT_MB * 1024 * 1024,
          NetworkMode: "none",
        };

        // For C, we mount the entire directory to access the compiled file.
        // For Python, we just need to mount the script.
        if (language === "c" || language === "cpp" || language === "java" || language === "python") {
          hostConfig.Mounts = [
            {
              Target: "/tmp",
              Source: tempDir,
              Type: "bind",
              ReadOnly: false, // Must be writable for input.txt
            },
          ];
        }
        

        let container;
        try {
          // 步骤 1: 将测试用例的输入写入临时文件
          const inputFilePath = path.join(tempDir, "input.txt");
          await fs.writeFile(inputFilePath, testCase.input);

          const workingDir = '/tmp';
          container = await docker.createContainer({
            Image: imageName,
            Cmd: ["/bin/sh", "-c", `${execCmd.join(" ")} < input.txt`], // Use dynamic execCmd
            WorkingDir: workingDir, // Set working directory based on language
            HostConfig: hostConfig,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
          });

          const startTime = process.hrtime();
          await container.start();

          const waitOperation = container.wait();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TLE_custom")), TIME_LIMIT_MS)
          );

          let waitResult;
          try {
            waitResult = await Promise.race([waitOperation, timeoutPromise]);
          } catch (err) {
            if (err.message === "TLE_custom") {
              finalStatus = "Time Limit Exceeded";
              console.log(`[JudgeService] Test case TLE for ${submissionId}.`);
              if (container) {
                await container
                  .stop({ t: 1 })
                  .catch((e) => console.warn("Failed to stop TLE container:", e));
              }
            } else {
              throw err;
            }
          }

          const endTime = process.hrtime(startTime);
          const durationMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;

          if (finalStatus === "Time Limit Exceeded") {
            console.log(
              `[JudgeService] Test case ${i + 1} for ${submissionId} exceeded time limit.`
            );
            break;
          }

          const logBuffer = await container.logs({ stdout: true, stderr: true });

          let stdout = "";
          let offset = 0;
          while (offset < logBuffer.length) {
            if (offset + 8 > logBuffer.length) {
              break;
            }
            const length = logBuffer.readUInt32BE(offset + 4);
            const nextOffset = offset + 8 + length;
            if (nextOffset > logBuffer.length) {
              break;
            }

            const streamType = logBuffer[offset];
            if (streamType === 1) {
              stdout += logBuffer.toString("utf-8", offset + 8, nextOffset);
            }

            offset = nextOffset;
          }

          stdout = stdout.trim();

          console.log(
            `[JudgeService] Test case ${i + 1} for ${submissionId} took ${durationMs.toFixed(
              2
            )}ms. Exit code: ${waitResult.StatusCode}`
          );

          if (waitResult.StatusCode !== 0) {
            finalStatus = "Runtime Error";
            console.log(
              `[JudgeService] Test case Runtime Error for ${submissionId}. stderr: ${stderr}`
            );
            break;
          }

          const normalizedActualOutput = stdout.replace(/\r\n/g, "\n");
          const normalizedExpectedOutput = testCase.output.replace(/\r\n/g, "\n");

          if (normalizedActualOutput !== normalizedExpectedOutput) {
            finalStatus = "Wrong Answer";
            console.log(
              `[JudgeService] Test case Wrong Answer for ${submissionId}. Expected: "${normalizedExpectedOutput}", Got: "${normalizedActualOutput}"`
            );
            break;
          }
          // If loop continues, this test case passed.
        } finally {
          if (container) {
            await container
              .remove({ force: true })
              .catch((e) =>
                console.warn(`[JudgeService] Failed to remove container for ${submissionId}:`, e)
              );
          }
        }
      }
    }

    if (finalStatus === "Judging" && testCases && testCases.length > 0) {
      // All test cases passed
      finalStatus = "Accepted";
      console.log(
        `[JudgeService] All test cases passed for ${submissionId}. Marking as 'Accepted'.`
      );
    }
  } catch (error) {
    console.error(
      `[JudgeService] Critical error during judging submission ${submissionId}:`,
      error
    );
    // If status wasn't already set (e.g., Compilation Error), mark as System Error.
    if (finalStatus === "Judging") {
      finalStatus = "System Error";
    }
    // Optionally store error.message in submission.executionOutput
  } finally {
    await fs
      .rm(tempDir, { recursive: true, force: true })
      .catch((e) => console.warn(`[JudgeService] Failed to clean temp dir ${tempDir}:`, e));
  }

  // Final update to submission status
  await Submission.findByIdAndUpdate(submissionId, { status: finalStatus });
  console.log(
    `[JudgeService] Submission ${submissionId} final status: ${finalStatus}. Judgment complete.`
  );
}

module.exports = { judgeSubmission };
