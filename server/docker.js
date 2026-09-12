const Docker = require("dockerode");
const { execFileSync } = require("child_process");

// Dockerode does not read CLI contexts; support local Colima/Docker Desktop as well.
let options;
if (!process.env.DOCKER_HOST) {
  try {
    const endpoint = execFileSync(
      "docker",
      ["context", "inspect", "--format", "{{.Endpoints.docker.Host}}"],
      { encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (endpoint.startsWith("unix://")) {
      options = { socketPath: endpoint.slice(7) };
    }
  } catch (_error) {
    // Fall back to Dockerode's standard local socket.
  }
}

module.exports = new Docker({ ...options, timeout: 30000 });
