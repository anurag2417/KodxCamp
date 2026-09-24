/**
 * Assemble the three web files into a single HTML document ready for a
 * sandboxed iframe.
 *
 * The student's `index.html` usually contains a `<link rel="stylesheet"
 * href="styles.css">` and a `<script src="script.js"></script>`. Those
 * point at files that don't exist in the iframe's scope - the preview
 * is a `srcDoc` blob whose origin is `about:srcdoc`, so the browser
 * tries to resolve the relative URLs against the host page path and
 * gets a 404 (or is blocked by OpaqueResponseBlocking).
 *
 * We already inline the CSS and JS ourselves, so the honest thing to
 * do is strip those external references before injection. Anything
 * left in the HTML that references a non-existent file is a bug, not
 * a feature.
 *
 * Rules:
 *   - Remove `<link rel="stylesheet" ...>` tags (any href).
 *   - Remove `<script src="..." ...></script>` tags.
 *   - Inject CSS into `</head>` as a `<style>` block.
 *   - Inject JS into `</body>` as an inline `<script>` block.
 *   - If the HTML has no `</head>` / `</body>`, prepend/append so the
 *     injected code still runs.
 */
export function buildPreviewHtml(files: Record<string, string>): string {
  const html = files['index.html'] ?? '';
  const css = files['styles.css'] ?? '';
  const javascript = files['script.js'] ?? '';

  let doc = html;

  // 1. Strip external stylesheet links. We're inlining the CSS below.
  doc = doc.replace(
    /<link\b[^>]*rel\s*=\s*["']?stylesheet["']?[^>]*>/gi,
    ''
  );

  // 2. Strip external script references. The inline script below is
  //    the real thing; a leftover `<script src>` would try to load a
  //    file that doesn't exist.
  doc = doc.replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>\s*<\/script>/gi, '');
  // Some students omit the closing tag; catch that form too.
  doc = doc.replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*\/>/gi, '');

  // 3. Inject CSS inside <head>, or prepend if there's no <head>.
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

  return doc;
}