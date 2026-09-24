interface ConsoleProps {
  output: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export const Console: React.FC<ConsoleProps> = ({ output, status = 'idle' }) => {
  const color =
    status === 'error'
      ? 'text-[var(--color-error)]'
      : status === 'success'
        ? 'text-[var(--color-success)]'
        : 'text-[var(--color-code-text)]';

  return (
    <div className="flex h-full flex-col bg-[var(--color-code-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-code-border)] bg-[var(--color-code-surface)] px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-300">
          Console
        </span>
      </div>
      <pre className={`flex-1 overflow-auto p-4 font-mono text-sm ${color}`}>
        {output || '> Ready. Run your code to see output.'}
      </pre>
    </div>
  );
};
