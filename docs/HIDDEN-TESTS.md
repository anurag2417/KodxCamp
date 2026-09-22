# Hidden Test Cases — Design & Limitations

> **Status:** Interim mitigation. Not a security boundary.
> **Real fix:** Server-side code judging — see [§9 of the project brief](./KodxCamp-Project-Brief.docx) and [§13](./KodxCamp-Project-Brief.docx).

This document describes how hidden test cases work in KodxCamp today, what
problem they solve, what they don't solve, and why. It is the technical
companion to §4.3.1 of the project brief.

---

## The problem

Students submit code to problems. Each problem has some visible test cases
(the student can see the input and expected output — this is a learning
tool) and some hidden test cases (the student must not see the expected
output — this is the grader).

KodxCamp does not execute code on the server. All execution happens in the
browser: JavaScript in a Worker, Python via Pyodide in a Worker, SQL via
SQL.js, HTML in a sandboxed iframe. Without a way to hide expected outputs,
any student with devtools could read the grader's answers from the network
response or the JavaScript bundle.

## The interim solution

For each hidden test case:

1. The server stores only a **SHA-256 hash of the canonicalized expected
   output** and the hidden input. The plaintext expected output is never
   written to the database.
2. When a student opens a problem, the server sends the hidden inputs (the
   client must have them to run the code) and the hashes.
3. The client wraps the student's code with a driver, sends the wrapped
   code and input to a Worker, and the Worker hashes the stdout.
4. The Worker compares the computed hash to the server-supplied hash and
   returns only `{ id, passed }` — never the raw stdout.
5. The client reports the booleans to the server. The server validates the
   shape and count, then records the submission.

## What this closes

| Attack | Closed? | Why |
|---|---|---|
| Read expected output from JS bundle | ✅ | Only hashes are shipped |
| Read expected output from network response | ✅ | Expected output is never sent |
| Look up hidden output from a shared dataset | ⚠️ Partial | Hashes are deterministic and unsalted, so lookup tables are possible for short outputs |
| Hardcode a passing solution by reading hidden test fixtures | ✅ | Hidden inputs are separate from visible inputs |

## What this does not close

A student who controls the browser can:

- Inspect the Worker's hashing and comparison logic.
- Intercept the raw output before it is hashed.
- Brute-force short expected outputs against the stored hash.
- Replace the hashing function in a modified environment.
- Forge the boolean `passed` flag sent to the server.

None of these are mitigated by the current design. The server accepts the
client's report at face value.

## Why no salt

An earlier design considered applying a per-session salt to defend against
crowdsourced `hash → output` lookup tables. That design was abandoned.

A salt is only meaningful if the **server** also applies it during
verification. But the server does not have the plaintext expected output —
it only has the hash. To verify a client-submitted salted hash, the server
would need to recompute the salted hash of the expected output, which
requires the plaintext. Storing the plaintext defeats the point.

So the salt would only be applied client-side, which is where the student
already has full control. It provides no additional protection.

Salt will be reintroduced **inside the server** when server-side judging
ships. At that point the server has the plaintext and the salt is
meaningful.

## Why SQL and HTML hidden tests fail closed

The SQL and HTML runners currently run on the main thread. Unlike the
JavaScript and Python runners, they cannot hash inside a Worker, so the
raw output would cross the page-visible boundary before hashing. Rather
than ship a weaker guarantee for these languages, hidden tests for SQL and
HTML return `passed: false` unconditionally until those runners are
moved into Workers. This is enforced in
`client/src/shared/runner/hiddenHarness.ts` (`runOneHidden`).

## Canonicalization

Client and server agree on a rule before hashing. The rule normalizes:

- `\r\n` → `\n` (Windows line endings)
- Trailing whitespace on each line
- A single trailing newline at EOF

The rule ID (`trim-trailing-newline`, `trim-all`, or `exact`) is stored
alongside the hash so both sides use the same rule.

**All canonicalization logic lives in `shared/src/testcase/canonicalize.ts`.**
The client imports it via `@kodxcamp/shared`; the Workers inline a copy
because they cannot import in a module-worker context. If the rule ever
changes, all copies must be updated and the canonicalization ID bumped.

## What server-side judging will look like

When the "Secure server-side code judging" item ships:

1. The server receives the code, the hidden inputs, and the plaintext
   expected outputs (which it already has, or will regenerate from the
   hashes).
2. The server executes the code inside a sandbox (Docker, gVisor,
   Firecracker, or equivalent).
3. The server computes the actual output, canonicalizes it, and compares
   it against the expected output.
4. The client no longer needs to run hidden tests at all — it just runs
   visible tests for learning.
5. All hashing is removed. The plaintext expected output is applied only
   inside the server's sandboxed execution environment, and never sent to
   the client.

Until then, the current scheme is what we have. It is a stopgap, and it
should be labeled as one in any student-facing material.

## References

- `shared/src/testcase/canonicalize.ts` — canonicalization rules
- `client/src/shared/runner/hiddenHarness.ts` — client-side hidden test runner
- `client/src/shared/runner/js.worker.ts` — JS worker with `run-hidden`
- `client/src/shared/runner/py.worker.ts` — Pyodide worker with `run-hidden`
- `server/src/services/problem.service.ts` — hashing on save, hidden test delivery
- `server/src/services/judge.service.ts` — submission validation
- `server/src/services/course.service.ts` — lesson equivalent
- Project brief §4.3.1, §9, §13