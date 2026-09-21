import { LessonListItem } from '@/features/courses/components/LessonListItem';
import type { ApiLessonSummary } from '@/features/courses/api';

interface Props {
  courseSlug: string;
  lessons: ApiLessonSummary[];
  completedLessons: string[];
  currentLessonId: string;
}

export const LessonSidebar: React.FC<Props> = ({
  courseSlug,
  lessons,
  completedLessons,
  currentLessonId,
}) => (
  <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-surface-secondary lg:block">
    <div className="p-5">
      <p className="mb-3 text-xs font-semibold tracking-widest text-text-muted">
        LESSONS
      </p>
      <div className="flex flex-col gap-1">
        {lessons.map((l) => (
          <LessonListItem
            key={l._id}
            courseSlug={courseSlug}
            lesson={l}
            isCompleted={completedLessons.includes(l._id)}
            isActive={l._id === currentLessonId}
          />
        ))}
      </div>
    </div>
  </aside>
);
