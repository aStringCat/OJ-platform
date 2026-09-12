const validator = require("./validator");
validator.checkSetup();
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const api = require("./api");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { startJudgeWorker } = require("./judgeWorker");
const Submission = require("./models/submission");

const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mydatabase";
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production.");
}
const app = express();

app.use(validator.checkRoutes);

app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", api);

const reactPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(reactPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(reactPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  const status =
    err.code === "LIMIT_FILE_SIZE" ? 413 : err.name === "MulterError" ? 400 : err.status || 500;
  if (status === 500) {
    console.log("The server errored when processing a request!");
    console.log(err);
  }

  res.status(status);
  res.send({
    status: status,
    msg:
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum size is 5MB."
        : status === 500
          ? "Internal server error."
          : err.message,
  });
});

const server = http.Server(app);

mongoose
  .connect(mongoUrl, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    // This deployment runs one backend. Mark interrupted jobs visibly on restart.
    await Submission.updateMany(
      { status: "Judging" },
      {
        status: "System Error",
        message: "Judging was interrupted by a server restart. Please resubmit.",
      }
    );
    server.listen(port, () => {
      console.log(`Server running on port: ${server.address().port}`);
      if (process.env.JUDGE_WORKER !== "disabled") startJudgeWorker();
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
