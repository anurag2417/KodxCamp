/**
 * Java runtime — CheerpJ.
 *
 * IMPORTANT: CheerpJ does not run inside a Web Worker. It requires
 * DOM access and its public API (`cheerpjRunMain`, `cheerpjRunJar`)
 * operates on the page context. Because of this, the Java runtime
 * runs on the main thread.
 *
 * Consequence: hidden tests for Java FAIL CLOSED. We cannot hash
 * stdout inside an isolated boundary, so `runJavaHidden` returns
 * `{ passed: false }` unconditionally. This is documented in
 * HIDDEN-TESTS.md and mirrors the SQL/HTML behavior.
 *
 * The CheerpJ runtime is initialized lazily on first use. Init
 * downloads ~30 MB of JDK and JVM assets. This cost is paid once per
 * page session.
 *
 * NOTE ON THE GLOBAL API: CheerpJ's loader.js does NOT attach a
 * `window.cheerpJ` namespace object. It attaches flat functions
 * directly onto `window`: `cheerpjInit`, `cheerpjRunMain`,
 * `cheerpjRunJar`, `cheerpjAddStringFile`, etc. Always check/call
 * those directly rather than `window.cheerPJ.*`.
 *
 * NOTE ON COMPILATION: CheerpJ is a bytecode interpreter, not a
 * compiler. To run `.java` source, we invoke `com.sun.tools.javac.Main`
 * from a compiler jar that we host ourselves at
 * `client/public/jdk-compiler.jar`. CheerpJ fetches it via Range
 * requests from `/app/jdk-compiler.jar`. Vite's dev server needs a
 * small plugin to add Range support — see `client/vite.config.ts`.
 */

import type { RunResult } from './types';

// ─── Global type declarations ─────────────────────────────────────
//
// CheerpJ's loader.js (loaded via <script> in index.html) attaches
// these directly to `window`. Declared here since there's no
// official @types package for CheerpJ.

declare global {
  interface Window {
    cheerpjInit?: (options?: { javaHeapSize?: number }) => Promise<void>;
    cheerpjRunMain?: (
      mainClass: string,
      classpath: string,
      ...args: string[]
    ) => Promise<number>;
    cheerpjRunJar?: (jarPath: string, ...args: string[]) => Promise<number>;
    cheerpjAddStringFile?: (path: string, content: string) => void;
  }
}

// ─── Compiler jar ─────────────────────────────────────────────────
//
// CheerpJ is a bytecode interpreter. `javac` lives in `tools.jar`,
// which CheerpJ does not ship. We serve a copy ourselves from
// `client/public/jdk-compiler.jar`. CheerpJ resolves `/app/` to the
// web server root, so the file is reachable at:
//
//   dev:  http://localhost:5173/jdk-compiler.jar
//   prod: <origin>/jdk-compiler.jar
//
// The server MUST respond with:
//   - Accept-Ranges: bytes
//   - Content-Range on 206 responses
//   - Access-Control-Allow-Origin (same origin in prod, but Vite needs
//     the plugin anyway)
//
// See `client/vite.config.ts` for the dev-server Range plugin.

const COMPILER_JAR_PATH = '/app/jdk-compiler.jar';

// ─── CheerpJ lifecycle ────────────────────────────────────────────

let initPromise: Promise<void> | null = null;
let initialized = false;

/**
 * Initialize CheerpJ. Idempotent.
 *
 * The global `window.cheerpjInit` (and friends) are populated by the
 * script tag in `client/index.html`. We wait for it to appear, then
 * call it.
 */
async function loadCheerpJOnce(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const deadline = Date.now() + 30_000;
    while (!window.cheerpjInit && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!window.cheerpjInit) {
      throw new Error(
        'CheerpJ failed to load. Check that the script tag in index.html points at a valid URL.'
      );
    }

    await window.cheerpjInit({
      javaHeapSize: 512,
    });

    initialized = true;
  })();

  return initPromise;
}

export async function preloadJava(): Promise<void> {
  try {
    await loadCheerpJOnce();
  } catch {
    /* non-fatal — surfaced on first run */
  }
}

export function isJavaReady(): boolean {
  return initialized;
}

// ─── Capture helper class ─────────────────────────────────────────
//
// CheerpJ's API doesn't expose a stdout hook the way Pyodide does. We
// use a small Java bootstrap that redirects System.out / System.err
// to in-memory buffers, reflectively invokes the student's `main`,
// and emits the buffers as base64 sentinels for the JS side to read
// back.

const CAPTURE_HELPER_CLASS = 'KodxCapture';

const CAPTURE_HELPER_SOURCE = `
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

public class KodxCapture {
    public static void main(String[] args) throws Exception {
        // args[0] = fully qualified class name to invoke
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ByteArrayOutputStream err = new ByteArrayOutputStream();
        PrintStream origOut = System.out;
        PrintStream origErr = System.err;

        System.setOut(new PrintStream(out, true, "UTF-8"));
        System.setErr(new PrintStream(err, true, "UTF-8"));

        int exit = 0;
        try {
            Class<?> clazz = Class.forName(args[0]);
            java.lang.reflect.Method main = clazz.getMethod("main", String[].class);
            String[] rest = new String[args.length - 1];
            System.arraycopy(args, 1, rest, 0, rest.length);
            main.invoke(null, (Object) rest);
        } catch (Throwable t) {
            t.printStackTrace();
            exit = 1;
        } finally {
            System.setOut(origOut);
            System.setErr(origErr);
        }

        String outB64 = java.util.Base64.getEncoder().encodeToString(out.toByteArray());
        String errB64 = java.util.Base64.getEncoder().encodeToString(err.toByteArray());
        // Sentinels so we can find them in the captured main-thread stdout.
        System.out.println("__KODX_STDOUT_B64__" + outB64);
        System.out.println("__KODX_STDERR_B64__" + errB64);
        System.out.println("__KODX_EXIT__" + exit);
    }
}
`;

