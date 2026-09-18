import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '../components/ui/Button';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { runCode } from '../lib/runner';

type Lang = 'javascript' | 'python';

const STARTERS: Record<Lang, string> = {
  javascript: '// Write your code here\nconsole.log("Hello, KodxCamp!");\n',
  python: 'print("Hello, KodxCamp!")\n',
};

export const Playground: React.FC = () => {
  const [lang, setLang] = useState<Lang>('javascript');
  const [code, setCode] = useState(STARTERS.javascript);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const switchLang = (next: Lang) => {
    setLang(next);
    setCode(STARTERS[next]);
    setOutput('');
    setStatus('idle');
  };

  const run = async () => {
    setStatus('running');
    setOutput('Running...');
    try {
      const result = await runCode(lang, code, { timeoutMs: 8000 });
      const combined =
        [result.stdout, result.stderr].filter(Boolean).join('\n') || '(no output)';
      setOutput(combined);
      setStatus(result.ok ? 'success' : 'error');
    } catch (err) {
      setOutput(
        `Runner error: ${err instanceof Error ? err.message : String(err)}`
      );
      setStatus('error');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={70}>
          <div className="flex h-full flex-col bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-2">
              <div className="flex gap-1">
                {(['javascript', 'python'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      lang === l
                        ? 'bg-brand-500 text-white'
                        : 'text-text-muted hover:bg-surface-tertiary'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={run} disabled={status === 'running'}>
                {status === 'running' ? 'Running...' : '▶ Run'}
              </Button>
            </div>
            <div className="flex-1">
              <CodeEditor language={lang} value={code} onChange={setCode} />
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