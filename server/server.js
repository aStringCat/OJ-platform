import express from "express";
import mongoose from "mongoose";
import api from "./api.js";

const port = 3000;
const app = express();

app.use(express.json());

app.use("/api", api);

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

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
