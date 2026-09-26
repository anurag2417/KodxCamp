import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Play, Terminal } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/**
 * Animated mock of the KodxCamp practice workspace.
 *
 * Runs a fixed loop: idle → running (tests pass one by one) → accepted →
 * idle. Purely decorative. Lives only on the auth shell's left panel,
 * which is always dark. All colors in this component are hardcoded on
 * purpose — the panel is theme-invariant, so we do NOT want the app's
 * theme tokens flipping these surfaces when the user toggles light/dark.
 *
 * Palette (matches the spec's dark 3D / code-editor surface language):
 *   Editor background  #0B1120   (spec "code editor" dark)
 *   Toolbar background #0F172A   (spec dark background)
 *   Secondary surface  #1E293B   (spec dark surface)
 *   Primary text       #F8FAFC
 *   Secondary text     #CBD5E1
 *   Muted text         #94A3B8
 *   Brand bright blue  #60A5FA   (identifiers, function names)
 *   Action orange      #F97316   (accents)
 *   Success            #22C55E
 *   Traffic-light dots #EF4444, #F59E0B, #22C55E
 */

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

        // Running - tests fill in one by one
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120] shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#0F172A] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
          <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
          <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
        </div>
        <span className="ml-2 flex items-center gap-2 font-mono text-xs text-[#94A3B8]">
          <Terminal size={12} />
          two-sum.js
        </span>

        <div className="ml-auto flex items-center gap-2 rounded-md bg-[#1E293B] px-3 py-1.5 text-xs font-medium">
          {phase === 'idle' && (
            <>
              <Play size={12} className="text-[#60A5FA]" />
              <span className="text-[#60A5FA]">Run</span>
            </>
          )}
          {phase === 'running' && (
            <>
              <Loader2 size={12} className="animate-spin text-[#60A5FA]" />
              <span className="text-[#60A5FA]">Running…</span>
            </>
          )}
          {phase === 'accepted' && (
            <>
              <CheckCircle2 size={12} className="text-[#22C55E]" />
              <span className="text-[#22C55E]">Accepted</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* Code column (60%) */}
        <pre className="col-span-3 overflow-hidden p-5 font-mono text-[12px] leading-relaxed text-[#CBD5E1] xl:text-[13px]">
          <code>
            <span className="text-[#94A3B8]">{'// Find two numbers that add to target'}</span>
            {'\n'}
            <span className="text-[#F97316]">function</span>{' '}
            <span className="text-white">twoSum</span>
            <span className="text-[#CBD5E1]">(</span>
            <span className="text-[#60A5FA]">nums</span>
            <span className="text-[#CBD5E1]">, </span>
            <span className="text-[#60A5FA]">target</span>
            <span className="text-[#CBD5E1]">) {'{'}</span>
            {'\n  '}
            <span className="text-[#F97316]">const</span>{' '}
            <span className="text-white">seen</span>{' '}
            <span className="text-[#CBD5E1]">= </span>
            <span className="text-[#F97316]">new</span>{' '}
            <span className="text-white">Map</span>
            <span className="text-[#CBD5E1]">();</span>
            {'\n  '}
            <span className="text-[#F97316]">for</span>{' '}
            <span className="text-[#CBD5E1]">(</span>
            <span className="text-[#F97316]">let</span>{' '}
            <span className="text-white">i</span>{' '}
            <span className="text-[#CBD5E1]">= 0; i &lt; nums.length; i++) {'{'}</span>
            {'\n    '}
            <span className="text-[#F97316]">const</span>{' '}
            <span className="text-white">diff</span>{' '}
            <span className="text-[#CBD5E1]">= target - nums[i];</span>
            {'\n    '}
            <span className="text-[#F97316]">if</span>{' '}
            <span className="text-[#CBD5E1]">(seen.has(diff))</span>
            {'\n      '}
            <span className="text-[#F97316]">return</span>{' '}
            <span className="text-[#CBD5E1]">[seen.get(diff), i];</span>
            {'\n    '}
            <span className="text-white">seen.set</span>
            <span className="text-[#CBD5E1]">(nums[i], i);</span>
            {'\n  '}
            <span className="text-[#CBD5E1]">{'}'}</span>
            {'\n'}
            <span className="text-[#CBD5E1]">{'}'}</span>
          </code>
        </pre>

        {/* Tests column (40%) */}
        <div className="col-span-2 border-l border-white/10 bg-[#0F172A] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
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
                      ? 'bg-[#22C55E]/10 text-[#22C55E]'
                      : 'text-[#94A3B8]'
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
            <div className="mt-4 rounded-md bg-[#22C55E]/15 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#22C55E]">
                Accepted
              </p>
              <p className="mt-0.5 text-[10px] text-[#94A3B8]">
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