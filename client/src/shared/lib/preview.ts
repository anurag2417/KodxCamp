/**
 * Shared HTML-preview assembly.
 *
 * This module owns the one true implementation of "merge a web
 * project's three files into a single HTML document." Everything
 * else that needs the same transformation — the live preview pane,
 * the project test engine, the screenshot runner — goes through
 * `mergeWebFilesIntoHtml` here.
 *
 * There are TWO public entry points, deliberately:
 *
 *   - `buildPreviewHtml(files: Record<string,string>)` — keyed by
 *     file name. Used by lesson pages, whose files are stored as
 *     `{ 'index.html': ..., 'styles.css': ..., 'script.js': ... }`.
 *
 *   - `mergeWebFilesIntoHtml(html, css, js, opts?)` — the primitive
 *     underneath. Callers who already have the three strings in
 *     hand (the test engine, the screenshot runner) use this
 *     directly, avoiding a pointless Record wrapping step.
 *
 * The project preview (`features/projects/previewBuilder.ts`) has
 * its own `buildPreviewHtml(files: ApiProjectFile[], previewMode)`
 * because it dispatches across preview modes (html/react/sql/none).
 * Its HTML branch delegates here.
 */

export interface MergeWebFilesOptions {
  /**
   * When true, `<script>` tags remaining in the merged document are
   * stripped. Used by the screenshot runner, which renders the
   * merged HTML into the parent document where scripts would leak
   * into the host context.
   *
   * The external `<script src>` stripping happens unconditionally —
   * that's about avoiding 404s in an `about:srcdoc` iframe, not
   * about isolation.
   */
  stripScripts?: boolean;
}

/**
 * Merge a web project's three files into a single HTML document
 * ready for a sandboxed iframe.
 *
 * Rules:
 *   - Remove `<link rel="stylesheet" ...>` tags (any href).
 *   - Remove `<script src="..." ...></script>` tags.
 *   - Inject `css` into `</head>` as a `<style>` block.
 *   - Inject `js` into `</body>` as an inline `<script>` block.
 *   - If the HTML has no `</head>` / `</body>`, prepend/append so
 *     the injected code still runs.
 *   - If `stripScripts` is set, remove every `<script>` tag from
 *     the final document.
 *
 * The student's `index.html` usually contains a `<link>` and a
 * `<script src>` pointing at files that don't exist in the iframe's
 * scope (`about:srcdoc` resolves relative URLs against the host
 * path, producing 404s or OpaqueResponseBlocking). We inline those
 * files ourselves, so stripping the external references is correct,
 * not lossy.
 */
export function mergeWebFilesIntoHtml(
  html: string,
  css: string,
  javascript: string,
  options: MergeWebFilesOptions = {}
): string {
  let doc = html;

  // 1. Strip external stylesheet links. We inline the CSS below.
  doc = doc.replace(
    /<link\b[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/gi,
    ''
  );

  // 2. Strip external script references. The inline script below is
  //    the real thing; a leftover `<script src>` would 404.
  doc = doc.replace(
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>\s*<\/script>/gi,
    ''
  );
  // Some authors omit the closing tag; catch that form too.
  doc = doc.replace(
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*\/>/gi,
    ''
  );

  // 3. Inject CSS inside <head>, or prepend if there's no </head>.
  if (css) {
    const styleTag = `<style>${css}</style>`;
    if (/<\/head>/i.test(doc)) {
      doc = doc.replace(/<\/head>/i, `${styleTag}\n</head>`);
    } else {
      doc = styleTag + doc;
    }
  }

  // 4. Inject JS before </body>, or append if there's no </body>.
  if (javascript) {
    const scriptTag = `<script>${javascript}</script>`;
    if (/<\/body>/i.test(doc)) {
      doc = doc.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      doc = doc + scriptTag;
    }
  }

  // 5. Optional script strip. The capture path uses this so the
  //    student's JS cannot run in the parent document context.
  if (options.stripScripts) {
    doc = doc.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  }

  return doc;
}

/**
 * Convenience wrapper for callers whose files are stored as a
 * `Record<string,string>` keyed by file name.
 *
 * Lesson pages use this shape. Project pages do not — they have
 * `ApiProjectFile[]` and go through `previewBuilder.ts` instead.
 */
export function buildPreviewHtml(files: Record<string, string>): string {
  return mergeWebFilesIntoHtml(
    files['index.html'] ?? '',
    files['styles.css'] ?? '',
    files['script.js'] ?? ''
  );
}