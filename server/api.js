const express = require("express");
const Problem = require("./models/problem");
const User = require("./models/user");
const Submission = require("./models/submission");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const mongoose = require("mongoose");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).send({ msg: "Unauthorized. Please log in." });
};

// --- User Auth Routes ---

// User Registration
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

    // Automatically log in the user after registration
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

// User Login
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

// Get Current User (whoami)
router.get("/whoami", (req, res) => {
  if (req.session.userId) {
    res.send({
      _id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
    });
  } else {
    // It's better to send a 200 with null or specific structure if no user,
    // or let client handle 401 gracefully. For now, 401 is okay.
    res.status(401).send({ msg: "Not authenticated" });
  }
});

// User Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send({ msg: "Could not log out, please try again." });
    }
    // The session cookie is typically named 'connect.sid' by default with express-session
    res.clearCookie("connect.sid"); // Ensure the session cookie is cleared
    res.status(200).send({ msg: "Logged out successfully." });
  });
});

// --- Problem Routes (Existing) ---
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

// Protected route: Add new problem
router.post("/problem", isAuthenticated, (req, res) => {
  // Added isAuthenticated middleware
  const newProblem = new Problem({
    problem_id: req.body.problem_id,
    problem_name: req.body.problem_name,
    problem_difficulty: req.body.problem_difficulty,
    content: req.body.content,
    examples: req.body.examples || [],
    // Consider adding author/creator ID: req.session.userId
  });

  newProblem
    .save()
    .then((problem) => res.send(problem))
    .catch((err) => {
      if (err.code === 11000) {
        // Duplicate key error (e.g. problem_id)
        return res.status(400).send({
          msg: "Error saving problem. Problem ID might already exist.",
          error: err.message,
        });
      }
      res.status(500).send({ msg: "Error saving problem", error: err.message });
    });
});

// Protected route: Submit solution
router.post("/submit/:problemId", isAuthenticated, upload.single("codeFile"), async (req, res) => {
  const { problemId } = req.params;
  // `language` 字段仍然从 req.body 中获取'language' 字段仍然从 req.body 中获取
  const { language } = req.body;
  const userId = req.session.userId;

  // 检查文件是否上传
  if (!req.file) {
    return res.status(400).send({ msg: "No code file was uploaded." });
  }

  // 从内存中的文件 Buffer 读取代码
  const code = req.file.buffer.toString("utf-8");

  if (!code || !language) {
    return res.status(400).send({ msg: "Code (from file) and language are required." });
  }

  try {
    const problem = await Problem.findOne({ problem_id: problemId });
    if (!problem) {
      return res.status(404).send({ msg: "Problem not found." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const newSubmission = new Submission({
      user: userObjectId, // 使用转换后的 ObjectId
      problem: problem._id,
      code,
      language,
    });

    await newSubmission.save();

    res.status(201).send({
      msg: "Submission received and is pending evaluation.",
      submissionId: newSubmission._id,
    });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).send({ msg: "Server error during submission.", error: err.message });
  }
});

// Get all submissions for the logged-in user
router.get("/submissions", isAuthenticated, async (req, res) => {
  try {
    // 将 session 中的字符串 ID 转换为 ObjectId 类型
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    const submissions = await Submission.find({ user: userId }) // 使用转换后的ID进行查询
      .sort({ createdAt: -1 })
      .populate("problem", "problem_id problem_name problem_difficulty");

    res.status(200).send(submissions);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).send({ msg: "Server error while fetching submissions.", error: err.message });
  }
});

// Get a single submission's details
// This allows a user to view their own past submission details
router.get("/submission/:submissionId", isAuthenticated, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId).populate(
      "problem",
      "problem_id problem_name"
    );

    if (!submission) {
      return res.status(404).send({ msg: "Submission not found." });
    }

    // Ensure the user is requesting their own submission
    if (submission.user.toString() !== req.session.userId) {
      return res.status(403).send({ msg: "Forbidden: You do not have access to this submission." });
    }

    res.status(200).send(submission);
  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).send({ msg: "Server error while fetching submission.", error: err.message });
  }
});

// Endpoint for a hypothetical judging service to fetch the next submission to evaluate.
// This provides the "space" for the judging logic.
router.get("/submissions/next_to_judge", async (req, res) => {
  // In a real system, this endpoint should be protected (e.g., by IP or a secret key)
  try {
    const submission = await Submission.findOneAndUpdate(
      { status: "Pending" }, // Find a pending submission
      { $set: { status: "Judging" } }, // Set its status to Judging to prevent race conditions
      { sort: { createdAt: 1 }, new: true } // Get the oldest one and return the updated document
    ).populate("problem"); // Populate the full problem details for the judge

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

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
