# Kestrel Online Judge Platform

### About This Platform

Kestrel is an Online Judge (OJ) platform for programming practice. Users can browse problems, submit Python, C, C++, or Java solutions, and track results. Signed-in users can currently add problems. Problems support standard output comparison or custom Python checkers. Contest management and administrator roles are not implemented yet.

The frontend is built with React and Vite, utilizing Material UI for components. The backend is powered by Node.js and Express, with MongoDB as the database.

### Getting Started

**Prerequisites:**

- Node.js (version >=20.x)
- npm (comes with Node.js)
- Docker (Docker Desktop or Colima) and Docker Compose
- MongoDB is supplied by the included Compose configuration

**Setup and Running:**

1.  **Install Dependencies:**
    Open your terminal, navigate to the project's root directory, and run:

    ```bash
    npm ci
    ```

2.  **Start MongoDB and pull judge images:**

    ```bash
    docker compose up -d --wait mongodb
    docker pull python:3.12-slim
    docker pull gcc:14
    docker pull eclipse-temurin:21-jdk
    ```

    On a Homebrew installation exposing Compose as a standalone command, use
    `docker-compose` in place of `docker compose`. Start Colima first with
    `colima start` when applicable. The judge detects local Unix sockets from the
    active Docker CLI context; `DOCKER_HOST` takes precedence.

    MongoDB listens only on `127.0.0.1:27017` and persists data in the named volume
    `kestrel-oj_mongo-data`. Stop it with `docker compose stop mongodb`; do not use
    `down -v` unless you intend to delete its data. This is a local development
    configuration without database authentication.

3.  **Run the Backend Server:**
    In one terminal window, start the backend server:

    ```bash
    npm start
    ```

    This uses `nodemon` to run `server/server.js`, so the server will automatically restart if you make changes to backend files. The backend server runs on port 3000 by default.

4.  **Run the Frontend Development Server:**
    In a second terminal window, start the Vite frontend development server:

    ```bash
    npm run dev
    ```

    This will start the React application. The frontend development server typically runs on port 5173.

5.  **Access the Platform:**
    Open your web browser and navigate to:
    `http://localhost:5173`

    API requests from the frontend to `/api` will be proxied to the backend server running on `http://localhost:3000`.

### Python Checker Example

```bash
npm run seed:checker
```

Open `/problem/DEMO_UNORDERED`, sign in, and upload
[`examples/solutions/unordered.py`](examples/solutions/unordered.py). The solution
reverses the input integers. For standard output `1 2 2 3`, output `3 2 1 2` is
accepted by this checker, while `1 2 3` is rejected because a duplicate is missing.
The seed command creates or updates this dedicated demo problem.

To create another checker problem, use **Add Problem → Judge Mode → Python checker**.
Paste your script or click **Load unordered integers example** and add test cases.
The corresponding API fields are `judgeMode: "python"` and `checkerCode` (source
text, at most 64KB). Standard comparison remains the default for existing problems.

The checker must define exactly one top-level function with this signature:

```python
def check(input_data, expected_output, actual_output):
    return actual_output.strip() == expected_output.strip()
```

All three arguments are strings. Return the actual boolean `True` to accept or
`False` for Wrong Answer. Returning another type, omitting the function, using the
wrong signature, raising an exception, timing out, or exceeding a resource limit
produces `System Error`. The Add Problem page includes this demo, a rendered code
preview, and a **Check Script** button. Saving a checker problem repeats the syntax
and function-signature validation on the server.

Examples:

- [Unordered integers, preserving duplicates](examples/checkers/unordered-integers.py)
- [Floating-point tolerance, rejecting NaN/infinity](examples/checkers/float-tolerance.py)

Checkers can validate a constructed answer from the input alone; the reference
output field may be empty. This is an output checker, not an interactive judge:
the contestant finishes before the checker starts. It supports Python's standard
library; there is no network access or package installation inside the container.

### Judge behavior and configuration

- Each case runs in a fresh container. Solution artifacts are mounted read-only;
  the solution sees only the current input, never checker source or reference output.
- The checker runs separately with read-only inputs. Its stdout/stderr are not
  sent to contestants, so a checker cannot accidentally disclose reference data.
- Solutions/checkers have a 2-second wall-time limit, 256MB memory, one CPU,
  64 processes/threads, and 1MB combined stdout/stderr limit. Compilation has
  15 seconds and 512MB. Java uses a 128MB heap within the container limit.
- Containers use a non-root UID, disabled network, dropped capabilities,
  `no-new-privileges`, Docker's default seccomp, and a read-only root filesystem.
  These follow [Docker's isolation guidance](https://docs.docker.com/engine/security/).
- Standard comparison normalizes CRLF to LF and ignores whitespace at the end of
  the complete output. Leading and internal whitespace remain significant.
- MongoDB-backed Pending jobs are consumed with bounded concurrency (default 2).
  Atomic claiming avoids duplicate evaluation. This deployment supports **one
  backend process**: startup marks interrupted Judging jobs as System Error and
  resumes Pending jobs. Multiple backend replicas need worker leases and heartbeats.
- See [.env.example](.env.example) for environment variables. Export them in your
  shell; the app does not automatically read `.env`. `SESSION_SECRET` is mandatory
  in production; in development an omitted secret is regenerated on restart.
  `MONGODB_URI` defaults to `mongodb://127.0.0.1:27017/mydatabase`.
- Judge temporary files default to `.judge-tmp/` in this repository, a path normally
  shared with Docker Desktop/Colima. `JUDGE_TEMP_DIR` must be an absolute directory
  accessible by the local Docker daemon. Remote Docker bind mounts are not supported.

### Verification

```bash
npm test              # Model and API-client regression checks
npm run test:judge    # Real Docker executions; requires the three judge images
npm run test:api      # Real MongoDB + Docker + HTTP integration
npm run build        # Production frontend
```

The API suite creates a uniquely named `kestrel_test_*` database and removes only
that database afterward. `TEST_MONGODB_URI` can specify a different MongoDB server
address without a database path. `npm run build` produces `client/dist`, which the
backend serves on port 3000.

See [the project review](docs/project-review.md) for completed repairs and remaining work.
