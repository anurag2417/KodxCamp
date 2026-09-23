/// <reference lib="webworker" />

type RubyCanonicalizationId = 'trim-trailing-newline' | 'trim-all' | 'exact';

interface RunMsg {
  type: 'run';
  code: string;
  requestId: string;
}

interface RunHiddenMsg {
  type: 'run-hidden';
  code: string;
  requestId: string;
  expectedOutputHash: string;
  canonicalization: RubyCanonicalizationId;
}

type RubyInMsg = RunMsg | RunHiddenMsg;

interface WorkerOutMsg {
  type: 'stdout' | 'stderr' | 'done' | 'error' | 'ready' | 'hidden-result';
  text?: string;
  requestId?: string;
  runtimeMs?: number;
  kind?: 'runtime' | 'syntax';
  passed?: boolean;
}

const postRubyWorkerMessage = (msg: WorkerOutMsg) => self.postMessage(msg);

// ─── Ruby base URLs ───────────────────────────────────────────────
//
// The loader and the WASM binary live in two different packages:
//   - @ruby/wasm-wasi        → ESM loader (browser/+esm)
//   - @ruby/4.0-wasm-wasi    → ruby+stdlib.wasm
//
// Version must match. 2.10.1 is the current stable pairing.

const RUBY_VERSION = '2.10.1';
const RUBY_LOADER_BASE = `https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@${RUBY_VERSION}/dist/`;
const RUBY_BINARY_BASE = `https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@${RUBY_VERSION}/dist/`;

// ─── Inlined canonicalization ─────────────────────────────────────

