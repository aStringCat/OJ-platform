const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Problem = require("../server/models/problem");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mydatabase");
  try {
    const problemId = "DEMO_UNORDERED";
    const checkerCode = await fs.readFile(
      path.join(__dirname, "checkers/unordered-integers.py"),
      "utf8"
    );
    await Problem.findOneAndUpdate(
      { problem_id: problemId },
      {
        problem_id: problemId,
        problem_name: "Unordered Integers (Python Checker Demo)",
        problem_difficulty: "easy",
        content:
          "Read a list of integers and print the same integers in any order.\n\n```python\nvalues = input().split()\nprint(*reversed(values))\n```\n\nKeep every duplicate. Order and whitespace do not matter.",
        judgeMode: "python",
        checkerCode,
        examples: [
          {
            input: "1 2 2 3",
            output: "3 2 1 2",
            explanation: "All integers and their multiplicities are preserved.",
          },
        ],
        cases: [
          { input: "1 2 2 3\n", output: "1 2 2 3\n" },
          { input: "-5 0 -5 8\n", output: "-5 0 -5 8\n" },
          { input: "42\n", output: "42\n" },
        ],
      },
      { upsert: true, runValidators: true }
    );
    console.log(
      `Created or updated /problem/${problemId}. Submit examples/solutions/unordered.py.`
    );
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
