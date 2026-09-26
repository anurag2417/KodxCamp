import type {
  DomAssertion,
  IProjectTest,
  IProjectTestResult,
  IProjectTestRun,
  ProjectTest,
} from '@kodxcamp/shared';
import { mergeWebFilesIntoHtml } from '@/shared/lib/preview';

/**
 * The minimal file shape the engine needs. Declared structurally
 * (not as `IProjectFile`) so callers can pass anything that
 * satisfies it — including `ApiProjectFile` from the client API
 * layer, whose `language` field is a loose `string` rather than
 * the shared package's `ProjectFileLang` union.
 *
 * The engine only reads `language` to look up the html / css / js
 * content; it never writes files back, so it has no reason to
 * require the strict union.
 */
export interface TestEngineFile {
  name: string;
  language: string;
  content: string;
}

/**
 * Project test engine.
 *
 * Master Spec, section 13:
 *   "Projects should use automated tests wherever possible.
 *    Automated tests are responsible for objective checks."
 *
 * This module is the entire deterministic evaluator for a project.
 * It runs on the client, inside a sandboxed iframe, and returns a
 * structured pass/fail per test. It does NOT capture screenshots —
 * that's `screenshotRunner.ts`. It does NOT persist anything — that's
 * the submit call in `ProjectWorkspace.tsx`.
 *
 * Run surface:
 *   - The student's files are merged into a single HTML document by
 *     `mergeWebFilesIntoHtml` (the same primitive the live preview
 *     and screenshot runner use). The test engine script is then
 *     appended before `</body>`.
 *   - That document is loaded into a hidden iframe with
 *     `sandbox="allow-scripts"` (no same-origin access — the tests
 *     run *inside* the iframe and post their results back).
 *   - Each test is evaluated in order. `event-*` tests dispatch
 *     real DOM events and assert on the resulting state.
 *
 * The sandbox flag means the iframe cannot reach back into the host
 * page. That's deliberate: no XSS, no data exfiltration from a
 * malicious submission. It also means we cannot use
 * `iframe.contentDocument` from the host — the tests must run
 * *inside* the iframe. Hence the inline engine script below.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

interface RunOptions {
  /** Milliseconds before the runner gives up waiting for the iframe. */
  timeoutMs?: number;
}

