import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/shared/store/theme.store';

window.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new jsonWorker();
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker();
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker();
      case 'typescript':
      case 'javascript':
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

loader.config({ monaco });

// ─── VS Code themes ───────────────────────────────────────────────
//
// Monaco does not ship VS Code's actual default themes (Dark+ and
// Light+). Its built-ins - 'vs' and 'vs-dark' - are older, simpler
// palettes that color CSS selectors, JS keywords, and strings
// differently from what students see in VS Code.
//
// The token rules below are lifted from VS Code's official theme
// definitions (`dark_plus.json` / `light_plus.json`), trimmed to the
// scopes that actually fire for HTML, CSS, JS, and TS. Identifiers,
// keywords, strings, comments, numbers, and control-flow tokens all
// match VS Code's palette.

const KODX_THEME_DARK = 'kodx-dark';
const KODX_THEME_LIGHT = 'kodx-light';

let themesRegistered = false;

function registerKodxThemes() {
  if (themesRegistered) return;
  themesRegistered = true;

  // ── Dark+ ──
  monaco.editor.defineTheme(KODX_THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Comments
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'comment.doc', foreground: '6A9955', fontStyle: 'italic' },
      // Keywords, control flow
      { token: 'keyword', foreground: '569CD6' },
      { token: 'keyword.control', foreground: 'C586C0' },
      { token: 'keyword.operator', foreground: 'D4D4D4' },
      // Strings
      { token: 'string', foreground: 'CE9178' },
      { token: 'string.escape', foreground: 'D7BA7D' },
      { token: 'string.key.json', foreground: '9CDCFE' },
      { token: 'string.value.json', foreground: 'CE9178' },
      // Numbers, constants
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'number.hex', foreground: 'B5CEA8' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'constant.numeric', foreground: 'B5CEA8' },
      { token: 'constant.language', foreground: '569CD6' },
      // Types, classes
      { token: 'type', foreground: '4EC9B0' },
      { token: 'type.identifier', foreground: '4EC9B0' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'function', foreground: 'DCDCAA' },
      // Variables
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'variable.parameter', foreground: '9CDCFE' },
      { token: 'variable.predefined', foreground: '4FC1FF' },
      // HTML-specific
      { token: 'tag', foreground: '569CD6' },
      { token: 'tag.id', foreground: '569CD6' },
      { token: 'tag.class', foreground: '569CD6' },
      { token: 'attribute.name', foreground: '9CDCFE' },
      { token: 'attribute.value', foreground: 'CE9178' },
      // CSS-specific
      { token: 'attribute.name.css', foreground: '9CDCFE' },
      { token: 'attribute.value.css', foreground: 'CE9178' },
      { token: 'attribute.value.number.css', foreground: 'B5CEA8' },
      { token: 'attribute.value.unit.css', foreground: 'B5CEA8' },
      { token: 'attribute.value.hex.css', foreground: 'B5CEA8' },
      { token: 'selector', foreground: 'D7BA7D' },
      { token: 'tag.css', foreground: 'D7BA7D' },
      { token: 'keyword.css', foreground: 'C586C0' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editorCursor.foreground': '#AEAFAD',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editor.lineHighlightBackground': '#2A2D2E',
      'editorIndentGuide.background1': '#404040',
      'editorIndentGuide.activeBackground1': '#707070',
      'editorWhitespace.foreground': '#3B3B3B',
      'editorBracketMatch.background': '#0D3A58',
      'editorBracketMatch.border': '#888888',
      'editorSuggestWidget.background': '#252526',
      'editorSuggestWidget.border': '#454545',
      'editorSuggestWidget.foreground': '#D4D4D4',
      'editorSuggestWidget.selectedBackground': '#04395E',
      'editorHoverWidget.background': '#252526',
      'editorHoverWidget.border': '#454545',
    },
  });

  // ── Light+ ──
  monaco.editor.defineTheme(KODX_THEME_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      // Comments
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'comment.doc', foreground: '008000', fontStyle: 'italic' },
      // Keywords, control flow
      { token: 'keyword', foreground: '0000FF' },
      { token: 'keyword.control', foreground: 'AF00DB' },
      { token: 'keyword.operator', foreground: '000000' },
      // Strings
      { token: 'string', foreground: 'A31515' },
      { token: 'string.escape', foreground: 'EE0000' },
      { token: 'string.key.json', foreground: '0451A5' },
      { token: 'string.value.json', foreground: 'A31515' },
      // Numbers, constants
      { token: 'number', foreground: '098658' },
      { token: 'number.hex', foreground: '098658' },
      { token: 'constant', foreground: '0070C1' },
      { token: 'constant.numeric', foreground: '098658' },
      { token: 'constant.language', foreground: '0000FF' },
      // Types, classes
      { token: 'type', foreground: '267F99' },
      { token: 'type.identifier', foreground: '267F99' },
      { token: 'identifier', foreground: '001080' },
      { token: 'function', foreground: '795E26' },
      // Variables
      { token: 'variable', foreground: '001080' },
      { token: 'variable.parameter', foreground: '001080' },
      { token: 'variable.predefined', foreground: '0070C1' },
      // HTML-specific
      { token: 'tag', foreground: '800000' },
      { token: 'tag.id', foreground: '800000' },
      { token: 'tag.class', foreground: '800000' },
      { token: 'attribute.name', foreground: 'FF0000' },
      { token: 'attribute.value', foreground: '0451A5' },
      // CSS-specific
      { token: 'attribute.name.css', foreground: 'FF0000' },
      { token: 'attribute.value.css', foreground: '0451A5' },
      { token: 'attribute.value.number.css', foreground: '098658' },
      { token: 'attribute.value.unit.css', foreground: '098658' },
      { token: 'attribute.value.hex.css', foreground: '098658' },
      { token: 'selector', foreground: '800000' },
      { token: 'tag.css', foreground: '800000' },
      { token: 'keyword.css', foreground: 'AF00DB' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0B216F',
      'editorCursor.foreground': '#000000',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editor.lineHighlightBackground': '#F3F3F3',
      'editorIndentGuide.background1': '#D3D3D3',
      'editorIndentGuide.activeBackground1': '#939393',
      'editorWhitespace.foreground': '#333333',
      'editorBracketMatch.background': '#0064001A',
      'editorBracketMatch.border': '#B9B9B9',
      'editorSuggestWidget.background': '#F3F3F3',
      'editorSuggestWidget.border': '#C8C8C8',
      'editorSuggestWidget.foreground': '#000000',
      'editorSuggestWidget.selectedBackground': '#0060C0',
      'editorHoverWidget.background': '#F3F3F3',
      'editorHoverWidget.border': '#C8C8C8',
    },
  });
}

