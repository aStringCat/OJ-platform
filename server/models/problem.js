import { Schema, model } from "mongoose";

const ProblemSchema = new Schema({
  problem_id: String,
  problem_name: String,
  problem_difficulty: String,
  content: String,
  examples: [
    {
      input: String,
      output: String,
      explanation: String,
    },
  ],
});

export default model("problem", ProblemSchema);