export async function runProjectTests(
  files: TestEngineFile[],
  tests: IProjectTest[],
  previewMode: 'html' | 'react' | 'sql' | 'none',
  opts: RunOptions = {}
): Promise<IProjectTestRun> {
  const startedAt = performance.now();

  if (tests.length === 0) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      allPassed: true,
      durationMs: Math.round(performance.now() - startedAt),
      results: [],
      ranAt: new Date(),
    };
  }

  if (previewMode !== 'html') {
    // Non-HTML projects have no DOM to test against. React projects
    // render client-side into #root, which the sandboxed test iframe
    // does not execute (no CDN access from inside the sandbox).
    // Programming projects get a different runner in a later batch.
    return {
      totalTests: tests.length,
      passedTests: 0,
      failedTests: tests.length,
      allPassed: false,
      durationMs: Math.round(performance.now() - startedAt),
      results: tests.map((t) => ({
        name: t.name,
        check: t.check,
        passed: false,
        actual: 'skipped',
        message: `Automated tests are only supported for HTML projects (preview mode was "${previewMode}").`,
      })),
      ranAt: new Date(),
      error: 'Tests skipped: unsupported preview mode',
    };
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const html = buildTestableHtml(files, tests);

  try {
    const results = await runInIframe(html, timeoutMs);
    const passedTests = results.filter((r) => r.passed).length;

    return {
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      allPassed: passedTests === results.length && results.length > 0,
      durationMs: Math.round(performance.now() - startedAt),
      results,
      ranAt: new Date(),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Automated test run failed';
    return {
      totalTests: tests.length,
      passedTests: 0,
      failedTests: tests.length,
      allPassed: false,
      durationMs: Math.round(performance.now() - startedAt),
      results: tests.map((t) => ({
        name: t.name,
        check: t.check,
        passed: false,
        actual: 'error',
        message,
      })),
      ranAt: new Date(),
      error: message,
    };
  }
}

/* ─── Iframe orchestration ───────────────────────────────────────── */

function runInIframe(
  html: string,
  timeoutMs: number
): Promise<IProjectTestResult[]> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    // No allow-same-origin — the tests run *inside* the iframe and
    // post their results back via postMessage.
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1440px';
    iframe.style.height = '900px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      try {
        document.body.removeChild(iframe);
      } catch {
        /* ignore */
      }
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };

    const onMessage = (e: MessageEvent) => {
      // Trust only our own iframe. Because the sandbox lacks
      // `allow-same-origin`, `e.origin` is `"null"` — we key off the
      // source instead.
      if (e.source !== iframe.contentWindow) return;
      const data = e.data as
        | { __kodxProjectTestRun?: true; results: IProjectTestResult[] }
        | undefined;
      if (!data || !data.__kodxProjectTestRun) return;
      cleanup();
      resolve(data.results);
    };

    window.addEventListener('message', onMessage);

    const timer = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Automated tests did not return within ${timeoutMs}ms. The project may have an infinite loop or a network fetch at load time.`
        )
      );
    }, timeoutMs);

    iframe.onerror = () => {
      cleanup();
      reject(new Error('The sandboxed frame failed to load'));
    };

    iframe.srcdoc = html;
  });
}

/* ─── Document wrapper ───────────────────────────────────────────── */

/**
 * Build the testable document. Two-part assembly:
 *
 *   1. The student's files are merged by `mergeWebFilesIntoHtml` —
 *      the same primitive the live preview and screenshot runner
 *      use, so all three render the project identically.
 *
 *   2. The test engine script is inserted before `</body>` so it
 *      runs *after* the student's code, and posts results back to
 *      the parent via postMessage.
 */
function buildTestableHtml(
  files: TestEngineFile[],
  tests: IProjectTest[]
): string {
  const html = files.find((f) => f.language === 'html')?.content ?? '';
  const css = files.find((f) => f.language === 'css')?.content ?? '';
  const js = files.find((f) => f.language === 'javascript')?.content ?? '';

  const studentHtml = mergeWebFilesIntoHtml(html, css, js);

  // Serialize the tests into the wrapper. We escape `</script` so an
  // author writing a `<script>` tag inside an instruction string
  // doesn't break the injection.
  const testsJson = JSON.stringify(tests).replace(/<\/script/gi, '<\\/script');

  const engine = `
