const mongoose = require("mongoose");

const ProblemSchema = new mongoose.Schema({
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
},
{ timestamps: true }
);


module.exports = mongoose.model("problem", ProblemSchema);
