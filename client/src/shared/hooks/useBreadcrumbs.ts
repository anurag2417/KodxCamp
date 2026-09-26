import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { Breadcrumb } from '@/shared/components/nav/Breadcrumbs';

/**
 * Route metadata registry.
 *
 * Each entry maps a URL pattern to a function that produces a crumb.
 * The `params` argument is whatever `useParams()` returned.
 *
 * The registry is small on purpose. Crumbs are the *location hint*,
 * not a second navigation menu — an entry only exists when a route
 * has a natural hierarchy (My Learning > Full Stack > JavaScript >
 * Arrays). Routes without hierarchy (e.g. `/practice`) get a single-
 * crumb trail that is effectively a title.
 *
 * NOTE: the actual course/lesson names for the middle crumbs
 * (`JavaScript`, `Arrays`) come from `location.state` when the caller
 * passes them, or fall back to the slug if not. This keeps the hook
 * synchronous and free of data fetching — it's a display concern, not
 * a data concern.
 *
 * ROUTER COMPATIBILITY NOTE: this hook does NOT use `useMatches()`.
 * That hook is a React Router v6.4+ data-router API and throws
 * outside a `createBrowserRouter` context. The app uses the classic
 * `<BrowserRouter>`, so we work purely off `location.pathname` and
 * `location.state`. If the app is ever migrated to a data router,
 * this hook can be revisited — but do not reintroduce `useMatches()`
 * until then.
 */
type CrumbBuilder = (ctx: {
  params: Record<string, string | undefined>;
  state: unknown;
}) => Breadcrumb[];

interface RouteMatchState {
  courseName?: string;
  lessonName?: string;
  lessonCourseName?: string;
  lessonCourseSlug?: string;
  problemTitle?: string;
  projectTitle?: string;
  classTitle?: string;
}

const ROUTES: Array<{ pattern: RegExp; build: CrumbBuilder }> = [
  // ─── Top-level ─────────────────────────────────────────
  {
    pattern: /^\/my-learning\/?$/,
    build: () => [{ label: 'My Learning' }],
  },
  {
    pattern: /^\/dashboard\/?$/,
    build: () => [{ label: 'Dashboard' }],
  },
  {
    pattern: /^\/roadmaps\/?$/,
    build: () => [{ label: 'Roadmaps' }],
  },
  {
    pattern: /^\/courses\/?$/,
    build: () => [{ label: 'Courses' }],
  },
  {
    pattern: /^\/practice\/?$/,
    build: () => [{ label: 'Practice' }],
  },
  {
    pattern: /^\/playground\/?$/,
    build: () => [{ label: 'Compiler' }],
  },
  {
    pattern: /^\/projects\/?$/,
    build: () => [{ label: 'Projects' }],
  },
  {
    pattern: /^\/projects\/mine\/?$/,
    build: () => [
      { label: 'Projects', to: '/projects' },
      { label: 'My Projects' },
    ],
  },
  {
    pattern: /^\/classes\/?$/,
    build: () => [{ label: 'Live Classes' }],
  },
  {
    pattern: /^\/classes\/mine\/?$/,
    build: () => [
      { label: 'Live Classes', to: '/classes' },
      { label: 'Catch Up' },
    ],
  },
  {
    pattern: /^\/progress\/?$/,
    build: () => [{ label: 'Progress' }],
  },
  {
    pattern: /^\/achievements\/?$/,
    build: () => [{ label: 'Achievements' }],
  },
  {
    pattern: /^\/streak\/?$/,
    build: () => [{ label: 'Streak' }],
  },
  {
    pattern: /^\/notifications\/?$/,
    build: () => [{ label: 'Notifications' }],
  },

  // ─── Courses ────────────────────────────────────────────
  {
    pattern: /^\/courses\/([^/]+)\/?$/,
    build: ({ params, state }) => {
      const s = state as RouteMatchState | null;
      return [
        { label: 'Courses', to: '/courses' },
        { label: s?.courseName ?? titleFromSlug(params.slug) },
      ];
    },
  },
  {
    pattern: /^\/courses\/([^/]+)\/lessons\/([^/]+)\/?$/,
    build: ({ params, state }) => {
      const s = state as RouteMatchState | null;
      const courseName =
        s?.lessonCourseName ?? titleFromSlug(params.courseSlug);
      const lessonName = s?.lessonName ?? titleFromSlug(params.lessonSlug);
      return [
        { label: 'Courses', to: '/courses' },
        { label: courseName, to: `/courses/${params.courseSlug}` },
        { label: lessonName },
      ];
    },
  },

  // ─── Roadmaps ───────────────────────────────────────────
  {
    pattern: /^\/roadmaps\/([^/]+)\/?$/,
    build: ({ params }) => [
      { label: 'Roadmaps', to: '/roadmaps' },
      { label: titleFromSlug(params.slug) },
    ],
  },

  // ─── Practice ───────────────────────────────────────────
  {
    pattern: /^\/practice\/([^/]+)\/?$/,
    build: ({ params, state }) => {
      const s = state as RouteMatchState | null;
      return [
        { label: 'Practice', to: '/practice' },
        { label: s?.problemTitle ?? titleFromSlug(params.slug) },
      ];
    },
  },

  // ─── Projects ───────────────────────────────────────────
  {
    pattern: /^\/projects\/([^/]+)\/?$/,
    build: ({ params, state }) => {
      const s = state as RouteMatchState | null;
      return [
        { label: 'Projects', to: '/projects' },
        { label: s?.projectTitle ?? titleFromSlug(params.slug) },
      ];
    },
  },

  // ─── Classes ────────────────────────────────────────────
  {
    pattern: /^\/classes\/([^/]+)\/?$/,
    build: ({ params, state }) => {
      const s = state as RouteMatchState | null;
      return [
        { label: 'Live Classes', to: '/classes' },
        { label: s?.classTitle ?? titleFromSlug(params.slug) },
      ];
    },
  },
];

function titleFromSlug(slug: string | undefined): string {
  if (!slug) return 'Untitled';
  return slug
    .split('-')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Reads the current location and returns the breadcrumb trail for it.
 *
 * Prefers `location.state` for human-readable names (a component that
 * navigates to a lesson can pass `{ state: { lessonName: 'Arrays' } }`),
 * and falls back to slug-derived titles so the trail is never empty.
 *
 * The hook itself does not fetch anything. It is synchronous and
 * memoized on the pathname.
 */
export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();
  const params = useParams();

  return useMemo(() => {
    const match = ROUTES.find((r) => r.pattern.test(location.pathname));
    if (!match) return [];
    return match.build({
      params: params as Record<string, string | undefined>,
      state: location.state,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.state]);
}