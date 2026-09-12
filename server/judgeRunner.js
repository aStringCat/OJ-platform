const { Writable } = require("stream");
const os = require("os");
const docker = require("./docker");

const OUTPUT_LIMIT_BYTES = 1024 * 1024;

// The same bounded runner is used for compilation, solutions, and Python checkers.
async function runContainer({ image, command, mounts, timeoutMs, memoryMb = 256 }) {
  let container;
  let stream;
  let timer;
  let timedOut = false;
  let outputLimited = false;
  let bytes = 0;
  const stdout = [];
  const stderr = [];
  let stopPromise;

  const stop = () => {
    if (!stopPromise) {
      stopPromise = container.kill().catch((error) => {
        if (![304, 404, 409].includes(error.statusCode)) throw error;
      });
      // Awaited below; avoid an unhandled rejection while the stream drains.
      stopPromise.catch(() => {});
    }
  };
  const collect = (chunks) =>
    new Writable({
      write(chunk, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > OUTPUT_LIMIT_BYTES) {
          outputLimited = true;
          stop();
        } else {
          chunks.push(Buffer.from(chunk));
        }
        callback();
      },
    });

  try {
    const uid = os.userInfo().uid || 65534;
    const gid = os.userInfo().gid || 65534;
    container = await docker.createContainer({
      Image: image,
      Cmd: command,
      WorkingDir: "/workspace",
      User: `${uid}:${gid}`,
      Env: ["PYTHONDONTWRITEBYTECODE=1", "HOME=/tmp"],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Labels: { "kestrel.judge": "true" },
      HostConfig: {
        Mounts: mounts,
        NetworkMode: "none",
        Memory: memoryMb * 1024 * 1024,
        MemorySwap: memoryMb * 1024 * 1024,
        NanoCpus: 1000000000,
        PidsLimit: 64,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges:true"],
        ReadonlyRootfs: true,
        Tmpfs: { "/tmp": "rw,nosuid,nodev,size=64m" },
        Ulimits: [{ Name: "fsize", Soft: 16777216, Hard: 16777216 }],
        LogConfig: { Type: "none" },
      },
    });
    stream = await container.attach({ stream: true, stdout: true, stderr: true });
    const drained = new Promise((resolve, reject) => {
      stream.once("end", resolve);
      stream.once("error", reject);
    });
    drained.catch(() => {});
    docker.modem.demuxStream(stream, collect(stdout), collect(stderr));
    await container.start();
    const startedAt = Date.now();
    timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    const result = await container.wait();
    const durationMs = Date.now() - startedAt;
    clearTimeout(timer);
    await drained;
    if (stopPromise) await stopPromise;
    let details = await container.inspect();
    // Give the daemon a short chance to publish OOM state before classifying
    // an otherwise unexplained SIGKILL. Exit 137 alone is not proof of OOM.
    for (
      let retry = 0;
      result.StatusCode === 137 &&
      !timedOut &&
      !outputLimited &&
      !details.State.OOMKilled &&
      retry < 3;
      retry++
    ) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      details = await container.inspect();
    }
    return {
      exitCode: result.StatusCode,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8"),
      timedOut,
      outputLimited,
      oomKilled: Boolean(details.State.OOMKilled),
      durationMs,
    };
  } finally {
    clearTimeout(timer);
    if (stream) stream.destroy();
    if (container) {
      await container.remove({ force: true }).catch((error) => {
        if (error.statusCode !== 404) console.error("Failed to remove judge container:", error);
      });
    }
  }
}

module.exports = { runContainer };
