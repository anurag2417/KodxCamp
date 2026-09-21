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
        : 'text-[#D8E7E0]';

  return (
    <div className="flex h-full flex-col bg-[#06191D]">
      <div className="flex items-center gap-2 border-b border-[#1B4844] bg-[#092328] px-4 py-2">
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
