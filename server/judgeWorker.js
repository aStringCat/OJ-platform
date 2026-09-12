const Submission = require("./models/submission");
const { judgeSubmission } = require("./judge");

// A small database-backed queue: Pending work survives a server restart.
function startJudgeWorker() {
  const concurrency = Math.max(
    1,
    Math.min(8, Math.floor(Number(process.env.JUDGE_CONCURRENCY) || 2))
  );
  let stopped = false;
  let timer;

  const poll = async () => {
    try {
      const pending = await Submission.find({ status: "Pending" })
        .sort({ createdAt: 1 })
        .limit(concurrency)
        .select("_id");
      await Promise.all(
        pending.map((submission) =>
          judgeSubmission(submission._id).catch((error) => console.error("[JudgeWorker]", error))
        )
      );
    } catch (error) {
      console.error("[JudgeWorker] Failed to poll submissions:", error.message);
    } finally {
      if (!stopped) timer = setTimeout(poll, 1000);
    }
  };
  poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

module.exports = { startJudgeWorker };
