const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const mongoose = require("mongoose");
const fs = require("node:fs");
const path = require("node:path");
const Problem = require("../server/models/problem");
const User = require("../server/models/user");
const Submission = require("../server/models/submission");
const { judgeSubmission } = require("../server/judge");
const { startJudgeWorker } = require("../server/judgeWorker");

test(
  "real MongoDB/API: auth, validation, private checker data, and atomic judging",
  { timeout: 60000 },
  async (t) => {
    // This suite creates and deletes only its own uniquely named database.
    const dbName = `kestrel_test_${process.pid}_${Date.now()}`;
    const baseUri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017";
    const uri = `${baseUri.replace(/\/$/, "")}/${dbName}`;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const child = spawn(process.execPath, ["server/server.js"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: "0", MONGODB_URI: uri, JUDGE_WORKER: "disabled" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    t.after(async () => {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await exited;
      }
      assert.equal(mongoose.connection.name, dbName);
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    });
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server start timed out")), 15000);
      child.stdout.on("data", (chunk) => {
        const match = chunk.toString().match(/Server running on port: (\d+)/);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Server exited ${code}`));
      });
      child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    });
    await Promise.all([Problem.init(), User.init(), Submission.init()]);
    let cookie = "";
    const request = async (route, data, method = data ? "POST" : "GET", auth = true) => {
      const response = await fetch(`http://127.0.0.1:${port}/api${route}`, {
        method,
        headers: {
          ...(auth && cookie ? { cookie } : {}),
          ...(data && !(data instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        },
        body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
      });
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await request("/submissions")).status, 401);
    assert.equal((await request("/register", { name: {}, email: {}, password: [] })).status, 400);
    assert.equal(
      (
        await request("/register", {
          name: "Checker Author",
          email: "author@example.com",
          password: "test-password",
        })
      ).status,
      201
    );
    const author = (await request("/whoami")).body;
    assert.ok(author._id);
    const checkerCode = fs.readFileSync(
      path.join(__dirname, "../examples/checkers/unordered-integers.py"),
      "utf8"
    );
    const problem = {
      problem_id: "CHECKER_1",
      problem_name: "Unordered integers",
      problem_difficulty: "easy",
      content: "Print the same integers in any order.",
      cases: [{ input: "1 2 2 3", output: "1 2 2 3" }],
      judgeMode: "python",
      checkerCode,
    };
    assert.equal((await request("/checker/validate", { checkerCode })).status, 200);
    assert.equal(
      (
        await request("/checker/validate", {
          checkerCode: "def check(input_data):\n    return True",
        })
      ).status,
      400
    );
    assert.equal((await request("/problem", { ...problem, checkerCode: "" })).status, 400);
    assert.equal(
      (
        await request("/problem", {
          ...problem,
          checkerCode: "def check(input_data):\n    return True",
        })
      ).status,
      400
    );
    assert.equal((await request("/problem", { ...problem, cases: [null] })).status, 400);
    assert.equal((await request("/problem", problem)).status, 201);
    assert.equal((await request("/problem", problem)).status, 400);
    for (const route of ["/problems", "/problem/CHECKER_1"]) {
      const response = await request(route, undefined, "GET", false);
      assert.equal(response.status, 200);
      const values = Array.isArray(response.body) ? response.body : [response.body];
      for (const value of values) {
        assert.equal(value.cases, undefined);
        assert.equal(value.checkerCode, undefined);
      }
    }
    const form = new FormData();
    form.append("language", "python");
    form.append("codeFile", new Blob(['print("3 2 1 2")']), "main.py");
    const submitted = await request("/submit/CHECKER_1", form);
    assert.equal(submitted.status, 201);
    const id = submitted.body.submissionId;
    await Promise.all([judgeSubmission(id), judgeSubmission(id)]);
    const result = await request(`/submission/${id}`);
    assert.equal(result.body.status, "Accepted");
    assert.equal(result.body.passedCases, 1);
    const queued = await request("/submit/CHECKER_1", form);
    const stopWorker = startJudgeWorker();
    try {
      const deadline = Date.now() + 15000;
      let status;
      do {
        status = (await request(`/submission/${queued.body.submissionId}`)).body.status;
        if (!["Pending", "Judging"].includes(status)) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } while (Date.now() < deadline);
      assert.equal(status, "Accepted", "database queue should finish a new submission");
    } finally {
      stopWorker();
    }
    assert.equal((await request("/submissions")).body[0].code, undefined);
    assert.equal((await request("/submission/invalid-id")).status, 404);
    assert.equal(
      (await request(`/submission/${id}/judge_result`, { status: "Accepted" }, "POST", false))
        .status,
      404
    );
    await request("/logout", {});
    await request("/register", {
      name: "Other",
      email: "other@example.com",
      password: "test-password",
    });
    assert.equal((await request(`/submission/${id}`)).status, 403);
  }
);
