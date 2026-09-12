const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Problem = require("../server/models/problem");
const Submission = require("../server/models/submission");

test("legacy problems use standard judging; checker configuration persists", () => {
  const problem = new Problem({
    problem_id: "P1",
    problem_name: "Test",
    content: "Test",
    problem_difficulty: "easy",
    cases: [{ input: "", output: "" }],
  });
  assert.equal(problem.validateSync(), undefined);
  assert.equal(problem.judgeMode, "standard");
  problem.judgeMode = "python";
  problem.checkerCode = "def check(input_data, expected_output, actual_output):\n    return True";
  assert.equal(problem.toObject().checkerCode, problem.checkerCode);
  problem.judgeMode = "unknown";
  assert.ok(problem.validateSync().errors.judgeMode);
});

test("all actual judge outcomes can be saved", () => {
  for (const status of [
    "Pending",
    "Judging",
    "Accepted",
    "Wrong Answer",
    "Time Limit Exceeded",
    "Compilation Error",
    "Runtime Error",
    "System Error",
    "Memory Limit Exceeded",
    "Output Limit Exceeded",
  ]) {
    const submission = new Submission({
      user: new mongoose.Types.ObjectId(),
      problem: new mongoose.Types.ObjectId(),
      code: "print(1)",
      language: "python",
      status,
    });
    assert.equal(submission.validateSync(), undefined, status);
  }
});
