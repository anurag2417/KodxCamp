import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Play, Terminal } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

const TESTS = [
  { label: '[2, 7, 11, 15], 9', expected: '[0,1]' },
  { label: '[3, 2, 4], 6', expected: '[1,2]' },
  { label: '[3, 3], 6', expected: '[0,1]' },
  { label: '[-1, -2, -3], -5', expected: '[1,2]' },
  { label: '[100, 200, 300], 500', expected: '[1,2]' },
];

export const AuthWorkspacePreview: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'running' | 'accepted'>('idle');
  const [passedCount, setPassedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const runCycle = async () => {
      while (!cancelled) {
        // Idle
        setPhase('idle');
        setPassedCount(0);
        await sleep(1500, () => cancelled);

        // Running — tests fill in one by one
        setPhase('running');
        for (let i = 0; i < TESTS.length; i++) {
          await sleep(500, () => cancelled);
          setPassedCount(i + 1);
        }

        // Accepted
        setPhase('accepted');
        await sleep(3500, () => cancelled);
      }
    };

    void runCycle();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#06191D] shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#092328] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#F07178]" />
          <span className="h-3 w-3 rounded-full bg-[#EBCB7A]" />
          <span className="h-3 w-3 rounded-full bg-[#8BBB92]" />
        </div>
        <span className="ml-2 flex items-center gap-2 font-mono text-xs text-[#88A39A]">
          <Terminal size={12} />
          two-sum.js
        </span>

        <div className="ml-auto flex items-center gap-2 rounded-md bg-[#0D3032] px-3 py-1.5 text-xs font-medium">
          {phase === 'idle' && (
            <>
              <Play size={12} className="text-[#8BBB92]" />
              <span className="text-[#8BBB92]">Run</span>
            </>
          )}
          {phase === 'running' && (
            <>
              <Loader2 size={12} className="animate-spin text-[#8BBB92]" />
              <span className="text-[#8BBB92]">Running…</span>
            </>
          )}
          {phase === 'accepted' && (
            <>
              <CheckCircle2 size={12} className="text-[var(--color-success)]" />
              <span className="text-[var(--color-success)]">Accepted</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* Code column (60%) */}
        <pre className="col-span-3 overflow-hidden p-5 font-mono text-[12px] leading-relaxed text-[#C7D8D1] xl:text-[13px]">
          <code>
            <span className="text-[#88A39A]">{'// Find two numbers that add to target'}</span>
            {'\n'}
            <span className="text-[#8BBB92]">function</span>{' '}
            <span className="text-white">twoSum</span>
            <span className="text-[#C7D8D1]">(</span>
            <span className="text-[#EBCB7A]">nums</span>
            <span className="text-[#C7D8D1]">, </span>
            <span className="text-[#EBCB7A]">target</span>
            <span className="text-[#C7D8D1]">) {'{'}</span>
            {'\n  '}
            <span className="text-[#8BBB92]">const</span>{' '}
            <span className="text-white">seen</span>{' '}
            <span className="text-[#C7D8D1]">= </span>
            <span className="text-[#8BBB92]">new</span>{' '}
            <span className="text-white">Map</span>
            <span className="text-[#C7D8D1]">();</span>
            {'\n  '}
            <span className="text-[#8BBB92]">for</span>{' '}
            <span className="text-[#C7D8D1]">(</span>
            <span className="text-[#8BBB92]">let</span>{' '}
            <span className="text-white">i</span>{' '}
            <span className="text-[#C7D8D1]">= 0; i &lt; nums.length; i++) {'{'}</span>
            {'\n    '}
            <span className="text-[#8BBB92]">const</span>{' '}
            <span className="text-white">diff</span>{' '}
            <span className="text-[#C7D8D1]">= target - nums[i];</span>
            {'\n    '}
            <span className="text-[#8BBB92]">if</span>{' '}
            <span className="text-[#C7D8D1]">(seen.has(diff))</span>
            {'\n      '}
            <span className="text-[#8BBB92]">return</span>{' '}
            <span className="text-[#C7D8D1]">[seen.get(diff), i];</span>
            {'\n    '}
            <span className="text-white">seen.set</span>
            <span className="text-[#C7D8D1]">(nums[i], i);</span>
            {'\n  '}
            <span className="text-[#C7D8D1]">{'}'}</span>
            {'\n'}
            <span className="text-[#C7D8D1]">{'}'}</span>
          </code>
        </pre>

        {/* Tests column (40%) */}
        <div className="col-span-2 border-l border-white/10 bg-[#092328] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#88A39A]">
            Test cases
          </p>
          <ul className="space-y-2">
            {TESTS.map((test, i) => {
              const revealed = passedCount > i;
              return (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-2.5 py-1.5 font-mono text-[10px] transition-all duration-300',
                    revealed
                      ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                      : 'text-[#88A39A]'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 transition-opacity duration-300',
                      revealed ? 'opacity-100' : 'opacity-30'
                    )}
                  >
                    {revealed ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <span className="inline-block h-2.5 w-2.5 rounded-full border border-current" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate">{test.label}</p>
                    {revealed && (
                      <p className="mt-0.5 text-[9px] opacity-75">
                        → {test.expected}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {phase === 'accepted' && (
            <div className="mt-4 rounded-md bg-[var(--color-success)]/15 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-success)]">
                Accepted
              </p>
              <p className="mt-0.5 text-[10px] text-[#88A39A]">
                All tests passed in 42ms
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function sleep(ms: number, isCancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      if (!isCancelled()) resolve();
      else resolve();
    }, ms);
    return () => clearTimeout(t);
  });
}