const fs = require("fs").promises;
const path = require("path");
const Submission = require("./models/submission");
const Problem = require("./models/problem");
const { runContainer } = require("./judgeRunner");

const PYTHON_IMAGE = "python:3.12-slim";
const CHECKER_VALIDATOR = [
  "import ast, pathlib, sys",
  "try:",
  "    tree = ast.parse(pathlib.Path('checker.py').read_text(), filename='checker.py')",
  "except SyntaxError as error:",
  "    print(f'Line {error.lineno}: {error.msg}')",
  "    sys.exit(1)",
  "functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'check']",
  "if len(functions) != 1:",
  "    print('Define exactly one top-level check function.')",
  "    sys.exit(1)",
  "arguments = functions[0].args",
  "if len(arguments.posonlyargs) + len(arguments.args) != 3 or arguments.vararg or arguments.kwarg or arguments.kwonlyargs:",
  "    print('check must accept exactly: input_data, expected_output, actual_output.')",
  "    sys.exit(1)",
].join("\n");

const CHECKER_RUNNER = [
  "import pathlib, runpy, sys, traceback",
  "exit_code = 2",
  "try:",
  "    namespace = runpy.run_path('checker.py')",
  "    checker = namespace.get('check')",
  "    if not callable(checker):",
  "        raise TypeError('checker.py must define check(input_data, expected_output, actual_output)')",
  "    values = [pathlib.Path(name).read_text() for name in ('input.txt', 'expected.txt', 'actual.txt')]",
  "    result = checker(*values)",
  "    if type(result) is not bool:",
  "        raise TypeError('check must return True or False')",
  "    exit_code = 0 if result else 1",
  "except BaseException:",
  "    traceback.print_exc()",
  "sys.exit(exit_code)",
].join("\n");
const languages = {
  python: { image: PYTHON_IMAGE, file: "main.py", run: "python -I main.py" },
  c: {
    image: "gcc:14",
    file: "main.c",
    compile: ["gcc", "main.c", "-O2", "-o", "main"],
    run: "./main",
  },
  cpp: {
    image: "gcc:14",
    file: "main.cpp",
    compile: ["g++", "main.cpp", "-std=c++17", "-O2", "-o", "main"],
    run: "./main",
  },
  java: {
    image: "eclipse-temurin:21-jdk",
    file: "Main.java",
    compile: ["javac", "-J-Xmx128m", "Main.java"],
    run: "java -Xmx128m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m -XX:+UseSerialGC Main",
  },
};

const normalizeOutput = (output) => output.replace(/\r\n/g, "\n").trimEnd();
const mount = (source, target, readOnly = true) => ({
  Source: source,
  Target: target,
  Type: "bind",
  ReadOnly: readOnly,
});

