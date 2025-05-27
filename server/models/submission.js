const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubmissionSchema = new mongoose.Schema({
  user_id: String,
  problem_id: String,
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