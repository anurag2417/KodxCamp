import { useState } from 'react';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { LessonListItem } from '@/features/courses/components/LessonListItem';
import type { ApiLessonSummary } from '@/features/courses/api';

interface Props {
  courseSlug: string;
  lessons: ApiLessonSummary[] | undefined;
  completedLessons: string[];
  currentLessonId: string;
}

export const LessonSidebar: React.FC<Props> = ({
  courseSlug,
  lessons,
  completedLessons,
  currentLessonId,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Defensive: the sidebar renders on the very first frame of a route
  // change, before the lesson query has resolved. `lessons` is
  // legitimately `undefined` at that point.
  const safeLessons = lessons ?? [];

  return (
    <aside
      className={`hidden shrink-0 overflow-y-auto border-r border-border bg-surface-secondary transition-[width] duration-200 lg:block ${collapsed ? 'w-14' : 'w-72'}`}
    >
      <div className={collapsed ? 'p-2' : 'p-5'}>
        <div className={`mb-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <p className="text-xs font-semibold tracking-widest text-text-muted">
              LESSONS
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            title={collapsed ? 'Expand lessons' : 'Collapse lessons'}
            aria-label={collapsed ? 'Expand lessons' : 'Collapse lessons'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        {collapsed ? (
          <div className="flex justify-center text-text-muted">
            <List size={18} />
          </div>
        ) : safeLessons.length === 0 ? (
          <p className="text-xs text-text-muted">No lessons yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {safeLessons.map((l) => (
              <LessonListItem
                key={l._id}
                courseSlug={courseSlug}
                lesson={l}
                isCompleted={completedLessons.includes(l._id)}
                isActive={l._id === currentLessonId}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};