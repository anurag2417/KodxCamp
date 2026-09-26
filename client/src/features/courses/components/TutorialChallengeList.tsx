import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { ITutorialChallenge } from '@kodxcamp/shared';
import { TutorialChallengeView } from './TutorialChallenge';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';
import { progressApi, type ApiProgress } from '@/features/progress/api';
import { useToast } from '@/shared/hooks/useToast';
import { readStoredValue, writeStoredValue } from '@/shared/lib/storage';

interface Props {
  courseId: string;
  lessonId: string;
  challenges: ITutorialChallenge[];
  /**
   * Progress for this course. The parent passes what it already
   * fetched; this component never fetches progress on its own.
   */
  progress: ApiProgress | null;
  /**
   * Called when progress is written so the parent can update its
   * copy and any other consumers.
   */
  onProgressChange: (progress: ApiProgress) => void;
}

/**
 * The tutorial-challenge strip.
 *
 * Renders a horizontal strip of challenge buttons at the top of the
 * lesson's editor area, and below it the currently active challenge.
 *
 * Per-challenge code drafts are stored in `localStorage` keyed by
 * (userId, lessonId, challengeIndex) so a student can move between
 * challenges without losing work in each. This mirrors the pattern
 * used by the lesson editor itself.
 *
 * Passing a challenge's checks triggers `markChallengeComplete` on
 * the server (when signed in). The server enforces the same
 * sequencing the strip shows — a challenge cannot be completed until
 * every previous one is.
 */
export const TutorialChallengeList: React.FC<Props> = ({
  courseId,
  lessonId,
  challenges,
  progress,
  onProgressChange,
}) => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const initializedRef = useRef(false);

  const completedSet = useMemo(() => {
    const list = progress?.completedChallenges?.[lessonId] ?? [];
    return new Set(list);
  }, [progress?.completedChallenges, lessonId]);

  /**
   * The highest index the student can currently access. Always the
   * first challenge, or the first not-yet-completed challenge, or the
   * last challenge if all are done.
   */
  const unlockedUpTo = useMemo(() => {
    for (let i = 0; i < challenges.length; i++) {
      if (!completedSet.has(i)) return i;
    }
    return challenges.length - 1;
  }, [challenges.length, completedSet]);

  /**
   * Set the initial active challenge to the first incomplete one. Run
   * only once per lesson so the student's manual selection sticks.
   */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setActiveIndex(unlockedUpTo);
  }, [unlockedUpTo]);

  // Reset when the lesson changes.
  useEffect(() => {
    initializedRef.current = false;
    setActiveIndex(0);
  }, [lessonId]);

  /**
   * Per-challenge code drafts. Loaded lazily when a challenge is
   * activated for the first time. The parent doesn't need to know
   * about these.
   */
  const storageKey = `tutorial:${user?._id ?? 'guest'}:${lessonId}`;

  const initialCodes = useMemo(() => {
    const stored = readStoredValue<Record<number, string>>(storageKey);
    return stored ?? {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const [codes, setCodes] = useState<Record<number, string>>(initialCodes);

  // Ensure every challenge has a code entry (either the stored draft,
  // or the challenge's starter code, whichever is newer).
  useEffect(() => {
    setCodes((current) => {
      let changed = false;
      const next = { ...current };
      challenges.forEach((c, i) => {
        if (next[i] === undefined) {
          next[i] = c.starterCode ?? '';
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [challenges]);

  // Persist codes to localStorage on change.
  useEffect(() => {
    writeStoredValue(storageKey, codes);
  }, [codes, storageKey]);

  const handleCodeChange = (index: number, code: string): void => {
    setCodes((current) => ({ ...current, [index]: code }));
  };

  const handlePass = async (index: number): Promise<void> => {
    if (!user) return;
    if (completedSet.has(index)) return;

    try {
      const updated = await progressApi.markChallengeComplete(
        courseId,
        lessonId,
        index
      );
      onProgressChange(updated);
      // Auto-advance to the next challenge.
      if (index + 1 < challenges.length) {
        setActiveIndex(index + 1);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save your progress'
      );
    }
  };

  if (challenges.length === 0) return null;

  const currentChallenge = challenges[activeIndex];
  const currentCode = codes[activeIndex] ?? currentChallenge.starterCode ?? '';
  const currentCompleted = completedSet.has(activeIndex);
  const currentLocked = activeIndex > unlockedUpTo;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Strip */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-surface-secondary px-3 py-2">
        {challenges.map((c, i) => {
          const done = completedSet.has(i);
          const locked = i > unlockedUpTo;
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => setActiveIndex(i)}
              title={c.title}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-brand-500 text-white'
                  : done
                    ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/15'
                    : locked
                      ? 'cursor-not-allowed bg-surface text-text-muted opacity-60'
                      : 'text-text-muted hover:bg-surface-tertiary'
              )}
            >
              {done ? (
                <CheckCircle2 size={11} />
              ) : locked ? (
                <Lock size={11} />
              ) : null}
              <span>{i + 1}</span>
              <span className="hidden max-w-[120px] truncate md:inline">
                {c.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active challenge */}
      <div className="min-h-0 flex-1">
        <TutorialChallengeView
          challenge={currentChallenge}
          index={activeIndex}
          total={challenges.length}
          code={currentCode}
          onCodeChange={(code: string) => handleCodeChange(activeIndex, code)}
          completed={currentCompleted}
          active={!currentLocked}
          locked={currentLocked}
          isAnonymous={!user}
          onPass={() => void handlePass(activeIndex)}
        />
      </div>
    </div>
  );
};