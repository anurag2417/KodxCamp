import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Loader2, Send } from 'lucide-react';
import type { AnnouncementAudience } from '@/features/announcements/api';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/lib/utils';

interface PickOption {
  id: string;
  label: string;
}

interface Props {
  /**
   * Selectable targets for each audience kind. The parent decides
   * what the caller is allowed to target — this component just
   * renders what it's given.
   *
   * An empty array for a kind means the caller has nothing to
   * target there, and the kind is not offered as a choice.
   */
  courses: PickOption[];
  cohorts: PickOption[];
  roadmaps: PickOption[];
  classes: PickOption[];
  /**
   * Whether the caller is allowed to post `all`-scoped
   * announcements. Admins and instructors both can today, but this
   * is a prop so the rule can tighten later without changing the
   * composer.
   */
  canPostGlobal?: boolean;
  busy: boolean;
  onSubmit: (input: {
    title: string;
    body: string;
    audience: AnnouncementAudience;
  }) => Promise<void>;
}

type AudienceChoice =
  | 'all'
  | 'course'
  | 'cohort'
  | 'roadmap'
  | 'class';

export const AnnouncementComposer: React.FC<Props> = ({
  courses,
  cohorts,
  roadmaps,
  classes,
  canPostGlobal = true,
  busy,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceChoice, setAudienceChoice] =
    useState<AudienceChoice>('course');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');

  /**
   * Which audience kinds have anything to pick from. `all` is always
   * available when the caller can post globally; the others only
   * appear when their option list is non-empty.
   */
  const availableChoices = useMemo(() => {
    const choices: { value: AudienceChoice; label: string }[] = [];
    if (canPostGlobal) choices.push({ value: 'all', label: 'Everyone' });
    if (courses.length > 0)
      choices.push({ value: 'course', label: 'Course' });
    if (cohorts.length > 0)
      choices.push({ value: 'cohort', label: 'Cohort' });
    if (roadmaps.length > 0)
      choices.push({ value: 'roadmap', label: 'Roadmap' });
    if (classes.length > 0)
      choices.push({ value: 'class', label: 'Class' });
    return choices;
  }, [canPostGlobal, courses.length, cohorts.length, roadmaps.length, classes.length]);

  /**
   * When the choice changes, reset the target. A `course` id is
   * meaningless in the `cohort` context. Also default the choice if
   * the current one is no longer available.
   */
  useEffect(() => {
    if (availableChoices.length === 0) return;
    if (!availableChoices.some((c) => c.value === audienceChoice)) {
      setAudienceChoice(availableChoices[0].value);
    }
    setTargetId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceChoice, availableChoices.length]);

  const targetOptions: PickOption[] = useMemo(() => {
    switch (audienceChoice) {
      case 'all':
        return [];
      case 'course':
        return courses;
      case 'cohort':
        return cohorts;
      case 'roadmap':
        return roadmaps;
      case 'class':
        return classes;
    }
  }, [audienceChoice, courses, cohorts, roadmaps, classes]);

  const handleSubmit = async () => {
    setError('');
    if (title.trim().length < 2) {
      setError('Title is required');
      return;
    }
    if (body.trim().length < 1) {
      setError('Message body is required');
      return;
    }
    if (audienceChoice !== 'all' && !targetId) {
      setError('Pick a target for this announcement');
      return;
    }

    const audience: AnnouncementAudience =
      audienceChoice === 'all'
        ? { kind: 'all' }
        : { kind: audienceChoice, id: targetId };

    await onSubmit({
      title: title.trim(),
      body: body.trim(),
      audience,
    });

    setTitle('');
    setBody('');
    setTargetId('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Megaphone size={16} className="text-brand-500" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
          Post an announcement
        </h2>
      </div>

      {/* Audience selector */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">
          Audience
        </label>
        <div className="flex flex-wrap gap-2">
          {availableChoices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => setAudienceChoice(choice.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                audienceChoice === choice.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              )}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target selector — hidden for 'all' */}
      {audienceChoice !== 'all' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">
            {audienceChoice === 'course'
              ? 'Course'
              : audienceChoice === 'cohort'
                ? 'Cohort'
                : audienceChoice === 'roadmap'
                  ? 'Roadmap'
                  : 'Class'}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand-500 focus:outline-none"
          >
            <option value="">— Select —</option>
            {targetOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />

      <textarea
        placeholder="What do you want to say?"
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={10_000}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none"
      />

      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Posting…
            </>
          ) : (
            <>
              <Send size={14} /> Post announcement
            </>
          )}
        </Button>
      </div>
    </div>
  );
};