/**
 * Centralized query keys.
 *
 * Pattern: ['domain', 'action', ...params]
 * Invalidate a whole domain with `invalidateQueries({ queryKey: ['courses'] })`.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  courses: {
    all: ['courses'] as const,
    detail: (slug: string) => ['courses', slug] as const,
    lesson: (courseSlug: string, lessonSlug: string) =>
      ['courses', courseSlug, 'lessons', lessonSlug] as const,
  },
  problems: {
    all: ['problems'] as const,
    detail: (slug: string) => ['problems', slug] as const,
    submissions: (problemId: string) =>
      ['problems', problemId, 'submissions'] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (slug: string) => ['projects', slug] as const,
    mine: ['projects', 'mine'] as const,
  },
  classes: {
    all: (scope: string) => ['classes', scope] as const,
    detail: (slug: string) => ['classes', slug] as const,
    recordings: ['classes', 'mine', 'recordings'] as const,
  },
  progress: {
    overview: ['progress', 'overview'] as const,
    course: (courseId: string) => ['progress', 'course', courseId] as const,
    perCourse: ['progress', 'per-course'] as const,
    difficulty: ['progress', 'difficulty'] as const,
    weekly: (weeks: number) => ['progress', 'weekly', weeks] as const,
    heatmap: (days: number) => ['progress', 'heatmap', days] as const,
    activity: ['progress', 'activity'] as const,
  },
  achievements: {
    all: ['achievements'] as const,
    mine: ['achievements', 'mine'] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    users: (params: Record<string, unknown>) => ['admin', 'users', params] as const,
    courses: ['admin', 'courses'] as const,
    courseFull: (slug: string) => ['admin', 'courses', slug] as const,
    problems: ['admin', 'problems'] as const,
    problemFull: (slug: string) => ['admin', 'problems', slug] as const,
    projects: ['admin', 'projects'] as const,
    projectFull: (slug: string) => ['admin', 'projects', slug] as const,
    classes: ['admin', 'classes'] as const,
  },
};
