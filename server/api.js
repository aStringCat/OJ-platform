import express from "express";

const Problem = require("./models/problem");
const router = express.Router();

router.get("/problems", (_req, res) => {
  Problem.find({}).then((stories) => res.send(stories));
});

router.post("/problem", (req, res) => {
  const newProblem = new Story({
    problem_id: req.body.problem_id,
    problem_name: req.body.problem_name,
    problem_difficulty: req.body.problem_difficulty,
    content: req.body.content,
  });

  newProblem.save().then((problem) => res.send(problem));
});

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
