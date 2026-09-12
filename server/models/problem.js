const mongoose = require("mongoose");

const ProblemSchema = new mongoose.Schema(
  {
    problem_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    problem_name: {
      type: String,
      required: true,
      trim: true,
    },
    problem_difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    judgeMode: {
      type: String,
      enum: ["standard", "python"],
      default: "standard",
    },
    checkerCode: { type: String, default: "", maxlength: 65536 },
    examples: [
      {
        input: { type: String, default: "" },
        output: { type: String, required: true },
        explanation: String,
      },
    ],
    cases: [
      {
        input: { type: String, default: "" },
        output: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("problem", ProblemSchema);
