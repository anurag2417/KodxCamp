import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { LessonListItem } from '@/features/courses/components/LessonListItem';
import type {
  ApiLessonSummary,
  ApiCourseModule,
} from '@/features/courses/api';
import { cn } from '@/shared/lib/utils';

interface Props {
  courseSlug: string;
  lessons: ApiLessonSummary[] | undefined;
  modules: ApiCourseModule[] | undefined;
  completedLessons: string[];
  currentLessonId: string;
}

type ModuleState = 'completed' | 'in_progress' | 'not_started';

interface Group {
  /** Null means "ungrouped" — lessons whose moduleId is not set. */
  module: ApiCourseModule | null;
  lessons: ApiLessonSummary[];
  state: ModuleState;
}

function computeModuleState(
  lessons: ApiLessonSummary[],
  completedLessons: string[],
  currentLessonId: string
): ModuleState {
  if (lessons.length === 0) return 'not_started';

  const completed = new Set(completedLessons);
  const completedCount = lessons.filter((l) => completed.has(l._id)).length;
  const currentInModule = lessons.some((l) => l._id === currentLessonId);

  if (completedCount === lessons.length) return 'completed';
  if (completedCount > 0 || currentInModule) return 'in_progress';
  return 'not_started';
}

export const LessonSidebar: React.FC<Props> = ({
  courseSlug,
  lessons,
  modules,
  completedLessons,
  currentLessonId,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  /**
   * Per-module expansion state. `undefined` means "use the default
   * behavior for this module" (expanded if it's the current module or
   * not yet completed; collapsed if completed). Once the student
   * clicks, the explicit choice wins for the session.
   *
   * Master Spec: "Completed modules should not automatically
   * disappear or unexpectedly collapse. The student controls the
   * expansion."
   */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const safeLessons = lessons ?? [];
  const safeModules = modules ?? [];

  /**
   * Build the groups. Modules are rendered in order, followed by an
   * "Ungrouped" section (only if there are lessons in it).
   */
  const groups: Group[] = useMemo(() => {
    const completed = new Set(completedLessons);

    const byModule = new Map<string, ApiLessonSummary[]>();
    const ungrouped: ApiLessonSummary[] = [];

    for (const lesson of safeLessons) {
      if (lesson.moduleId) {
        const list = byModule.get(lesson.moduleId) ?? [];
        list.push(lesson);
        byModule.set(lesson.moduleId, list);
      } else {
        ungrouped.push(lesson);
      }
    }

    const result: Group[] = safeModules.map((m) => {
      const lessonList = (byModule.get(m._id) ?? []).sort(
        (a, b) => a.order - b.order
      );
      return {
        module: m,
        lessons: lessonList,
        state: computeModuleState(lessonList, completedLessons, currentLessonId),
      };
    });

    if (ungrouped.length > 0) {
      result.push({
        module: null,
        lessons: ungrouped.sort((a, b) => a.order - b.order),
        state: computeModuleState(
          ungrouped,
          completedLessons,
          currentLessonId
        ),
      });
    }

    return result;
  }, [safeModules, safeLessons, completedLessons, currentLessonId]);

  /**
   * Default expansion state for a module:
   *   - Always expanded if it contains the current lesson.
   *   - Always expanded if it's the first module and nothing is
   *     completed yet (so a fresh student sees something).
   *   - Otherwise collapsed by default.
   */
  const isExpanded = (group: Group, index: number): boolean => {
    const key = group.module?._id ?? '__ungrouped__';
    const explicit = expanded[key];
    if (explicit !== undefined) return explicit;

    const containsCurrent = group.lessons.some(
      (l) => l._id === currentLessonId
    );
    if (containsCurrent) return true;
    if (index === 0) return true;
    return false;
  };

  const toggleModule = (group: Group) => {
    const key = group.module?._id ?? '__ungrouped__';
    setExpanded((prev) => {
      const current = prev[key];
      const defaultOpen = group.lessons.some(
        (l) => l._id === currentLessonId
      );
      const effective = current ?? defaultOpen;
      return { ...prev, [key]: !effective };
    });
  };

  return (
    <aside
      className={cn(
        'hidden shrink-0 overflow-y-auto border-r border-border bg-surface-secondary transition-[width] duration-200 lg:block',
        collapsed ? 'w-14' : 'w-72'
      )}
    >
      <div className={collapsed ? 'p-2' : 'p-5'}>
        <div
          className={cn(
            'mb-3 flex items-center',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <p className="text-xs font-semibold tracking-widest text-text-muted">
              LESSONS
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
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
        ) : groups.length === 0 ? (
          <p className="text-xs text-text-muted">No lessons yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group, index) => {
              const open = isExpanded(group, index);
              const label = group.module?.title ?? 'Ungrouped';
              const stateLabel =
                group.state === 'completed'
                  ? 'Completed'
                  : group.state === 'in_progress'
                    ? 'In Progress'
                    : 'Not Started';

              return (
                <div key={group.module?._id ?? '__ungrouped__'}>
                  <button
                    type="button"
                    onClick={() => toggleModule(group)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-tertiary"
                    aria-expanded={open}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        size={12}
                        className={cn(
                          'shrink-0 text-text-muted transition-transform',
                          !open && '-rotate-90'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-text-primary">
                          {label}
                        </p>
                        <p
                          className={cn(
                            'mt-0.5 text-[10px] font-medium',
                            group.state === 'completed'
                              ? 'text-[var(--color-success)]'
                              : group.state === 'in_progress'
                                ? 'text-brand-500'
                                : 'text-text-muted'
                          )}
                        >
                          {stateLabel}
                        </p>
                      </div>
                    </div>
                    {group.state === 'completed' && (
                      <CheckCircle2
                        size={14}
                        className="shrink-0 text-[var(--color-success)]"
                      />
                    )}
                  </button>

                  {open && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {group.lessons.map((l) => (
                        <LessonListItem
                          key={l._id}
                          courseSlug={courseSlug}
                          lesson={l}
                          isCompleted={completedLessons.includes(l._id)}
                          isActive={l._id === currentLessonId}
                        />
                      ))}
                      {group.lessons.length === 0 && (
                        <p className="px-3 py-1 text-[11px] text-text-muted">
                          No lessons in this module yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};