// Register immediately on module load. Idempotent.
registerKodxThemes();

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  height?: string;
  /**
   * All three web files for the current project, when the editor is
   * showing a web lesson or web problem. Used to derive class/id/tag
   * suggestions for the CSS and JS files from the HTML file.
   *
   * Optional - for non-web languages this is undefined and the custom
   * completion providers are no-ops.
   */
  projectFiles?: Record<string, string>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  height = '100%',
  projectFiles,
}) => {
  const theme = useThemeStore((s) => s.theme);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const monacoTheme = theme === 'dark' ? KODX_THEME_DARK : KODX_THEME_LIGHT;

  // Clean up completion providers on unmount so switching lessons
  // doesn't stack duplicate suggestions.
  useEffect(() => {
    return () => {
      for (const d of disposablesRef.current) {
        try {
          d.dispose();
        } catch {
          /* ignore */
        }
      }
      disposablesRef.current = [];
    };
  }, []);

  // Re-apply the theme and force a re-tokenization when the app's
  // theme flips. Monaco caches tokens per model; without nudging the
  // model, open files keep their old colors until the student edits
  // them.
  useEffect(() => {
    monaco.editor.setTheme(monacoTheme);
    const model = editorRef.current?.getModel();
    if (model) {
      // Re-setting the language forces the tokenizer to re-run with
      // the new theme's rules applied.
      const currentLang = model.getLanguageId();
      monaco.editor.setModelLanguage(model, 'plaintext');
      monaco.editor.setModelLanguage(model, currentLang);
    }
  }, [monacoTheme]);

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={monacoTheme}
      onChange={(val) => onChange?.(val ?? '')}
      onMount={(editor) => {
        editorRef.current = editor;

        const model = editor.getModel();
        if (!model) return;

        const dom = extractDomSymbols(projectFiles?.['index.html'] ?? '');
        const entries: monaco.IDisposable[] = [];

        if (model.getLanguageId() === 'css') {
          entries.push(registerCssSuggestions(dom));
        } else if (
          model.getLanguageId() === 'javascript' ||
          model.getLanguageId() === 'typescript'
        ) {
          entries.push(registerJsSuggestions(dom));
        }

        disposablesRef.current.push(...entries);
      }}
      options={{
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        wordBasedSuggestions: 'currentDocument',
        // Match VS Code's default editor font rendering.
        renderLineHighlight: 'all',
        renderWhitespace: 'selection',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
      }}
    />
  );
};

