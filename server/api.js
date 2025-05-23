const express = require("express");
const Problem = require("./models/problem");
const User = require("./models/user");
const bcrypt = require("bcryptjs");

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
router.post("/submit/:problemId", isAuthenticated, (req, res) => {
  // Added isAuthenticated middleware
  const { problemId } = req.params;
  const { code, language } = req.body;
  // console.log(`Submission for problem ${problemId} by user ${req.session.userId}: Language: ${language}`);
  // console.log("Code:", code);
  // TODO: Implement actual code submission and judging logic
  res.status(200).send({
    msg: "Submission received (mock response)",
    problemId,
    language,
    userId: req.session.userId,
  });
});

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
