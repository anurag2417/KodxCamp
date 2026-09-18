import { useCallback, useState } from 'react';
import { runCode, type RunResult } from '../lib/runner';

export function useRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const run = useCallback(async (language: string, code: string) => {
    setRunning(true);
    try {
      const r = await runCode(language, code);
      setResult(r);
      return r;
    } finally {
      setRunning(false);
    }
  }, []);

  return { run, running, result };
}