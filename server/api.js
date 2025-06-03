const express = require("express");
const Problem = require("./models/problem");
const User = require("./models/user");
const Submission = require("./models/submission");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const mongoose = require("mongoose");

// Import the judge service
const { judgeSubmission } = require("./judge"); // Adjust path if necessary

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).send({ msg: "Unauthorized. Please log in." });
};

// --- User Auth Routes ---
// ... (keep existing auth routes: /register, /login, /whoami, /logout) ...
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send({ msg: "Name, email, and password are required." });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).send({ msg: "User already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.status(201).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      msg: "User registered and logged in successfully",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send({ msg: "Server error during registration.", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ msg: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ msg: "Invalid credentials. User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ msg: "Invalid credentials. Password incorrect." });
    }

    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.status(200).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      msg: "Logged in successfully",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ msg: "Server error during login.", error: err.message });
  }
});

router.get("/whoami", (req, res) => {
  if (req.session.userId) {
    res.send({
      _id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
    });
  } else {
    res.status(401).send({ msg: "Not authenticated" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send({ msg: "Could not log out, please try again." });
    }
    res.clearCookie("connect.sid");
    res.status(200).send({ msg: "Logged out successfully." });
  });
});

// --- Problem Routes ---
// ... (keep existing problem routes: /problems, /problem/:problemId, /problem POST) ...
router.get("/problems", (_req, res) => {
  Problem.find({})
    .sort({ createdAt: -1 })
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

router.post("/problem", isAuthenticated, (req, res) => {
  const newProblem = new Problem({
    problem_id: req.body.problem_id,
    problem_name: req.body.problem_name,
    problem_difficulty: req.body.problem_difficulty,
    content: req.body.content,
    examples: req.body.examples || [],
    cases: req.body.cases || [],
  });

  newProblem
    .save()
    .then((problem) => res.send(problem))
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(400).send({
          msg: "Error saving problem. Problem ID might already exist.",
          error: err.message,
        });
      }
      res.status(500).send({ msg: "Error saving problem", error: err.message });
    });
});

// --- Submission Routes ---

// Submit solution
router.post("/submit/:problemId", isAuthenticated, upload.single("codeFile"), async (req, res) => {
  const { problemId } = req.params;
  const { language } = req.body; // Language from form data (e.g., hidden input or part of FormData)
  const userId = req.session.userId;

  if (!req.file) {
    return res.status(400).send({ msg: "No code file was uploaded." });
  }
  const code = req.file.buffer.toString("utf-8");

  if (!code || !language) {
    return res.status(400).send({ msg: "Code (from file) and language are required." });
  }

  // **Temporarily restrict to Python**
  if (language.toLowerCase() !== "python") {
    return res.status(400).send({ msg: "Only Python submissions are currently supported." });
  }

  try {
    const problem = await Problem.findOne({ problem_id: problemId });
    if (!problem) {
      return res.status(404).send({ msg: "Problem not found." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const newSubmission = new Submission({
      user: userObjectId,
      problem: problem._id,
      code,
      language,
      status: "Pending", // Initial status
    });

    const savedSubmission = await newSubmission.save();

    // Asynchronously trigger judging - DO NOT await this in the HTTP request handler
    // This allows the server to respond quickly to the user.
    judgeSubmission(savedSubmission._id).catch((err) => {
      console.error(`[API] Error triggering judge for submission ${savedSubmission._id}:`, err);
      // Attempt to mark the submission as a System Error if judge initiation fails
      Submission.findByIdAndUpdate(savedSubmission._id, {
        status: "System Error" /*, executionOutput: "Failed to initiate judging process." */,
      }).catch((dbErr) =>
        console.error(
          `[API] Failed to mark submission ${savedSubmission._id} as System Error after judge init failure:`,
          dbErr
        )
      );
    });

    res.status(201).send({
      msg: "Submission received and is pending evaluation.",
      submissionId: savedSubmission._id,
    });
  } catch (err) {
    console.error("[API] Submission error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).send({ msg: "Validation error for submission.", error: err.message });
    }
    res.status(500).send({ msg: "Server error during submission.", error: err.message });
  }
});

// Get all submissions for the logged-in user
router.get("/submissions", isAuthenticated, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);
    const submissions = await Submission.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("problem", "problem_id problem_name problem_difficulty"); // Populate problem details

    res.status(200).send(submissions);
  } catch (err) {
    console.error("[API] Error fetching submissions:", err);
    res.status(500).send({ msg: "Server error while fetching submissions.", error: err.message });
  }
});

// Get a single submission's details (for the owner)
router.get("/submission/:submissionId", isAuthenticated, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId).populate(
      "problem",
      "problem_id problem_name"
    ); // Populate basic problem details

    if (!submission) {
      return res.status(404).send({ msg: "Submission not found." });
    }

    if (submission.user.toString() !== req.session.userId) {
      return res.status(403).send({ msg: "Forbidden: You do not have access to this submission." });
    }

    res.status(200).send(submission);
  } catch (err) {
    console.error("[API] Error fetching single submission:", err);
    res.status(500).send({ msg: "Server error while fetching submission.", error: err.message });
  }
});

// --- Placeholder Judge Endpoints (can be removed or adapted if judge is internal) ---
// These were for a hypothetical external judge.
// Since judgeSubmission is now called internally, these might not be directly used in the same way.

router.get("/submissions/next_to_judge", async (_req, res) => {
  // This endpoint might still be useful for an external worker, or for internal prioritization logic
  // For now, it's not directly used by the judgeSubmission flow above.
  try {
    const submission = await Submission.findOneAndUpdate(
      { status: "Pending" },
      { $set: { status: "Judging" } },
      { sort: { createdAt: 1 }, new: true }
    ).populate("problem");

    if (!submission) {
      return res.status(200).send({ msg: "No pending submissions to judge." });
    }
    res.status(200).send(submission);
  } catch (err) {
    console.error("Error fetching submission for judging:", err);
    res
      .status(500)
      .send({ msg: "Server error while fetching submission for judging.", error: err.message });
  }
});

router.post("/submission/:submissionId/judge_result", async (req, res) => {
  // This endpoint would be called by an external judge.
  // The internal judgeSubmission directly updates the DB.
  const { submissionId } = req.params;
  const { status /*, output, error */ } = req.body;

  const validStatuses = Submission.schema.path("status").enumValues;
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).send({ msg: "Invalid or missing status for judging result." });
  }

  try {
    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { status: status /*, executionOutput: output || error */ },
      { new: true }
    );
    if (!updatedSubmission) {
      return res.status(404).send({ msg: "Submission not found to update." });
    }
    res
      .status(200)
      .send({ msg: "Submission status updated successfully.", submission: updatedSubmission });
  } catch (err) {
    console.error(`Error updating submission status for ${submissionId}:`, err);
    res
      .status(500)
      .send({ msg: "Server error while updating submission status.", error: err.message });
  }
});

// Catch-all for API routes not found
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
