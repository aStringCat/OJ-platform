const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubmissionSchema = new mongoose.Schema({
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
    enum: ["Pending", "Accepted", "Wrong Answer", "Time Limit Exceeded", "Compilation Error"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("submission", SubmissionSchema);