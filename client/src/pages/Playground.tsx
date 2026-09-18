import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from '../components/editor/CodeEditor';
import { Console } from '../components/editor/Console';
import { RunBar } from '../components/editor/RunBar';
import { useRunner } from '../hooks/useRunner';
import { cn } from '../lib/utils';

type Lang = 'javascript' | 'python';

const STARTERS: Record<Lang, string> = {
  javascript: '// Write your code here\nconsole.log("Hello, KodxCamp!");\n',
  python: 'print("Hello, KodxCamp!")\n',
};

export const Playground: React.FC = () => {
  const [lang, setLang] = useState<Lang>('javascript');
  const [code, setCode] = useState(STARTERS.javascript);
  const { run, running, output, status, reset } = useRunner();

  const switchLang = (next: Lang) => {
    setLang(next);
    setCode(STARTERS[next]);
    reset();
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={70}>
          <div className="flex h-full flex-col bg-surface">
            <RunBar
              left={
                <div className="flex gap-1">
                  {(['javascript', 'python'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLang(l)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                        lang === l
                          ? 'bg-brand-500 text-white'
                          : 'text-text-muted hover:bg-surface-tertiary'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              }
              onRun={() => void run(lang, code)}
              running={running}
            />
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