# Project review — 2026-09-12

The existing React/MUI pages, Express router, and Mongoose models remain the main
structure. The judge is split into three small CommonJS modules: Docker execution
(`judgeRunner.js`), evaluation (`judge.js`), and queue polling (`judgeWorker.js`).

## Completed repairs and improvements

| Previous gap                                           | Current behavior                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Dashboard contained only a heading                     | Problem count, distinct solved problems, accepted/total submissions, recent submissions and navigation use API data |
| Submission pages remained Pending/Judging              | Details and history poll pending results and clean up timers on navigation                                          |
| Logged-out submission pages remained loading           | Redirect to login with return location                                                                              |
| Profile loading branch referenced a missing component  | CircularProgress import restored                                                                                    |
| API errors became strings and lost the server message  | ApiError preserves status, message and response data                                                                |
| Hidden test data was publicly returned                 | Public endpoints exclude cases and checker source; retired unauthenticated judge-result endpoints removed           |
| Backend trusted the create-problem form                | Type, difficulty, ID, case count, checker mode and checker size validation; unique problem ID and email indexes     |
| Runtime error logging referenced undefined stderr      | Bounded stdout/stderr collection; Runtime/System/Memory/Output errors included in schema                            |
| Every submission immediately launched Docker work      | Database-backed queue with bounded concurrency and atomic claim                                                     |
| Compile timeout did not reliably terminate compilation | Explicit deadline, forced termination, and container cleanup                                                        |
| Output comparison was the only judging method          | Isolated Python `check(input, expected, actual)` function returning a strict boolean, with UI/server validation     |
| No test cases could incorrectly be Accepted            | System Error for unconfigured test data                                                                             |
| Form trimmed whitespace-sensitive test input/output    | Raw input/output preserved, including empty input/output                                                            |
| All pages loaded in one frontend bundle                | Route-level lazy loading                                                                                            |
| List responses included every submitted source file    | Submission lists omit source code; details load it only for the owner                                               |
| MongoDB/session configuration hard-coded               | Compose persistent database, environment configuration, DB-ready startup, randomized development session secret     |
| No repeatable automated verification                   | Unit checks and real Docker/MongoDB/API tests, committed dependency lockfile                                        |

## Remaining functionality, in priority order

Verification completed: production Vite build, three unit tests, seven real Docker
judge tests, and one real MongoDB/HTTP integration test passed. Public example
rendering and logged-out submission-page redirection were checked in the browser.
The build still reports a 514KB shared entry chunk; lazy loading reduced the previous
661KB entry, but further shared-dependency optimization remains possible.

1. **Administrator/author permissions and problem editing.** All signed-in accounts
   can currently create problems. Add role management, author ownership, revision
   history, and explicit rejudge behavior before treating this as a public OJ.
   A judge-mode selector is not an authorization boundary.
2. **Backend pagination and filtering.** Problems and personal submission history
   still load the full list for client-side pagination. Add cursor pagination,
   problem search/difficulty/status filters, and database-side dashboard aggregation
   for larger datasets.
3. **Distributed worker reliability.** Current recovery assumes a single backend.
   Add leases, heartbeat, idempotent results, stale-container cleanup after host
   failure, and a separate worker service before horizontal scaling. Rate limits,
   per-user queue quotas and total workspace disk quotas are also still needed.
4. **Problem-specific limits and result detail.** Time/memory limits are currently
   fixed. Allow per-problem settings, testcase groups/scoring, and staff-only
   checker diagnostics. Wall time is available; precise CPU and peak-memory
   accounting remain future work.
5. **Contests and standings.** The previous sidebar links led to 404s; those links
   are removed. Scheduling, registration, contest scoring and standings remain
   unimplemented. No existing contest data was removed.
6. **Account management.** Profile editing, password reset, email verification and
   account-level abuse prevention are still missing.

## Deployment limits

Compose currently provides a local development database with loopback-only access.
For a public deployment, configure authentication, HTTPS/session-cookie handling,
backups, admission limits, monitoring, and a separate judge host. Docker resource
limits and file separation improve the current design but do not turn a local
developer machine into a hardened multi-tenant execution service. Compilation
currently has a writable artifact directory; total disk quotas remain outstanding.

The new unique indexes do not repair existing duplicate records. If connecting an
older database, inspect duplicate problem IDs and normalized emails before enabling
those indexes; no migration silently deletes or merges user records.
