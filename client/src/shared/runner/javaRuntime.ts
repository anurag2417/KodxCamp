/**
 * Java runtime - CheerpJ.
 *
 * IMPORTANT: CheerpJ does not run inside a Web Worker. It requires
 * DOM access and its public API operates on the page context.
 * Because of this, the Java runtime runs on the main thread.
 *
 * The CheerpJ runtime is initialized lazily on first use. Init
 * downloads ~30 MB of JDK and JVM assets. This cost is paid once per
 * page session.
 *
 * NOTE ON THE GLOBAL API: CheerpJ's loader.js does NOT attach a
 * `window.cheerpJ` namespace object. It attaches flat functions
 * directly onto `window`.
 *
 * NOTE ON COMPILATION: CheerpJ is a bytecode interpreter, not a
 * compiler. To run `.java` source, we invoke `com.sun.tools.javac.Main`
 * from a compiler jar that we host ourselves at
 * `client/public/jdk-compiler.jar`.
 *
 * ENTRY POINT CONTRACT: the test harness wraps the student's code with
 * a class named `KodxEntry`. The runtime always invokes `KodxEntry.main`,
 * which either calls `Main.main` (print mode) or `Main.<functionName>(...)`
 * and prints the JSON result (return mode).
 *
 * OUTPUT EXTRACTION: the harness surrounds the student's output with
 * the markers `<<<KODX_OUTPUT>>>` and `<<<KODX_END>>>`. CheerpJ writes
 * its own boot messages, HMR banner noise, and classpath probes to the
 * same console channel, so we slice the capture between the markers to
 * isolate the real program output.
 */

// ─── Global type declarations ─────────────────────────────────────

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

const COMPILER_JAR_PATH = '/app/jdk-compiler.jar';

const OUTPUT_START_MARKER = '<<<KODX_OUTPUT>>>';
const OUTPUT_END_MARKER = '<<<KODX_END>>>';

// ─── CheerpJ lifecycle ────────────────────────────────────────────

let initPromise: Promise<void> | null = null;
let initialized = false;

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

    await window.cheerpjInit({ javaHeapSize: 512 });
    initialized = true;
  })();

  return initPromise;
}

export async function preloadJava(): Promise<void> {
  try {
    await loadCheerpJOnce();
  } catch {
    /* non-fatal - surfaced on first run */
  }
}

export function isJavaReady(): boolean {
  return initialized;
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
 * Compile and run the wrapped code.
 *
 * The harness has already produced a full Java program containing the
 * student's `public class Main` plus a non-public `class KodxEntry`
 * that holds the entry point and emits output markers.
 */
export async function runJava(code: string): Promise<JavaExecution> {
  const [result] = await runJavaBatch(code, ['KodxEntry']);
  return result;
}

/**
 * Compile one source file and run several already-compiled entry classes.
 * Problem test cases use this to avoid starting javac once per test.
 */
export async function runJavaBatch(
  code: string,
  entryClasses: string[]
): Promise<JavaExecution[]> {
  const start = performance.now();

  try {
    await loadCheerpJOnce();

    // 1. Write the wrapped code to /str/Main.java. The file name must
    //    match the public class name.
    window.cheerpjAddStringFile!('/str/Main.java', code);

    // 2. Intercept console output during compile + run. CheerpJ routes
    //    System.out through console.log, so this captures both javac
    //    diagnostics and the program's output.
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

    let compileExit = 0;
    try {
      compileExit = await window.cheerpjRunMain!(
        'com.sun.tools.javac.Main',
        `${COMPILER_JAR_PATH}:/app/`,
        '/str/Main.java',
        '-proc:none',
        '-d',
        '/files/'
      );

      if (compileExit !== 0) {
        const diagnostics = extractProgramOutput(captured) || captured.join('\n').trim();
        return entryClasses.map(() => ({
          ok: false,
          stdout: '',
          stderr: diagnostics || 'Compilation failed',
          kind: 'syntax' as const,
          runtimeMs: Math.round(performance.now() - start),
        }));
      }

      const results: JavaExecution[] = [];
      for (const entryClass of entryClasses) {
        const outputStart = captured.length;
        const runStart = performance.now();
        const exitCode = await window.cheerpjRunMain!(
          entryClass,
          '/files/:/app/'
        );
        const runOutput = extractProgramOutput(captured.slice(outputStart));

        results.push(
          exitCode === 0
            ? {
                ok: true,
                stdout: runOutput,
                stderr: '',
                runtimeMs: Math.round(performance.now() - runStart),
              }
            : {
                ok: false,
                stdout: '',
                stderr:
                  runOutput ||
                  captured.slice(outputStart).join('\n').trim() ||
                  'Java runtime error',
                kind: 'runtime',
                runtimeMs: Math.round(performance.now() - runStart),
              }
        );
      }

      return results;
    } finally {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }

    return entryClasses.map(() => ({
      ok: false,
      stdout: '',
      stderr: 'Java runtime error',
      kind: 'runtime' as const,
      runtimeMs: Math.round(performance.now() - start),
    }));
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return entryClasses.map(() => ({
      ok: false,
      stdout: '',
      stderr: msg,
      kind: (msg.includes('SyntaxError') || msg.includes('compilation')
        ? 'syntax'
        : 'runtime') as 'syntax' | 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    }));
  }
}

/**
 * Slice the captured console output between the two markers emitted by
 * the harness's `KodxEntry` class.
 *
 * Returns an empty string if either marker is missing (which means the
 * program never ran to completion).
 */
function extractProgramOutput(captured: string[]): string {
  const joined = captured.join('\n');

  const startIdx = joined.indexOf(OUTPUT_START_MARKER);
  if (startIdx === -1) return '';

  const endIdx = joined.indexOf(OUTPUT_END_MARKER, startIdx + OUTPUT_START_MARKER.length);
  if (endIdx === -1) return '';

  const inner = joined.slice(startIdx + OUTPUT_START_MARKER.length, endIdx);
  // Trim leading and trailing newline/whitespace introduced by
  // println lines around the marker.
  return inner.replace(/^\s*\n/, '').replace(/\n\s*$/, '').trim();
}