// ─── DOM symbol extraction ────────────────────────────────────────

interface DomSymbols {
  classes: string[];
  ids: string[];
  tags: string[];
}

const KNOWN_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'blockquote',
  'body', 'br', 'button', 'canvas', 'caption', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl',
  'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'i',
  'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol',
  'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot',
  'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
]);

function extractDomSymbols(html: string): DomSymbols {
  const classes = new Set<string>();
  const ids = new Set<string>();
  const tags = new Set<string>();

  for (const m of html.matchAll(/class\s*=\s*"([^"]*)"/gi)) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) classes.add(c);
  }
  for (const m of html.matchAll(/id\s*=\s*"([^"]*)"/gi)) {
    if (m[1].trim()) ids.add(m[1].trim());
  }
  for (const m of html.matchAll(/<\s*([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    const tag = m[1].toLowerCase();
    if (KNOWN_TAGS.has(tag)) tags.add(tag);
  }

  return {
    classes: Array.from(classes),
    ids: Array.from(ids),
    tags: Array.from(tags),
  };
}

// ─── CSS suggestions ──────────────────────────────────────────────

function registerCssSuggestions(dom: DomSymbols): monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider('css', {
    triggerCharacters: ['.', '#'],
    provideCompletionItems(model, position) {
      const wordInfo = model.getWordUntilPosition(position);
      const line = model.getLineContent(position.lineNumber);
      const before = line.slice(0, position.column - 1);

      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      const inClassContext = /\.\s*[\w-]*$/.test(before);
      const inIdContext = /#\s*[\w-]*$/.test(before);

      if (inClassContext || !inIdContext) {
        for (const cls of dom.classes) {
          suggestions.push({
            label: `.${cls}`,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `.${cls}`,
            detail: 'class in index.html',
            range,
          });
        }
      }

      if (inIdContext || !inClassContext) {
        for (const id of dom.ids) {
          suggestions.push({
            label: `#${id}`,
            kind: monaco.languages.CompletionItemKind.Reference,
            insertText: `#${id}`,
            detail: 'id in index.html',
            range,
          });
        }
      }

      if (!inClassContext && !inIdContext) {
        for (const tag of dom.tags) {
          suggestions.push({
            label: tag,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: tag,
            detail: 'tag in index.html',
            range,
          });
        }
      }

      return { suggestions };
    },
  });
}

// ─── JS suggestions ───────────────────────────────────────────────

function registerJsSuggestions(dom: DomSymbols): monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(model, position) {
      const wordInfo = model.getWordUntilPosition(position);
      const line = model.getLineContent(position.lineNumber);
      const before = line.slice(0, position.column - 1);

      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      const inGetElementById = /getElementById\s*\(\s*['"][^'"]*$/.test(before);
      const inQuerySelectorHash = /querySelector\s*\(\s*['"]#[^'"]*$/.test(before);
      const inQuerySelectorDot = /querySelector(?:All)?\s*\(\s*['"]\.[^'"]*$/.test(before);

      if (inGetElementById || inQuerySelectorHash) {
        for (const id of dom.ids) {
          suggestions.push({
            label: id,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: id,
            detail: 'id in index.html',
            range,
          });
        }
      }

      if (inQuerySelectorDot) {
        for (const cls of dom.classes) {
          suggestions.push({
            label: cls,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: cls,
            detail: 'class in index.html',
            range,
          });
        }
      }

      return { suggestions };
    },
  });
}