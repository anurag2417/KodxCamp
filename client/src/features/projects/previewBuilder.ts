import type { ApiProjectFile } from '@/features/projects/api';
import { mergeWebFilesIntoHtml } from '@/shared/lib/preview';

/**
 * Project preview builder.
 *
 * This is the project-page preview entry point. It dispatches across
 * preview modes:
 *
 *   - `html`  → merge index.html + styles.css + script.js
 *   - `react` → wrap in a React 18 UMD + Babel standalone harness
 *   - `sql`   → a static text preview (real execution is elsewhere)
 *   - `none`  → a placeholder page
 *
 * The HTML branch delegates the merge to `mergeWebFilesIntoHtml` in
 * `@/shared/lib/preview`, which is the canonical implementation of
 * that transformation. That primitive is also used by the project
 * test engine and the screenshot runner.
 *
 * The React and SQL branches are project-specific and live here.
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

  return buildHtmlPreview(files);
}

function buildHtmlPreview(files: ApiProjectFile[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? '';
  const css = files.find((f) => f.language === 'css')?.content ?? '';
  const js = files.find((f) => f.language === 'javascript')?.content ?? '';

  return mergeWebFilesIntoHtml(html, css, js);
}

function buildReactPreview(files: ApiProjectFile[]): string {
  const appFile =
    files.find((f) => f.name.endsWith('.jsx') || f.name.endsWith('.js')) ??
    files[0];
  const code = appFile?.content ?? '';

  // React 18 UMD + Babel standalone, loaded from unpkg.
  //
  // This runs the student's JSX *inside the preview iframe*, with
  // whatever sandbox flags the caller set on that iframe. The
  // project workspace uses `allow-scripts allow-forms allow-modals
  // allow-popups` — scripts run, but the iframe has no same-origin
  // access to the parent.
  //
  // This is fine for the live preview. It is NOT what the test
  // engine or screenshot runner do — they handle `react` preview
  // mode differently (the engine skips non-html previews; the
  // screenshot runner renders a script-stripped static copy).
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
  // Don't let user code close the script tag early.
  return code.replace(/<\/script>/gi, '<\\/script>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}