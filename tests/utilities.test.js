const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");

test("API utility preserves backend status/message for login and upload errors", async (t) => {
  const source = await fs.readFile(require.resolve("../client/src/utilities.js"), "utf8");
  const { get, post, ApiError } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
  const fetch = global.fetch;
  t.after(() => {
    global.fetch = fetch;
  });
  global.fetch = async () =>
    new Response(JSON.stringify({ msg: "Please log in." }), { status: 401 });
  await assert.rejects(
    get("/api/submissions"),
    (error) =>
      error instanceof ApiError && error.status === 401 && error.message === "Please log in."
  );
  global.fetch = async () =>
    new Response(JSON.stringify({ msg: "File too large." }), { status: 413 });
  await assert.rejects(
    post("/api/submit/P1", new FormData()),
    (error) => error.status === 413 && error.data.msg === "File too large."
  );
});
