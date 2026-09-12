const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    problem: {
      type: Schema.Types.ObjectId,
      ref: "problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
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
      ],
      default: "Pending",
    },
    message: { type: String, default: "" },
    passedCases: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubmissionSchema.index({ status: 1, createdAt: 1 });
SubmissionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("submission", SubmissionSchema);