let helperInjected = false;

async function ensureCaptureHelper(): Promise<void> {
  if (helperInjected) return;
  window.cheerpjAddStringFile!(
    '/str/' + CAPTURE_HELPER_CLASS + '.java',
    CAPTURE_HELPER_SOURCE
  );
  helperInjected = true;
}

// ─── Execution ────────────────────────────────────────────────────

interface JavaExecution {
  ok: boolean;
  stdout: string;
  stderr: string;
  kind?: 'runtime' | 'syntax';
  runtimeMs: number;
}

/**
 * Run a single Java class named `Main` in `code`.
 *
 * Two-step flow:
 *   1. Compile — invoke `com.sun.tools.javac.Main` from the compiler
 *      jar at /app/jdk-compiler.jar. Produces Main.class and
 *      KodxCapture.class in /files/.
 *   2. Run — invoke `KodxCapture` reflectively, which calls
 *      `Main.main` with the appropriate args.
 *
 * CheerpJ operates on bytecode; it does not compile `.java` source on
 * the fly, so the compile step is required.
 */
export async function runJava(code: string): Promise<JavaExecution> {
  const start = performance.now();

  try {
    await loadCheerpJOnce();
    await ensureCaptureHelper();

    // 1. Write the student's code as Main.java.
    window.cheerpjAddStringFile!('/str/Main.java', code);

    // 2. Redirect the page's console to capture CheerpJ's output.
    //    Covers both javac diagnostics and System.out from KodxCapture.
    const captured: string[] = [];
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const intercept = (...args: unknown[]) => {
      captured.push(args.map(String).join(' '));
    };

    console.log = intercept;
    console.info = intercept;
    console.warn = intercept;
    console.error = intercept;

    let exitCode = 0;
    try {
      // 2a. Compile Main.java and the capture helper.
      //
      //     The classpath includes /app/jdk-compiler.jar, which the
      //     CheerpJ runtime fetches via Range requests from our own
      //     web server. Vite dev serves it via the cheerpjRange plugin
      //     configured in vite.config.ts.
      const compileExit = await window.cheerpjRunMain!(
        'com.sun.tools.javac.Main',
        `${COMPILER_JAR_PATH}:/app/`,
        '/str/Main.java',
        '/str/' + CAPTURE_HELPER_CLASS + '.java',
        '-d',
        '/files/'
      );

      if (compileExit !== 0) {
        const diagnostics = captured.join('\n').trim();
        return {
          ok: false,
          stdout: '',
          stderr: diagnostics || 'Compilation failed',
          kind: 'syntax',
          runtimeMs: Math.round(performance.now() - start),
        };
      }

      // 2b. Run the compiled KodxCapture class against /files/.
      exitCode = await window.cheerpjRunMain!(
        CAPTURE_HELPER_CLASS,
        '/files/:/app/',
        'Main'
      );
    } finally {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }

    // 3. Parse the sentinel lines from the captured output.
    const joined = captured.join('\n');
    const stdoutMatch = joined.match(/__KODX_STDOUT_B64__([A-Za-z0-9+/=]*)/);
    const stderrMatch = joined.match(/__KODX_STDERR_B64__([A-Za-z0-9+/=]*)/);
    const exitMatch = joined.match(/__KODX_EXIT__(\d+)/);

    const stdout = stdoutMatch ? base64Decode(stdoutMatch[1]) : '';
    const stderr = stderrMatch ? base64Decode(stderrMatch[1]) : '';
    const exitedWith = exitMatch ? Number(exitMatch[1]) : exitCode;

    if (exitedWith !== 0) {
      return {
        ok: false,
        stdout,
        stderr: stderr || 'Java runtime error',
        kind: 'runtime',
        runtimeMs: Math.round(performance.now() - start),
      };
    }

    return {
      ok: true,
      stdout,
      stderr,
      runtimeMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: '',
      stderr: msg,
      kind:
        msg.includes('SyntaxError') || msg.includes('compilation')
          ? 'syntax'
          : 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    };
  }
}

/**
 * Java hidden tests fail closed.
 *
 * CheerpJ runs on the main thread; we cannot hash stdout inside an
 * isolated boundary the way we do for JS, Python, and Ruby. Rather
 * than ship a weaker guarantee, we mark every Java hidden test as
 * failed until server-side judging ships.
 */
export async function runJavaHidden(): Promise<{
  passed: boolean;
  runtimeMs: number;
}> {
  return { passed: false, runtimeMs: 0 };
}

// ─── Utilities ────────────────────────────────────────────────────

function base64Decode(b64: string): string {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

// Suppress unused-import warning if RunResult is not referenced.
void ({} as RunResult);