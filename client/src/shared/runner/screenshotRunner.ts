import type {
  IProjectScreenshot,
  IProjectScreenshotSet,
} from '@kodxcamp/shared';
import { mergeWebFilesIntoHtml } from '@/shared/lib/preview';

/**
 * The minimal file shape the screenshot runner needs. Declared
 * structurally (not as `IProjectFile`) so callers can pass anything
 * that satisfies it — including `ApiProjectFile` from the client API
 * layer, whose `language` field is a loose `string`.
 */
export interface ScreenshotFile {
  name: string;
  language: string;
  content: string;
}

/**
 * Screenshot capture.
 *
 * Master Spec, section 18.6:
 *   "For web projects, the system should run the student's code in a
 *    controlled browser environment. The system should generate
 *    screenshots such as: Desktop screenshot, Mobile screenshot."
 *
 * The capture is client-side. We render the student's files into a
 * sandboxed iframe at a fixed viewport to verify the document parses
 * and runs, then rasterize a script-stripped copy in an off-screen
 * container with html2canvas. The resulting PNGs are returned as
 * base64 data URLs.
 *
 * Deliberate limits, called out honestly:
 *
 *   - html2canvas cannot rasterize the contents of a sandboxed iframe.
 *     That is a documented html2canvas limitation. So the iframe is
 *     used only to verify the student's HTML parses and its scripts
 *     run without throwing. The actual capture renders a *script-
 *     stripped* copy in the parent document.
 *
 *   - Because the captured copy has no scripts, the screenshots show
 *     layout, typography, colors, and static DOM only. Any DOM the
 *     student's JavaScript would have generated at runtime (a
 *     client-rendered todo list, a fetched API response, dynamic
 *     content) will NOT be present in the screenshot.
 *
 *   - This limitation MUST be passed to the AI evaluator in Batch 8,
 *     so the evaluator does not penalize a submission for missing
 *     runtime-generated content that it cannot see.
 *
 *   - Only two viewports are captured: desktop (1440x900) and mobile
 *     (375x812).
 *
 *   - Only `html` and `react` preview modes are supported. `sql` and
 *     `none` return a screenshot set with an error and no images.
 *
 *   - On capture failure, the set records an `error` string and keeps
 *     whichever images succeeded. The submission still proceeds.
 *
 * The merge step is delegated to `mergeWebFilesIntoHtml` in
 * `@/shared/lib/preview`, with `stripScripts: true`. The preview
 * pane, test engine, and this runner therefore all render the
 * project from the same source of truth.
 */

/** Encoded-length cap for a single PNG data URL (~500 KB raw). */
const MAX_DATA_URL_LENGTH = 700_000;

/** How long to wait for a single capture to complete. */
const DEFAULT_CAPTURE_TIMEOUT_MS = 15_000;

interface CaptureOptions {
  /** Milliseconds before a single capture gives up. */
  timeoutMs?: number;
}

const VIEWPORTS: {
  viewport: 'desktop' | 'mobile';
  width: number;
  height: number;
}[] = [
  { viewport: 'desktop', width: 1440, height: 900 },
  { viewport: 'mobile', width: 375, height: 812 },
];

/**
 * Capture both desktop and mobile screenshots of the given files.
 *
 * Never throws. On failure it returns a set with `error` set and
 * whichever screenshots succeeded.
 */
