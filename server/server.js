const validator = require("./validator");
validator.checkSetup();
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const api = require("./api");

const port = 3000;
const app = express();

mongoose
  .connect("mongodb://localhost:27017/mydatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connect to MongoDB"))
  .catch((err) => console.error("MongoDB 连接失败:", err));

app.use(validator.checkRoutes);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/api", api);

const reactPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(reactPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(reactPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) {
    console.log("The server errored when processing a request!");
    console.log(err);
  }

  res.status(status);
  res.send({
    status: status,
    message: err.message,
  });
});

const server = http.Server(app);

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
