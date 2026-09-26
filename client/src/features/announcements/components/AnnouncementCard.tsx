import { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp, Pin, Trash2 } from 'lucide-react';
import type { ApiAnnouncement } from '@/features/announcements/api';
import { Card } from '@/shared/components/ui/Card';
import { cn } from '@/shared/lib/utils';

interface Props {
  announcement: ApiAnnouncement;
  /**
   * When provided, a delete button appears. Only rendered for the
   * author or an admin.
   */
  onDelete?: (id: string) => void;
  /**
   * Long bodies start collapsed. The card shows the first ~200
   * characters and a "Show more" toggle.
   */
  collapseThreshold?: number;
}

const DEFAULT_COLLAPSE_THRESHOLD = 220;

/**
 * The audience label. Renders as "Everyone", "JavaScript course",
 * etc. — a human-readable hint that appears on the card so readers
 * know who the message was for.
 *
 * The label is intentionally terse. The full audience title (the
 * course name, the cohort name) is not available on the card — it
 * would need a second fetch, and the label is a glance-level hint,
 * not a navigation aid.
 */
function audienceLabel(a: ApiAnnouncement): string {
  switch (a.audienceKind) {
    case 'all':
      return 'Everyone';
    case 'roadmap':
      return 'Roadmap';
    case 'course':
      return 'Course';
    case 'cohort':
      return 'Cohort';
    case 'class':
      return 'Class';
  }
}

export const AnnouncementCard: React.FC<Props> = ({
  announcement,
  onDelete,
  collapseThreshold = DEFAULT_COLLAPSE_THRESHOLD,
}) => {
  const [expanded, setExpanded] = useState(false);

  const isPinned = Boolean(
    announcement.pinnedUntil &&
      new Date(announcement.pinnedUntil) > new Date(),
  );

  const shouldCollapse = announcement.body.length > collapseThreshold;
  const body =
    shouldCollapse && !expanded
      ? announcement.body.slice(0, collapseThreshold).trimEnd() + '…'
      : announcement.body;

  return (
    <Card
      className={cn(
        'p-5',
        isPinned && 'border-brand-500/40 bg-brand-500/5',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isPinned && (
            <Pin size={14} className="shrink-0 text-brand-500" />
          )}
          <Megaphone size={14} className="shrink-0 text-brand-500" />
          <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            {audienceLabel(announcement)}
          </span>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(announcement._id)}
            className="rounded p-1 text-text-muted transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
            title="Delete announcement"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <h3 className="text-base font-semibold text-text-primary">
        {announcement.title}
      </h3>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
        {body}
      </p>

      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} /> Show less
            </>
          ) : (
            <>
              <ChevronDown size={12} /> Show more
            </>
          )}
        </button>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-text-muted">
        {announcement.author?.avatar ? (
          <img
            src={announcement.author.avatar}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : null}
        <span className="font-medium">
          {announcement.author?.name ?? 'Instructor'}
        </span>
        <span>·</span>
        <span>{formatDate(announcement.publishedAt)}</span>
      </div>
    </Card>
  );
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}