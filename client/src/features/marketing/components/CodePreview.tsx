import { useState } from 'react';
import { Play, CheckCircle2, Loader2 } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { cn } from '../../../shared/lib/utils';

type Tab = 'javascript' | 'python';

const SAMPLE_CODE: Record<Tab, string> = {
  javascript: `function reverse(str) {
  return str.split('').reverse().join('');
}

const result = reverse("kodxcamp");
console.log(result);`,
  python: `def reverse(s):
    return s[::-1]

print(reverse("kodxcamp"))`,
};

const EXPECTED_OUTPUT = 'pmacxodk';

export const CodePreview: React.FC = () => {
  const { ref, inView } = useInView();
  const [tab, setTab] = useState<Tab>('javascript');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutput(null);
    setPassed(false);

    // Simulate a quick "run" — this is a marketing demo, not a real runner
    await new Promise((r) => setTimeout(r, 600));

    setOutput(EXPECTED_OUTPUT);
    setPassed(true);
    setRunning(false);
  };

  return (
    <section ref={ref} className="bg-surface-secondary py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Copy */}
          <div className={inView ? 'reveal-left' : 'opacity-0'}>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              The workspace
            </p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
              A code editor that feels like home.
            </h2>
            <p className="mt-4 text-base text-text-muted">
              Monaco-powered editor. Real test cases. Instant feedback. Run
              JavaScript or Python without installing a thing.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Split-panel layout: instructions, editor, console',
                'Auto-invokes your function and compares output',
                'Beautiful results view with per-test feedback',
                'Persistent Python runtime — no cold starts',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/10">
                    <svg
                      className="h-3 w-3 text-brand-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-sm text-text-secondary">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive mockup */}
          <div className={inView ? 'reveal-right' : 'opacity-0'}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-3 py-2">
                <div className="flex items-center gap-1 rounded-lg bg-surface p-0.5">
                  {(['javascript', 'python'] as Tab[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setTab(l);
                        setOutput(null);
                        setPassed(false);
                      }}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                        tab === l
                          ? 'bg-brand-500 text-white'
                          : 'text-text-muted hover:text-text-secondary'
                      )}
                    >
                      {l === 'javascript' ? 'JavaScript' : 'Python'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={run}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {running ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  Run
                </button>
              </div>

              {/* Editor */}
              <pre className="max-h-[280px] overflow-auto bg-[#06191D] p-5 font-mono text-xs leading-relaxed text-[#D8E7E0]">
                <code>{SAMPLE_CODE[tab]}</code>
              </pre>

              {/* Result panel */}
              <div className="border-t border-border bg-surface p-4">
                {output === null && !running && (
                  <p className="text-xs text-text-muted">
                    Click <strong className="text-text-secondary">Run</strong>{' '}
                    to execute the code.
                  </p>
                )}
                {running && (
                  <p className="flex items-center gap-2 text-xs text-text-muted">
                    <Loader2 size={12} className="animate-spin" /> Running…
                  </p>
                )}
                {output !== null && (
                  <div
                    className={cn(
                      'rounded-lg border p-3 text-xs',
                      passed
                        ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5'
                        : 'border-[var(--color-error)]/30 bg-[var(--color-error)]/5'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {passed && (
                        <CheckCircle2
                          size={14}
                          className="text-[var(--color-success)]"
                        />
                      )}
                      <span
                        className={cn(
                          'font-semibold',
                          passed
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-error)]'
                        )}
                      >
                        {passed ? 'Accepted' : 'Wrong Answer'}
                      </span>
                      <span className="ml-auto text-text-muted">
                        {passed ? '1/1 tests passed' : '0/1 tests passed'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-text-muted">Output: </span>
                      <span className="font-mono text-text-primary">
                        {output}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};