(function () {
  var TESTS = ${testsJson};

  function postResults(results) {
    parent.postMessage({ __kodxProjectTestRun: true, results: results }, '*');
  }

  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  function runAssertion(assertion) {
    try {
      var matches = document.querySelectorAll(assertion.selector);
      if (assertion.type === 'dom-exists') {
        return matches.length > 0
          ? { passed: true, actual: 'found' }
          : { passed: false, actual: 'not found',
              message: 'No element matched "' + assertion.selector + '".' };
      }
      if (assertion.type === 'dom-count') {
        var count = matches.length;
        return count === assertion.count
          ? { passed: true, actual: String(count) }
          : { passed: false, actual: String(count),
              message: 'Expected ' + assertion.count + ' match(es), got ' + count + '.' };
      }
      if (matches.length === 0) {
        return { passed: false, actual: '(not found)',
                 message: 'No element matched "' + assertion.selector + '".' };
      }
      var first = matches[0];
      if (assertion.type === 'dom-text') {
        var text = textOf(first);
        if (assertion.mode === 'equals') {
          return text === assertion.value
            ? { passed: true, actual: text }
            : { passed: false, actual: text,
                message: 'Expected text "' + assertion.value + '", got "' + text + '".' };
        }
        // textMatches
        var re;
        try { re = new RegExp(assertion.value); }
        catch (e) {
          return { passed: false, actual: text,
                   message: 'Test regex is invalid: ' + assertion.value };
        }
        return re.test(text)
          ? { passed: true, actual: text }
          : { passed: false, actual: text,
              message: 'Expected text to match /' + assertion.value + '/, got "' + text + '".' };
      }
      if (assertion.type === 'dom-attribute') {
        var val = first.getAttribute(assertion.attribute);
        if (val === null) {
          return { passed: false, actual: '(missing)',
                   message: 'Element is missing attribute "' + assertion.attribute + '".' };
        }
        return val === assertion.value
          ? { passed: true, actual: val }
          : { passed: false, actual: val,
              message: 'Expected attribute "' + assertion.attribute + '" to be "' +
                       assertion.value + '", got "' + val + '".' };
      }
      return { passed: false, actual: 'unsupported',
               message: 'Unknown assertion type.' };
    } catch (e) {
      return { passed: false, actual: 'error',
               message: 'Assertion threw: ' + (e && e.message ? e.message : e) };
    }
  }

  function visualNonBlank(minChars) {
    var text = (document.body && document.body.innerText) || '';
    var count = text.replace(/\\s+/g, '').length;
    return count >= minChars
      ? { passed: true, actual: String(count) }
      : { passed: false, actual: String(count),
          message: 'Expected at least ' + minChars + ' visible characters, got ' + count + '.' };
  }

  function runOne(test) {
    var check = test.check;
    if (check.type === 'visual-nonblank') {
      var r = visualNonBlank(check.minimumChars);
      return Object.assign({}, r, { name: test.name, check: check });
    }
    if (check.type === 'dom-exists' ||
        check.type === 'dom-text' ||
        check.type === 'dom-attribute' ||
        check.type === 'dom-count') {
      var r2 = runAssertion(check);
      return Object.assign({}, r2, { name: test.name, check: check });
    }
    if (check.type === 'event-click' || check.type === 'event-input') {
      var el;
      try { el = document.querySelector(check.selector); }
      catch (e) { el = null; }
      if (!el) {
        return {
          name: test.name,
          check: check,
          passed: false,
          actual: '(not found)',
          message: 'No element matched "' + check.selector + '".',
        };
      }
      try {
        if (check.type === 'event-input') {
          el.focus();
          el.value = check.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.click();
        }
      } catch (e) {
        return {
          name: test.name,
          check: check,
          passed: false,
          actual: 'error',
          message: 'Dispatching the event threw: ' + (e && e.message ? e.message : e),
        };
      }
      return new Promise(function (resolve) {
        setTimeout(function () {
          var inner = runAssertion(check.assert);
          resolve(Object.assign({}, inner, { name: test.name, check: check }));
        }, 30);
      });
    }
    return Promise.resolve({
      name: test.name,
      check: check,
      passed: false,
      actual: 'unsupported',
      message: 'Unknown test type: ' + check.type,
    });
  }

  function runAll() {
    var out = [];
    var i = 0;
    function next() {
      if (i >= TESTS.length) {
        postResults(out);
        return;
      }
      var p = runOne(TESTS[i++]);
      Promise.resolve(p).then(function (r) { out.push(r); next(); })
        .catch(function (e) {
          out.push({
            name: TESTS[i - 1].name,
            check: TESTS[i - 1].check,
            passed: false,
            actual: 'error',
            message: 'Test threw: ' + (e && e.message ? e.message : e),
          });
          next();
        });
    }
    next();
  }

  // Defer to the next task so the student's <script> has run.
  setTimeout(runAll, 50);
})();
`;

  const scriptTag = `<script>${engine}</script>`;
  const closingBodyIndex = studentHtml.lastIndexOf('</body>');

  if (closingBodyIndex === -1) {
    return studentHtml + scriptTag;
  }
  return (
    studentHtml.slice(0, closingBodyIndex) +
    scriptTag +
    studentHtml.slice(closingBodyIndex)
  );
}

/* ─── Local re-exports for convenience ───────────────────────────── */

export type { DomAssertion, ProjectTest };