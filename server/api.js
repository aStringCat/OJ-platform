const express = require("express");
const Problem = require("./models/problem");

const router = express.Router();

router.get("/problems", (_req, res) => {
  Problem.find({})
    .then((problems) => res.send(problems))
    .catch((err) => res.status(500).send({ msg: "Error fetching problems", error: err }));
});

router.get("/problem/:problemId", (req, res) => {
  Problem.findOne({ problem_id: req.params.problemId })
    .then((problem) => {
      if (!problem) {
        return res.status(404).send({ msg: "Problem not found" });
      }
      res.send(problem);
    })
    .catch((err) => res.status(500).send({ msg: "Error fetching problem", error: err }));
});

router.post("/problem", (req, res) => {
  const newProblem = new Problem({
    problem_id: req.body.problem_id,
    problem_name: req.body.problem_name,
    problem_difficulty: req.body.problem_difficulty,
    content: req.body.content,
    examples: req.body.examples || [],
  });

  newProblem
    .save()
    .then((problem) => res.send(problem))
    .catch((err) => res.status(500).send({ msg: "Error saving problem", error: err }));
});

router.post("/submit/:problemId", (req, res) => {
  const { problemId } = req.params;
  const { code, language } = req.body;
  console.log(`Submission for problem ${problemId}: Language: ${language}`);
  console.log("Code:", code);
  res.status(200).send({ msg: "Submission received", problemId, language });
});

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
