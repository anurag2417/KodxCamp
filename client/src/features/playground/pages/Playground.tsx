import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from '@/shared/components/editor/CodeEditor';
import { Console } from '@/shared/components/editor/Console';
import { RunBar } from '@/shared/components/editor/RunBar';
import { useRunner } from '@/shared/hooks/useRunner';
import { cn } from '@/shared/lib/utils';
import { getAdapter, listAdapters } from '@/shared/runner/adapters';

/**
 * Languages the playground offers. Not every adapter is included —
 * `html-css`, `react`, and `tailwind` render into an iframe and don't
 * produce stdout, so they don't fit the playground's console-based UX.
 */
const PLAYGROUND_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'java', label: 'Java' },
  { id: 'sql', label: 'SQL' },
];

const STARTERS: Record<string, string> = {
  javascript: '// Write your code here\nconsole.log("Hello, KodxCamp!");\n',
  python: 'print("Hello, KodxCamp!")\n',
  ruby: 'puts "Hello, KodxCamp!"\n',
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, KodxCamp!");
  }
}
`,
  sql: `-- Setup
CREATE TABLE users (id INTEGER, name TEXT);
INSERT INTO users VALUES (1, 'Ada'), (2, 'Alan');

-- Query
SELECT * FROM users;
`,
};

function toMonacoLanguage(lang: string): string {
  switch (lang) {
    case 'javascript':
      return 'javascript';
    case 'typescript':
      return 'typescript';
    case 'python':
      return 'python';
    case 'ruby':
      return 'ruby';
    case 'java':
      return 'java';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}

export const Playground: React.FC = () => {
  // Only list languages that actually have a registered adapter.
  // This future-proofs the picker against an adapter being removed.
  const availableLanguages = PLAYGROUND_LANGUAGES.filter(
    (l) => getAdapter(l.id) !== undefined
  );

  const [lang, setLang] = useState<string>('javascript');
  const [code, setCode] = useState(STARTERS.javascript);
  const [runtimeReady, setRuntimeReady] = useState(true);
  const { run, running, output, status, reset } = useRunner();

  // Warm the runtime when the language changes.
  useEffect(() => {
    const adapter = getAdapter(lang);
    if (!adapter?.init) {
      setRuntimeReady(true);
      return;
    }
    setRuntimeReady(adapter.isReady());
    let cancelled = false;
    adapter.init().then(() => {
      if (!cancelled) setRuntimeReady(true);
    }).catch(() => {
      if (!cancelled) setRuntimeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const switchLang = (next: string) => {
    setLang(next);
    setCode(STARTERS[next] ?? '');
    reset();
  };

  // Silence unused-variable warnings for imports kept for future use.
  void listAdapters;

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={70}>
          <div className="flex h-full flex-col bg-surface">
            <RunBar
              left={
                <div className="flex gap-1">
                  {availableLanguages.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => switchLang(l.id)}
                      className={cn(
                        'relative rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                        lang === l.id
                          ? 'bg-brand-500 text-white'
                          : 'text-text-muted hover:bg-surface-tertiary'
                      )}
                    >
                      {l.label}
                      {lang === l.id && !runtimeReady && (
                        <span
                          className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-70"
                          title="Loading runtime…"
                        />
                      )}
                    </button>
                  ))}
                </div>
              }
              onRun={() => void run(lang, code)}
              running={running}
            />
            <div className="flex-1">
              <CodeEditor
                language={toMonacoLanguage(lang)}
                value={code}
                onChange={setCode}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-brand-500" />

        <Panel defaultSize={30}>
          <Console output={output} status={status} />
        </Panel>
      </PanelGroup>
    </div>
  );
};