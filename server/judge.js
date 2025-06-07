const Docker = require("dockerode");
const docker = new Docker(); // Assumes Docker is running locally and accessible
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const Submission = require("./models/submission");
const Problem = require("./models/problem");

const { Readable } = require("stream");//fix

const PYTHON_IMAGE = "python:3.9-slim"; // Using a specific, lightweight Python image
const C_IMAGE = "gcc:latest"; // Docker image with GCC compiler for C
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
  let codeFilePath, executablePath, imageName, execCmd;
  if (language === 'python') {
    codeFilePath = path.join(tempDir, "user_script.py");
    imageName = PYTHON_IMAGE;
    execCmd = ["python", "user_script.py"];
  } else if (language === 'c') {
    codeFilePath = path.join(tempDir, "user_code.c");
    executablePath = path.join(tempDir, "a.out"); // Default GCC output
    imageName = C_IMAGE;
    execCmd = ["./a.out"];
  } else {
    console.warn(`[JudgeService] Unsupported language: ${language}. Marking as Compilation Error.`);
    await Submission.findByIdAndUpdate(submissionId, { status: "Compilation Error" });
    await fs.rm(tempDir, { recursive: true, force: true }).catch(e => console.warn(`Failed to clean temp dir ${tempDir}:`, e));
    return;
  }

  try {
    await fs.writeFile(codeFilePath, userCode);
    console.log(`[JudgeService] User code for ${submissionId} written to ${codeFilePath}`);

    // --- Compilation Step (for C language) ---
    if (language === 'c') {
      console.log(`[JudgeService] Compiling C code for submission ${submissionId}`);
      let compileContainer;
      try {
        compileContainer = await docker.createContainer({
          Image: imageName,
          WorkingDir: "/tmp",
          Cmd: ["gcc", "user_code.c", "-o", "a.out"],
          User: `${os.userInfo().uid}:${os.userInfo().gid}`, 
          HostConfig: {
            Mounts: [{
              Target: "/tmp",
              Source: tempDir,
              Type: "bind"
            }],
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
          // We will update status and clean up in the finally block.
        } else {
          console.log(`[JudgeService] Compilation successful for ${submissionId}.`);
        }
      } finally {
        if (compileContainer) {
          await compileContainer.remove({ force: true }).catch(e => console.warn(`Failed to remove compile container:`, e));
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
      for (let i = 0; i < testCases.length; i++) { const testCase = testCases[i];
        console.log(`[JudgeService] Running test case ${i + 1}/${testCases.length} for ${submissionId}.`);
        
        const hostConfig = {
                  Memory: MEMORY_LIMIT_MB * 1024 * 1024,
                  NetworkMode: "none",
                };
        
                // For C, we mount the entire directory to access the compiled file.
                // For Python, we just need to mount the script.
                if (language === 'c') {
                  hostConfig.Mounts = [{
                    Target: "/tmp",
                    Source: tempDir,
                    Type: "bind",
                    ReadOnly: true,
                  }];
                } else { // Python
                  hostConfig.Mounts = [{
                    Target: `/usr/src/app/user_script.py`,
                    Source: codeFilePath,
                    Type: "bind",
                    ReadOnly: true,
                  }];
                }

        let container;
        try {
          container = await docker.createContainer({
            Image: imageName,
            Cmd: execCmd,
            WorkingDir: "/tmp",
            HostConfig: hostConfig,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            StdinOnce: false, // Important for streaming input
            Tty: false, // Using non-TTY mode for easier stream separation
          });

          const startTime = process.hrtime();
          await container.start();

          const execStream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true,
          });

          // Write input to container's stdin
          //execStream.write(testCase.input + "\n"); // Ensure newline if script expects it
          //execStream.end(); // Close stdin to signal end of input

          const inputStream = new Readable();
          inputStream.push(testCase.input + "\n"); // 添加换行符以兼容 scanf 等函数
          inputStream.push(null); // `null` 表示输入流结束 (EOF)
          
          // 将我们的输入流“管道”到容器的标准输入流中
          inputStream.pipe(execStream);

          const stdoutChunks = [];
          const stderrChunks = [];
          
          // 此 Promise 将在容器的输出流结束时解决
          const streamEndPromise = new Promise(resolve => {
              container.modem.demuxStream(
                  execStream,
                  { write: (chunk) => stdoutChunks.push(chunk) },
                  { write: (chunk) => stderrChunks.push(chunk) }
              );
              execStream.on('end', resolve);
              execStream.on('error', resolve); // 在流出错时也解决，避免挂起
          });

          // 并发地：比赛看是容器先执行完，还是先超时
          const waitOperation = container.wait();
          const timeoutPromise = new Promise(
            (_, reject) => setTimeout(() => reject(new Error("TLE_custom")), TIME_LIMIT_MS)
          );

          let waitResult;
          try {
            waitResult = await Promise.race([waitOperation, timeoutPromise]);
          } catch (err) {
            if (err.message === "TLE_custom") {
              finalStatus = "Time Limit Exceeded";
              console.log(`[JudgeService] Test case TLE for ${submissionId}.`);
              if (container) {
                // 在超时后强制停止容器
                await container.stop().catch(e => console.warn("Failed to stop TLE container:", e));
              }
            } else {
              // 抛出其他致命错误
              throw err;
            }
          }

          // 等待流处理完成（现在应该会立刻完成，因为容器已停止）
          await streamEndPromise;

          const endTime = process.hrtime(startTime);
          const durationMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;

          // 如果发生超时，直接跳出测试用例循环
          if (finalStatus === "Time Limit Exceeded") {
              console.log(`[JudgeService] Test case ${i + 1} for ${submissionId} exceeded time limit.`);
              break;
          }

          console.log(
            `[JudgeService] Test case ${i + 1} for ${submissionId} took ${durationMs.toFixed(
              2
            )}ms. Exit code: ${waitResult.StatusCode}`
          );

          const stdout = Buffer.concat(stdoutChunks).toString("utf-8").trim();
          const stderr = Buffer.concat(stderrChunks).toString("utf-8").trim();

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
    if (finalStatus === 'Judging') {
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