function canonicalize(
  output: string,
  id: RubyCanonicalizationId = 'trim-trailing-newline'
): string {
  switch (id) {
    case 'trim-trailing-newline':
      return output
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n$/, '');
    case 'trim-all':
      return output.replace(/\r\n/g, '\n').trim();
    case 'exact':
      return output;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── ruby.wasm lifecycle ──────────────────────────────────────────

interface RubyVM {
  eval: (code: string, options?: { filename?: string }) => Promise<unknown>;
}

interface RubyWasiModule {
  DefaultRubyVM: (
    module: WebAssembly.Module
  ) => Promise<{ vm: RubyVM; wasm: WebAssembly.Module }>;
}

let rubyPromise: Promise<RubyVM> | null = null;

async function loadRubyOnce(): Promise<RubyVM> {
  if (rubyPromise) return rubyPromise;

  rubyPromise = (async () => {
    const loaderUrl = `${RUBY_LOADER_BASE}browser/+esm`;

    // Import the ESM loader directly from jsDelivr. /* @vite-ignore */
    // stops Vite from trying to resolve this at build time; resolution
    // happens in the browser at runtime instead.
    //
    // IMPORTANT: do NOT fetch this as text and re-load it via a Blob
    // URL. A blob: URL has no real origin, so any root-relative nested
    // import inside the loader (e.g. "/npm/@bjorn3/browser_wasi_shim@x/+esm")
    // resolves against your own page's origin instead of jsdelivr's,
    // and fails with "Error resolving module specifier". Importing the
    // https:// URL directly preserves the correct origin for those
    // nested imports.
    let mod: RubyWasiModule;
    try {
      mod = (await import(/* @vite-ignore */ loaderUrl)) as RubyWasiModule;
    } catch (err) {
      throw new Error(
        `Failed to load Ruby loader from ${loaderUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (typeof mod.DefaultRubyVM !== 'function') {
      throw new Error(
        `ruby.wasm loader missing DefaultRubyVM. Check ${loaderUrl}`
      );
    }

    // Fetch the WASM binary from the separate package.
    const wasmUrl = `${RUBY_BINARY_BASE}ruby+stdlib.wasm`;
    const wasmResponse = await fetch(wasmUrl);
    if (!wasmResponse.ok) {
      throw new Error(
        `Failed to fetch ${wasmUrl}: ${wasmResponse.status} ${wasmResponse.statusText}`
      );
    }
    const wasmBytes = await wasmResponse.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBytes);

    const { vm } = await mod.DefaultRubyVM(wasmModule);
    return vm;
  })();

  return rubyPromise;
}

// ─── Execution ────────────────────────────────────────────────────

interface RubyExecution {
  ok: boolean;
  stdout: string;
  stderr: string;
  kind?: 'runtime' | 'syntax';
  runtimeMs: number;
}

async function executeRuby(vm: RubyVM, code: string): Promise<RubyExecution> {
  const start = performance.now();

  const wrapped = `
require 'stringio'

__kodx_out = StringIO.new
__kodx_err = StringIO.new
__kodx_stdout_backup = $stdout
__kodx_stderr_backup = $stderr
$stdout = __kodx_out
$stderr = __kodx_err

__kodx_exception = nil
begin
${indent(code, 2)}
rescue Exception => e
  __kodx_exception = "\#{e.class}: \#{e.message}"
ensure
  $stdout = __kodx_stdout_backup
  $stderr = __kodx_stderr_backup
end

$__kodx_result = {
  stdout: [__kodx_out.string].pack('m0'),
  stderr: [__kodx_err.string].pack('m0'),
  error: __kodx_exception ? [__kodx_exception].pack('m0') : nil,
}
`;

  try {
    await vm.eval(wrapped, { filename: 'main.rb' });

    const resultJson = (await vm.eval(
      `require 'json'; JSON.generate($__kodx_result)`,
      { filename: '__readback__.rb' }
    )) as string;

    const parsed = JSON.parse(resultJson) as {
      stdout: string;
      stderr: string;
      error: string | null;
    };

    const stdout = base64Decode(parsed.stdout);
    const stderr = base64Decode(parsed.stderr);
    const errorMsg = parsed.error ? base64Decode(parsed.error) : '';

    if (errorMsg) {
      const isSyntax = errorMsg.includes('SyntaxError');
      return {
        ok: false,
        stdout,
        stderr: errorMsg,
        kind: isSyntax ? 'syntax' : 'runtime',
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
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return {
      ok: false,
      stdout: '',
      stderr: msg,
      kind: msg.includes('SyntaxError') ? 'syntax' : 'runtime',
      runtimeMs: Math.round(performance.now() - start),
    };
  }
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : line))
    .join('\n');
}

function base64Decode(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// ─── Message handling ─────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<RubyInMsg>) => {
  const { requestId } = e.data;
  const start = performance.now();

  let vm: RubyVM;
  try {
    vm = await loadRubyOnce();
    postRubyWorkerMessage({ type: 'ready', requestId });
  } catch (err) {
    postRubyWorkerMessage({
      type: 'error',
      requestId,
      kind: 'runtime',
      text: `Ruby load failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
      runtimeMs: Math.round(performance.now() - start),
    });
    return;
  }

  if (e.data.type === 'run') {
    const result = await executeRuby(vm, e.data.code);
    if (result.stdout)
      postRubyWorkerMessage({ type: 'stdout', text: result.stdout, requestId });
    if (result.stderr && !result.ok)
      postRubyWorkerMessage({ type: 'stderr', text: result.stderr, requestId });
    if (result.ok) {
      postRubyWorkerMessage({
        type: 'done',
        requestId,
        runtimeMs: result.runtimeMs,
      });
    } else {
      postRubyWorkerMessage({
        type: 'error',
        requestId,
        kind: result.kind ?? 'runtime',
        text: result.stderr,
        runtimeMs: result.runtimeMs,
      });
    }
    return;
  }

  if (e.data.type === 'run-hidden') {
    const result = await executeRuby(vm, e.data.code);

    let passed = false;
    if (result.ok) {
      const canonical = canonicalize(result.stdout, e.data.canonicalization);
      const actualHash = await sha256Hex(canonical);
      passed = actualHash === e.data.expectedOutputHash;
    }

    postRubyWorkerMessage({
      type: 'hidden-result',
      requestId,
      passed,
      runtimeMs: result.runtimeMs,
    });
  }
};