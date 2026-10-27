import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { ITutorialChallenge } from '@kodxcamp/shared';
import { TutorialChallengeView } from './TutorialChallenge';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/store/auth.store';
import {
  progressApi,
  type ApiActivityProgress,
} from '@/features/progress/api';
import { useToast } from '@/shared/hooks/useToast';
import { readStoredValue, writeStoredValue } from '@/shared/lib/storage';

interface Props {
  courseId: string;
  curriculumItemId: string;
  challenges: ITutorialChallenge[];
  progress: ApiActivityProgress | null;
  onProgressChange: (progress: ApiActivityProgress) => void;
}

export const TutorialChallengeList: React.FC<Props> = ({
  courseId,
  curriculumItemId,
  challenges,
  progress,
  onProgressChange,
}) => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const initializedRef = useRef(false);

  const completedSet = useMemo(
    () => new Set(progress?.completedChallengeIndexes ?? []),
    [progress?.completedChallengeIndexes]
  );

  const unlockedUpTo = useMemo(() => {
    for (let i = 0; i < challenges.length; i++) {
      if (!completedSet.has(i)) return i;
    }

    return challenges.length - 1;
  }, [challenges.length, completedSet]);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;
    setActiveIndex(Math.max(0, unlockedUpTo));
  }, [unlockedUpTo]);

  useEffect(() => {
    initializedRef.current = false;
    setActiveIndex(0);
  }, [curriculumItemId]);

  const storageKey = `tutorial:${user?._id ?? 'guest'}:${curriculumItemId}`;

  const initialCodes = useMemo(() => {
    const stored = readStoredValue<Record<number, string>>(storageKey);
    return stored ?? {};
  }, [storageKey]);

  const [codes, setCodes] =
    useState<Record<number, string>>(initialCodes);

  useEffect(() => {
    setCodes((current) => {
      let changed = false;
      const next = { ...current };

      for (let i = 0; i < challenges.length; i++) {
        const challenge = challenges[i];

        if (next[i] === undefined) {
          next[i] = challenge.starterCode ?? '';
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [challenges]);

  useEffect(() => {
    writeStoredValue(storageKey, codes);
  }, [codes, storageKey]);

  const handleCodeChange = (
    index: number,
    code: string
  ): void => {
    setCodes((current) => ({
      ...current,
      [index]: code,
    }));
  };

  const handlePass = async (
    index: number
  ): Promise<void> => {
    if (!user) return;
    if (completedSet.has(index)) return;

    try {
      const updated =
        await progressApi.markActivityChallengeComplete({
          courseId,
          curriculumItemId,
          challengeIndex: index,
        });

      onProgressChange(updated);

      if (index + 1 < challenges.length) {
        setActiveIndex(index + 1);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Could not save your progress'
      );
    }
  };

  if (challenges.length === 0) return null;

  const currentChallenge = challenges[activeIndex];
  const currentCode =
    codes[activeIndex] ??
    currentChallenge.starterCode ??
    '';

  const currentCompleted =
    completedSet.has(activeIndex);

  const currentLocked =
    activeIndex > unlockedUpTo;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-surface-secondary px-3 py-2">
        {challenges.map((challenge, index) => {
          const done = completedSet.has(index);
          const locked = index > unlockedUpTo;
          const isActive = index === activeIndex;

          return (
            <button
              key={index}
              type="button"
              disabled={locked}
              onClick={() => setActiveIndex(index)}
              title={challenge.title}
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

              <span>{index + 1}</span>

              <span className="hidden max-w-[120px] truncate md:inline">
                {challenge.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <TutorialChallengeView
          challenge={currentChallenge}
          index={activeIndex}
          total={challenges.length}
          code={currentCode}
          onCodeChange={(code: string) =>
            handleCodeChange(activeIndex, code)
          }
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
