import type { ApiProjectFile } from './projects.api';

/**
 * Combine user files into a single HTML document ready for a sandboxed iframe.
 * Handles: html, css (inlined), js (inlined, after DOM ready), jsx (via CDN React).
 */
export function buildPreviewHtml(
  files: ApiProjectFile[],
  previewMode: 'html' | 'react' | 'sql' | 'none'
): string {
  if (previewMode === 'none') {
    return '<!DOCTYPE html><body style="font-family:system-ui;padding:1rem;">No preview for this project.</body>';
  }

  if (previewMode === 'react') {
    return buildReactPreview(files);
  }

  if (previewMode === 'sql') {
    return buildSqlPlaceholder(files);
  }

  // Default: HTML
  return buildHtmlPreview(files);
}

function buildHtmlPreview(files: ApiProjectFile[]): string {
  const html = files.find((f) => f.name.endsWith('.html'))?.content ?? '';
  const css = files.find((f) => f.name.endsWith('.css'))?.content ?? '';
  const js = files.find((f) => f.name.endsWith('.js'))?.content ?? '';

  // If the HTML already links to css/js by filename, we still inline them.
  let doc = html;

  // Inject CSS
  if (css) {
    const styleTag = `<style>${css}</style>`;
    if (doc.includes('</head>')) {
      doc = doc.replace('</head>', `${styleTag}\n</head>`);
    } else {
      doc = styleTag + doc;
    }
  }

  // Inject JS — remove the <script src="..."> so it doesn't 404
  doc = doc.replace(/<script[^>]*src=[^>]*><\/script>/gi, '');

  if (js) {
    const scriptTag = `<script>${js}</script>`;
    if (doc.includes('</body>')) {
      doc = doc.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      doc += scriptTag;
    }
  }

  return doc;
}

function buildReactPreview(files: ApiProjectFile[]): string {
  const appFile =
    files.find((f) => f.name.endsWith('.jsx') || f.name.endsWith('.js')) ?? files[0];
  const code = appFile?.content ?? '';

  // Use Babel standalone to transform JSX in the iframe. Simple but works.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f7faf8; }
</style>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-type="module" data-presets="react">
${escapeForInline(code)}
</script>
<script type="text/babel">
const { createRoot } = ReactDOM;
const root = createRoot(document.getElementById('root'));
const App = typeof App !== 'undefined' ? App : (window.App || function(){ return React.createElement('div',null,'No App export found'); });
root.render(React.createElement(App));
</script>
</body>
</html>`;
}

function buildSqlPlaceholder(files: ApiProjectFile[]): string {
  const sql = files.find((f) => f.name.endsWith('.sql'))?.content ?? '';
  return `<!DOCTYPE html>
<html><head><style>
  body { font-family: ui-monospace, monospace; padding: 1rem; background: #06191D; color: #D8E7E0; }
  pre { white-space: pre-wrap; }
  strong { color: #8BBB92; }
</style></head>
<body>
<strong>SQL Preview</strong>
<pre>${escapeHtml(sql)}</pre>
<p style="opacity:0.6">Click <em>Run</em> to execute against an in-browser SQLite database.</p>
</body></html>`;
}

function escapeForInline(code: string): string {
  // Don't let user code close the script tag early
  return code.replace(/<\/script>/gi, '<\\/script>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}