async function validateCheckerCode(checkerCode) {
  if (typeof checkerCode !== "string" || !checkerCode.trim()) {
    return { valid: false, message: "Python checker code is required." };
  }
  if (Buffer.byteLength(checkerCode, "utf8") > 65536) {
    return { valid: false, message: "Python checker must be no larger than 64KB." };
  }

  let tempDir;
  try {
    const tempRoot = process.env.JUDGE_TEMP_DIR || path.resolve(__dirname, "..", ".judge-tmp");
    await fs.mkdir(tempRoot, { recursive: true });
    tempDir = await fs.mkdtemp(path.join(tempRoot, "checker-validation-"));
    await fs.writeFile(path.join(tempDir, "checker.py"), checkerCode);
    const validation = await runContainer({
      image: PYTHON_IMAGE,
      command: ["python", "-I", "-c", CHECKER_VALIDATOR],
      mounts: [mount(tempDir, "/workspace")],
      timeoutMs: 2000,
    });
    if (validation.timedOut || validation.outputLimited || validation.oomKilled) {
      return { valid: false, message: "Checker validation exceeded its resource limit." };
    }
    if (validation.exitCode !== 0) {
      return {
        valid: false,
        message: validation.stdout.trim() || "Checker syntax or function signature is invalid.",
      };
    }
    return { valid: true, message: "Checker syntax and function signature are valid." };
  } catch (error) {
    console.error("[JudgeService] Checker validation failed:", error.message);
    return { valid: false, systemError: true, message: "Checker validation is unavailable." };
  } finally {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Pure evaluation entry point also used by the Docker integration tests.
async function evaluateSubmission(problem, submission) {
  let tempDir;
  let passedCases = 0;
  let executionTimeMs = 0;
  const verdict = (status, message = "") => ({ status, message, passedCases, executionTimeMs });

  try {
    const language = Object.hasOwn(languages, submission.language)
      ? languages[submission.language]
      : null;
    if (!language) return verdict("Compilation Error", "Unsupported language.");
    if (!problem.cases?.length) return verdict("System Error", "No test cases configured.");
    const mode = problem.judgeMode || "standard";
    if (
      !["standard", "python"].includes(mode) ||
      (mode === "python" && !problem.checkerCode?.trim())
    ) {
      return verdict("System Error", "Invalid checker configuration.");
    }

    const tempRoot = process.env.JUDGE_TEMP_DIR || path.resolve(__dirname, "..", ".judge-tmp");
    await fs.mkdir(tempRoot, { recursive: true });
    tempDir = await fs.mkdtemp(path.join(tempRoot, "submission-"));
    const sourceDir = path.join(tempDir, "source");
    const inputDir = path.join(tempDir, "input");
    const checkerDir = path.join(tempDir, "checker");
    await Promise.all([sourceDir, inputDir, checkerDir].map((dir) => fs.mkdir(dir)));
    await fs.writeFile(path.join(sourceDir, language.file), submission.code);

    if (language.compile) {
      const compile = await runContainer({
        image: language.image,
        command: language.compile,
        mounts: [mount(sourceDir, "/workspace", false)],
        timeoutMs: 15000,
        memoryMb: 512,
      });
      if (compile.exitCode !== 0 || compile.timedOut || compile.outputLimited) {
        return verdict(
          "Compilation Error",
          compile.timedOut ? "Compilation timed out." : compile.stderr.slice(0, 4000)
        );
      }
    }

    for (const testCase of problem.cases) {
      // Only the current input is visible to the contestant. Artifacts are read-only.
      await fs.writeFile(path.join(inputDir, "input.txt"), testCase.input || "");
      const result = await runContainer({
        image: language.image,
        command: ["/bin/sh", "-c", `exec ${language.run} < /input/input.txt`],
        mounts: [mount(sourceDir, "/workspace"), mount(inputDir, "/input")],
        timeoutMs: 2000,
      });
      executionTimeMs = Math.max(executionTimeMs, result.durationMs);
      if (result.outputLimited) return verdict("Output Limit Exceeded");
      if (result.timedOut) return verdict("Time Limit Exceeded");
      if (result.oomKilled) return verdict("Memory Limit Exceeded");
      if (result.exitCode !== 0) return verdict("Runtime Error");

      if (mode === "python") {
        // Separate container and mount: checker code/answers never reach the solution.
        await Promise.all([
          fs.writeFile(path.join(checkerDir, "checker.py"), problem.checkerCode),
          fs.writeFile(path.join(checkerDir, "input.txt"), testCase.input || ""),
          fs.writeFile(path.join(checkerDir, "expected.txt"), testCase.output || ""),
          fs.writeFile(path.join(checkerDir, "actual.txt"), result.stdout),
        ]);
        const check = await runContainer({
          image: PYTHON_IMAGE,
          command: ["python", "-I", "-c", CHECKER_RUNNER],
          mounts: [mount(checkerDir, "/workspace")],
          timeoutMs: 2000,
        });
        // The wrapper maps boolean True/False to 0/1. All other outcomes are checker failures.
        if (
          check.timedOut ||
          check.outputLimited ||
          check.oomKilled ||
          ![0, 1].includes(check.exitCode)
        ) {
          return verdict(
            "System Error",
            "The problem checker failed. Please contact the problem author."
          );
        }
        if (check.exitCode === 1) return verdict("Wrong Answer");
      } else if (normalizeOutput(result.stdout) !== normalizeOutput(testCase.output || "")) {
        return verdict("Wrong Answer");
      }
      passedCases++;
    }
    return verdict("Accepted");
  } catch (error) {
    console.error("[JudgeService] Evaluation failed:", error.message);
    return verdict(
      "System Error",
      "Judge environment unavailable. Please contact the administrator."
    );
  } finally {
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function judgeSubmission(submissionId) {
  // Atomic claim prevents two workers from judging the same Pending submission.
  const submission = await Submission.findOneAndUpdate(
    { _id: submissionId, status: "Pending" },
    { status: "Judging" },
    { new: true }
  );
  if (!submission) return;

  try {
    const problem = await Problem.findById(submission.problem);
    const result = problem
      ? await evaluateSubmission(problem, submission)
      : { status: "System Error", message: "Problem not found." };
    await Submission.findByIdAndUpdate(submissionId, result, { runValidators: true });
  } catch (error) {
    await Submission.findByIdAndUpdate(submissionId, {
      status: "System Error",
      message: "Failed to complete judging.",
    });
    throw error;
  }
}

module.exports = { judgeSubmission, evaluateSubmission, validateCheckerCode };