export async function captureProjectScreenshots(
  files: ScreenshotFile[],
  previewMode: 'html' | 'react' | 'sql' | 'none',
  opts: CaptureOptions = {}
): Promise<IProjectScreenshotSet> {
  if (previewMode !== 'html' && previewMode !== 'react') {
    return {
      error: `Screenshots are only supported for HTML and React projects (preview mode was "${previewMode}").`,
    };
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_CAPTURE_TIMEOUT_MS;

  const html = files.find((f) => f.language === 'html')?.content ?? '';
  const css = files.find((f) => f.language === 'css')?.content ?? '';
  const js = files.find((f) => f.language === 'javascript')?.content ?? '';

  // Two documents:
  //   - `verifyHtml` includes scripts, so we can check the student's
  //     code actually runs before we try to capture.
  //   - `captureHtml` strips scripts, for the html2canvas capture.
  const verifyHtml = mergeWebFilesIntoHtml(html, css, js);
  const captureHtml = mergeWebFilesIntoHtml(html, css, js, {
    stripScripts: true,
  });

  const result: IProjectScreenshotSet = {};

  for (const vp of VIEWPORTS) {
    try {
      const shot = await captureOne(verifyHtml, captureHtml, {
        ...vp,
        timeoutMs,
      });
      if (vp.viewport === 'desktop') {
        result.desktop = shot;
      } else {
        result.mobile = shot;
      }
    } catch (err) {
      const label = vp.viewport === 'desktop' ? 'Desktop' : 'Mobile';
      const msg = `${label} screenshot failed: ${
        err instanceof Error ? err.message : String(err)
      }`;
      result.error = result.error ? `${result.error}; ${msg}` : msg;
    }
  }

  return result;
}

/* ─── Single capture ─────────────────────────────────────────────── */

interface ViewportOptions {
  viewport: 'desktop' | 'mobile';
  width: number;
  height: number;
  timeoutMs: number;
}

async function captureOne(
  verifyHtml: string,
  captureHtml: string,
  options: ViewportOptions
): Promise<IProjectScreenshot> {
  // html2canvas is heavy. Dynamic import so it only loads when a
  // screenshot is actually requested.
  const { default: html2canvas } = await import('html2canvas');

  // Step 1 — verify the document parses and runs.
  await verifyInSandbox(verifyHtml, options.timeoutMs);

  // Step 2 — capture the script-stripped copy.
  const dataUrl = await captureViaContainer(captureHtml, html2canvas, options);

  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error(
      `Screenshot exceeds the maximum allowed size (${Math.round(
        dataUrl.length / 1024
      )} KB). Reduce the page's complexity or remove large images.`
    );
  }

  return {
    viewport: options.viewport,
    width: options.width,
    height: options.height,
    dataUrl,
  };
}

/* ─── Sandbox verification ───────────────────────────────────────── */

/**
 * Load the document into a sandboxed iframe at the target viewport
 * size and wait for it to settle. This is a sanity check: if the
 * student's HTML is malformed enough to prevent the document from
 * loading, the subsequent capture would produce a blank image anyway,
 * and we'd rather surface a clear error.
 *
 * The iframe is not captured. See the module-level comment for why.
 */
function verifyInSandbox(html: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1440px';
    iframe.style.height = '900px';
    iframe.style.border = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        document.body.removeChild(iframe);
      } catch {
        /* ignore */
      }
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timed out waiting for the page to load within ${timeoutMs}ms.`
        )
      );
    }, timeoutMs);

    iframe.onload = () => {
      // Give the student's scripts a moment to run before we proceed.
      window.setTimeout(() => {
        cleanup();
        resolve();
      }, 200);
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('The sandboxed frame failed to load.'));
    };

    iframe.srcdoc = html;
  });
}

/* ─── Container capture ──────────────────────────────────────────── */

/**
 * Render the (already script-stripped) HTML into an off-screen
 * container sized to the target viewport, and rasterize it with
 * html2canvas.
 *
 * The caller passes HTML that has already been through
 * `mergeWebFilesIntoHtml(..., { stripScripts: true })`, so this
 * function does not do any script stripping itself. That keeps the
 * merge logic in one place.
 */
async function captureViaContainer(
  captureHtml: string,
  html2canvas: typeof import('html2canvas').default,
  options: ViewportOptions
): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${options.width}px`;
  container.style.height = `${options.height}px`;
  container.style.overflow = 'hidden';
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';
  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.fontSize = '16px';
  container.style.color = '#111';
  document.body.appendChild(container);

  try {
    // `innerHTML` does not execute scripts anyway, and the caller
    // already stripped them. This is the final assignment.
    container.innerHTML = captureHtml;

    await waitForImages(container, 2000);

    const canvas = await html2canvas(container, {
      width: options.width,
      height: options.height,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: false,
      scale: 1,
    });

    return canvas.toDataURL('image/png');
  } finally {
    try {
      document.body.removeChild(container);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Wait for every `<img>` inside the container to finish loading (or
 * error), or for the timeout to elapse. Whichever happens first.
 */
function waitForImages(
  container: HTMLElement,
  timeoutMs: number
): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let remaining = images.length;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve();
    };

    const tick = () => {
      remaining--;
      if (remaining <= 0) finish();
    };

    const timer = window.setTimeout(finish, timeoutMs);

    for (const img of images) {
      if (img.complete) {
        tick();
      } else {
        img.addEventListener('load', tick, { once: true });
        img.addEventListener('error', tick, { once: true });
      }
    }
  });
}