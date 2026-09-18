import { useCallback, useRef, useState } from 'react';
import { runCode, type RunResult } from '../lib/runner';

export type RunnerStatus = 'idle' | 'running' | 'success' | 'error';

export function useRunner(defaultTimeoutMs = 5000) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const callIdRef = useRef(0);

  const run = useCallback(
    async (language: string, code: string) => {
      const myCallId = ++callIdRef.current;
      setRunning(true);
      setStatus('running');
      setOutput('Running...');

      try {
        const r = await runCode(language, code, { timeoutMs: defaultTimeoutMs });

        // Ignore stale results
        if (myCallId !== callIdRef.current) return r;

        const combined =
          [r.stdout, r.stderr].filter(Boolean).join('\n') || '(no output)';

        setResult(r);
        setOutput(combined);
        setStatus(r.ok ? 'success' : 'error');
        return r;
      } catch (err) {
        if (myCallId !== callIdRef.current) throw err;

        const message = err instanceof Error ? err.message : String(err);
        setOutput(`Runner error: ${message}`);
        setStatus('error');
        throw err;
      } finally {
        if (myCallId === callIdRef.current) {
          setRunning(false);
        }
      }
    },
    [defaultTimeoutMs]
  );

  const reset = useCallback(() => {
    setResult(null);
    setOutput('');
    setStatus('idle');
  }, []);

  return { run, running, result, output, status, reset };
}