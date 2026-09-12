const express = require("express");
const Problem = require("./models/problem");
const User = require("./models/user");
const Submission = require("./models/submission");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const mongoose = require("mongoose");
const { validateCheckerCode } = require("./judge");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = express.Router();
const supportedLanguages = {
  c: [".c"],
  cpp: [".cpp", ".cc", ".cxx"],
  python: [".py"],
  java: [".java"],
};

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).send({ msg: "Unauthorized. Please log in." });
};

// --- User Auth Routes ---
// ... (keep existing auth routes: /register, /login, /whoami, /logout) ...
router.post("/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;

  if (
    !name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    !password
  ) {
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

    await new Promise((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve()))
    );
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.status(201).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      msg: "User registered and logged in successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send({ msg: "User already exists with this email." });
    }
    console.error("Registration error:", err);
    res.status(500).send({ msg: "Server error during registration.", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;

  if (!email || typeof password !== "string" || !password) {
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

    await new Promise((resolve, reject) =>
      req.session.regenerate((error) => (error ? reject(error) : resolve()))
    );
    req.session.userId = user._id.toString();
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

router.post("/checker/validate", isAuthenticated, async (req, res) => {
  const result = await validateCheckerCode(req.body.checkerCode);
  if (result.systemError) {
    return res.status(503).send(result);
  }
  res.status(result.valid ? 200 : 400).send(result);
});

// --- Problem Routes ---
// ... (keep existing problem routes: /problems, /problem/:problemId, /problem POST) ...
router.get("/problems", (_req, res) => {
  Problem.find({})
    .select("problem_id problem_name problem_difficulty createdAt")
    .sort({ createdAt: -1 })
    .then((problems) => res.send(problems))
    .catch((err) => res.status(500).send({ msg: "Error fetching problems", error: err }));
});

router.get("/problem/:problemId", (req, res) => {
  Problem.findOne({ problem_id: req.params.problemId })
    .select("-cases -checkerCode")
    .then((problem) => {
      if (!problem) {
        return res.status(404).send({ msg: "Problem not found" });
      }
      res.send(problem);
    })
    .catch((err) => res.status(500).send({ msg: "Error fetching problem", error: err }));
});

router.post("/problem", isAuthenticated, async (req, res) => {
  const {
    problem_id,
    problem_name,
    problem_difficulty,
    content,
    examples = [],
    cases,
    judgeMode = "standard",
    checkerCode = "",
  } = req.body;

  if (
    [problem_id, problem_name, content].some((value) => typeof value !== "string" || !value.trim())
  ) {
    return res.status(400).send({ msg: "Problem ID, name, and content are required." });
  }
  if (!["easy", "medium", "hard"].includes(problem_difficulty)) {
    return res.status(400).send({ msg: "Difficulty must be easy, medium, or hard." });
  }
  if (!/^[A-Za-z0-9_-]+$/.test(problem_id.trim())) {
    return res
      .status(400)
      .send({ msg: "Problem ID may contain letters, numbers, underscores, and hyphens." });
  }
  if (
    !["standard", "python"].includes(judgeMode) ||
    typeof checkerCode !== "string" ||
    Buffer.byteLength(checkerCode, "utf8") > 65536 ||
    (judgeMode === "python" && !checkerCode.trim())
  ) {
    return res
      .status(400)
      .send({ msg: "Select a valid judge mode and provide a Python checker (maximum 64KB)." });
  }
  if (judgeMode === "python") {
    const checkerValidation = await validateCheckerCode(checkerCode);
    if (!checkerValidation.valid) {
      return res.status(checkerValidation.systemError ? 503 : 400).send({
        msg: checkerValidation.message,
        valid: false,
      });
    }
  }
  if (
    !Array.isArray(examples) ||
    examples.some(
      (example) =>
        !example ||
        typeof example.input !== "string" ||
        typeof example.output !== "string" ||
        !example.output ||
        (example.explanation !== undefined && typeof example.explanation !== "string")
    )
  ) {
    return res.status(400).send({ msg: "Examples must include string input and output fields." });
  }
  if (!Array.isArray(cases) || cases.length === 0 || cases.length > 100) {
    return res.status(400).send({ msg: "Provide between 1 and 100 test cases." });
  }
  if (
    cases.some(
      (problemCase) =>
        !problemCase ||
        typeof problemCase.input !== "string" ||
        typeof problemCase.output !== "string"
    )
  ) {
    return res.status(400).send({ msg: "Every test case must include input and output." });
  }

  const newProblem = new Problem({
    problem_id: problem_id.trim(),
    problem_name: problem_name.trim(),
    problem_difficulty,
    content: content.trim(),
    judgeMode,
    checkerCode: judgeMode === "python" ? checkerCode : "",
    examples,
    cases,
  });

  newProblem
    .save()
    .then((problem) =>
      res.status(201).send({
        _id: problem._id,
        problem_id: problem.problem_id,
        problem_name: problem.problem_name,
      })
    )
    .catch((err) => {
      if (err.code === 11000) {
        return res.status(400).send({
          msg: "Error saving problem. Problem ID might already exist.",
          error: err.message,
        });
      }
      res
        .status(err.name === "ValidationError" ? 400 : 500)
        .send({ msg: "Error saving problem", error: err.message });
    });
});

// --- Submission Routes ---

// Submit solution
router.post("/submit/:problemId", isAuthenticated, upload.single("codeFile"), async (req, res) => {
  const { problemId } = req.params;
  const language = typeof req.body.language === "string" ? req.body.language.toLowerCase() : "";
  const userId = req.session.userId;

  if (!req.file) {
    return res.status(400).send({ msg: "No code file was uploaded." });
  }
  const code = req.file.buffer.toString("utf-8");

  if (!code.trim() || !language) {
    return res.status(400).send({ msg: "Code (from file) and language are required." });
  }

  if (!Object.hasOwn(supportedLanguages, language)) {
    return res.status(400).send({ msg: "Unsupported programming language." });
  }

  const fileName = req.file.originalname.toLowerCase();
  if (!supportedLanguages[language].some((extension) => fileName.endsWith(extension))) {
    return res.status(400).send({ msg: "The uploaded file does not match the selected language." });
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

    // The bounded worker picks up Pending submissions from MongoDB.

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
      .select("-code -message")
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
  if (!mongoose.isValidObjectId(req.params.submissionId)) {
    return res.status(404).send({ msg: "Submission not found." });
  }

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

// Catch-all for API routes not found
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
