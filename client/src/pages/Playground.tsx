import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '../components/ui/Button';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';

type Lang = 'javascript' | 'python';

export const Playground: React.FC = () => {
  const [lang, setLang] = useState<Lang>('javascript');
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello!");');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runCode = () => {
    if (lang !== 'javascript') {
      setOutput('Python execution via Pyodide — coming in a later part.');
      setStatus('idle');
      return;
    }
    setStatus('running');
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
    try {
      // eslint-disable-next-line no-new-func
      new Function(code)();
      console.log = originalLog;
      setOutput(logs.join('\n') || '(no output)');
      setStatus('success');
    } catch (err) {
      console.log = originalLog;
      setOutput(String(err));
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
                    onClick={() => setLang(l)}
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
              <Button size="sm" onClick={runCode}>
                ▶ Run
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