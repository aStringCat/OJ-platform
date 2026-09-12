const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { evaluateSubmission } = require("../server/judge");
const docker = require("../server/docker");

const checkerCode = fs.readFileSync(
  path.join(__dirname, "../examples/checkers/unordered-integers.py"),
  "utf8"
);
const problem = { judgeMode: "standard", cases: [{ input: "", output: "1 2 2 3\n" }] };
const check = async (data, code, status, language = "python") => {
  const result = await evaluateSubmission(data, { code, language });
  assert.equal(result.status, status, JSON.stringify(result));
  return result;
};

test.before(async () => {
  await docker.ping();
});

test("standard comparator handles CRLF and trailing newline, preserves leading whitespace", async () => {
  await check(problem, 'print("1 2 2 3")', "Accepted");
  await check(problem, 'print("3 2 1 2")', "Wrong Answer");
  await check({ cases: [{ input: "", output: " 1\r\n" }] }, 'print(" 1")', "Accepted");
  await check({ cases: [{ input: "", output: " 1" }] }, 'print("1")', "Wrong Answer");
});

test("Python checker accepts reordered multiset but rejects missing duplicates and invalid tokens", async () => {
  const data = { ...problem, judgeMode: "python", checkerCode };
  await check(data, 'print("3 2 1 2")', "Accepted");
  await check(data, 'print("1 2 3")', "Wrong Answer");
  await check(data, 'print("not integers")', "Wrong Answer");
});

test("checker exceptions, syntax errors, timeouts, and invalid returns are system errors", async () => {
  for (const script of [
    "def check(input_data, expected_output, actual_output):\n    raise ValueError('bad checker')",
    "def check(input_data, expected_output, actual_output)\n    return True",
    "def check(input_data, expected_output, actual_output):\n    while True: pass",
    "def check(input_data, expected_output, actual_output):\n    return 'yes'",
    "def other(input_data, expected_output, actual_output):\n    return True",
  ]) {
    await check(
      { ...problem, judgeMode: "python", checkerCode: script },
      'print("1")',
      "System Error"
    );
  }
});

test("solutions cannot read checker/reference files or change artifacts between cases", async () => {
  await check(
    { ...problem, judgeMode: "python", checkerCode, cases: [...problem.cases, ...problem.cases] },
    [
      "from pathlib import Path",
      "assert not Path('/workspace/checker.py').exists()",
      "assert not Path('/workspace/expected.txt').exists()",
      "try:",
      "    Path('/workspace/tampered').write_text('bad')",
      "except OSError:",
      "    pass",
      "else:",
      "    raise RuntimeError('workspace is writable')",
      "print('3 2 1 2')",
    ].join("\n"),
    "Accepted"
  );
});

test("runtime, time, output, and empty-case failures are classified", async () => {
  await check(problem, "raise RuntimeError('error')", "Runtime Error");
  await check(problem, "while True: pass", "Time Limit Exceeded");
  await check(problem, "while True: print('x' * 10000)", "Output Limit Exceeded");
  await check(problem, "data = bytearray(512 * 1024 * 1024)", "Memory Limit Exceeded");
  await check(problem, "import sys; sys.exit(137)", "Runtime Error");
  await check({ cases: [] }, "print(1)", "System Error");
});

test("floating checker rejects NaN/infinity and accepts rounding differences", async () => {
  const checker = fs.readFileSync(
    path.join(__dirname, "../examples/checkers/float-tolerance.py"),
    "utf8"
  );
  const data = {
    judgeMode: "python",
    checkerCode: checker,
    cases: [{ input: "", output: "0.333333333333" }],
  };
  await check(data, "print(0.333333)", "Accepted");
  await check(data, "print('nan')", "Wrong Answer");
  await check(data, "print('inf')", "Wrong Answer");
});

test("C/C++/Java compilation and execution still work", async () => {
  await check(problem, '#include <stdio.h>\nint main(){ puts("1 2 2 3"); }', "Accepted", "c");
  await check(
    problem,
    '#include <iostream>\nint main(){ std::cout << "1 2 2 3"; }',
    "Accepted",
    "cpp"
  );
  await check(
    problem,
    'public class Main { public static void main(String[] args) { System.out.println("1 2 2 3"); } }',
    "Accepted",
    "java"
  );
  await check(problem, "int main( {", "Compilation Error", "c");
});
