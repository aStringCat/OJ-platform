import api from "./api";

const port = 3000;
const app = express();

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

server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
