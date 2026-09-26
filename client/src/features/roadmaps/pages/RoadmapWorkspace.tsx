import { Navigate, Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Rocket,
  Terminal,
  Video,
  LayoutDashboard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useRoadmap } from '@/features/roadmaps/hooks/useRoadmap';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Card } from '@/shared/components/ui/Card';
import { Tabs, type TabItem } from '@/shared/components/nav/Tabs';
import { useAuthStore } from '@/shared/store/auth.store';

/**
 * Enrolled roadmap workspace.
 *
 * Master Spec, section 14 — Roadmap Workspace:
 *   "When a student enters a roadmap, show: My Learning > [Title]
 *    Overview | Learning | Projects | Playground | Live Classes.
 *    There is no sidebar."
 *
 * Routing shape:
 *   /roadmaps/:slug               → redirects to .../overview
 *   /roadmaps/:slug/overview      → this tab
 *   /roadmaps/:slug/learning      → course list with completion
 *   /roadmaps/:slug/projects      → projects associated with the roadmap
 *   /roadmaps/:slug/playground    → shortcut to the Playground
 *   /roadmaps/:slug/live-classes  → upcoming + recorded classes
 *
 * The workspace does not have a sidebar. All navigation happens
 * through the top Navbar and the local `Tabs` bar. The `Tabs` bar
 * uses the `pill` variant because this is workspace-level chrome, not
 * in-content chrome (see Tabs.tsx).
 *
 * The tab param `overview | learning | projects | playground | live-classes`
 * is validated against the known set. An unknown tab (or the base
 * path) redirects to `overview`.
 */
type WorkspaceTab =
  | 'overview'
  | 'learning'
  | 'projects'
  | 'playground'
  | 'live-classes';

const KNOWN_TABS: WorkspaceTab[] = [
  'overview',
  'learning',
  'projects',
  'playground',
  'live-classes',
];

export const RoadmapWorkspace: React.FC = () => {
  const { slug, tab } = useParams<{ slug: string; tab: string }>();
  const { roadmap, loading, error, reload } = useRoadmap(slug);
  const user = useAuthStore((s) => s.user);

  if (!tab || !KNOWN_TABS.includes(tab as WorkspaceTab)) {
    return <Navigate to={`/roadmaps/${slug}/overview`} replace />;
  }

  if (loading) {
    return (
      <div className="flex w-full justify-center py-32">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="w-full p-8">
        <p className="text-[var(--color-error)]">
          {error ?? 'Roadmap not found'}
        </p>
        <Link
          to="/roadmaps"
          className="mt-4 inline-block text-brand-500 hover:underline"
        >
          ← Back to roadmaps
        </Link>
      </div>
    );
  }

  const activeTab = tab as WorkspaceTab;

  const tabs: TabItem[] = [
    { to: `/roadmaps/${roadmap.slug}/overview`, label: 'Overview' },
    { to: `/roadmaps/${roadmap.slug}/learning`, label: 'Learning' },
    { to: `/roadmaps/${roadmap.slug}/projects`, label: 'Projects' },
    { to: `/roadmaps/${roadmap.slug}/playground`, label: 'Playground' },
    {
      to: `/roadmaps/${roadmap.slug}/live-classes`,
      label: 'Live Classes',
    },
  ];

  return (
    <div className="w-full">
      {/* Workspace header */}
      <div className="w-full border-b border-border bg-bg">
        <div className="w-full px-4 pt-6 md:px-6 lg:px-10">
          <Link
            to="/my-learning"
            className="inline-flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-brand-500"
          >
            <ArrowLeft size={14} /> My Learning
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                {roadmap.title}
              </h1>
              {roadmap.tagline && (
                <p className="mt-1 text-sm text-text-muted">
                  {roadmap.tagline}
                </p>
              )}
            </div>

            {/* Progress pill — placeholder number until Progress model
                knows about roadmaps. Shows enriched course count for now. */}
            <div className="shrink-0 rounded-2xl border border-border bg-surface px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Roadmap
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {roadmap.enrichedCourses.length}{' '}
                {roadmap.enrichedCourses.length === 1 ? 'course' : 'courses'}
              </p>
            </div>
          </div>
        </div>

        {/* Local tabs — pill variant */}
        <div className="w-full px-4 pt-6 md:px-6 lg:px-10">
          <Tabs items={tabs} variant="pill" ariaLabel="Roadmap sections" />
        </div>
      </div>

      {/* Body */}
      <div className="w-full px-4 py-8 md:px-6 lg:px-10">
        {!user && (
          <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 text-sm text-[var(--color-warning)]">
            You are not signed in. Progress is not being tracked.{' '}
            <Link to="/login" className="underline">
              Sign in
            </Link>{' '}
            to save your work.
          </Card>
        )}

        {activeTab === 'overview' && <OverviewTab roadmap={roadmap} />}
        {activeTab === 'learning' && <LearningTab roadmap={roadmap} />}
        {activeTab === 'projects' && <ProjectsTab roadmap={roadmap} />}
        {activeTab === 'playground' && <PlaygroundTab />}
        {activeTab === 'live-classes' && <LiveClassesTab roadmap={roadmap} />}
      </div>
    </div>
  );
};

/* ─── Tabs ───────────────────────────────────────────────────────── */

import type { ApiRoadmapDetail } from '@/features/roadmaps/api';

const OverviewTab: React.FC<{ roadmap: ApiRoadmapDetail }> = ({ roadmap }) => {
  const firstCourse = roadmap.enrichedCourses[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Continue / Get started card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {roadmap.enrichedCourses.length > 0 ? 'Start learning' : 'Coming soon'}
        </h2>
        {firstCourse ? (
          <>
            <p className="mt-1 text-sm text-text-muted">
              Your first course is {firstCourse.title}.
            </p>
            <Link
              to={`/courses/${firstCourse.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <BookOpen size={16} /> Open {firstCourse.title}
            </Link>
          </>
        ) : (
          <p className="mt-1 text-sm text-text-muted">
            This roadmap doesn't have any courses yet. Check back soon.
          </p>
        )}
      </Card>

      {/* Structure preview */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Roadmap structure
        </h2>
        {roadmap.enrichedCourses.length === 0 ? (
          <p className="text-sm text-text-muted">
            No courses have been added yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {roadmap.enrichedCourses.map((c) => (
              <li
                key={c._id}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-500/10 font-mono text-xs font-bold text-brand-500">
                  {c.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {c.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                    {c.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {c.totalLessons}{' '}
                  {c.totalLessons === 1 ? 'lesson' : 'lessons'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Upcoming live class placeholder */}
      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          Upcoming live class
        </h2>
        <p className="text-sm text-text-muted">
          Live class scheduling for roadmaps lands with the cohort batch.
          For now, browse{' '}
          <Link to="/classes" className="text-brand-500 hover:underline">
            all live classes
          </Link>
          .
        </p>
      </Card>
    </div>
  );
};

const LearningTab: React.FC<{ roadmap: ApiRoadmapDetail }> = ({ roadmap }) => {
  if (roadmap.enrichedCourses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-text-muted">
          No courses have been added to this roadmap yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {roadmap.enrichedCourses.map((c) => (
        <Card key={c._id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 font-mono text-sm font-bold text-brand-500">
                {c.order}
              </span>
              <div className="min-w-0">
                <Link
                  to={`/courses/${c.slug}`}
                  className="text-base font-semibold text-text-primary hover:text-brand-500"
                >
                  {c.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                  {c.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  <span className="font-mono">{c.language}</span>
                  <span>
                    {c.totalLessons}{' '}
                    {c.totalLessons === 1 ? 'lesson' : 'lessons'}
                  </span>
                  {c.isRequired && (
                    <span className="inline-flex items-center gap-1 text-brand-500">
                      <CheckCircle2 size={11} /> Required
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              to={`/courses/${c.slug}`}
              className="shrink-0 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Open
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
};

const ProjectsTab: React.FC<{ roadmap: ApiRoadmapDetail }> = ({ roadmap }) => {
  if (!roadmap.projects || roadmap.projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Rocket size={28} className="mx-auto text-text-muted" />
        <p className="mt-3 text-sm text-text-muted">
          No projects have been attached to this roadmap yet.
        </p>
        <Link
          to="/projects"
          className="mt-4 inline-block text-sm text-brand-500 hover:underline"
        >
          Browse all projects →
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roadmap.projects.map((p, i) => (
        <Card key={i} className="overflow-hidden p-0">
          <div className="aspect-video bg-gradient-to-br from-brand-700/20 to-transparent">
            {p.image ? (
              <img
                src={p.image}
                alt={p.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <Rocket size={28} className="text-text-muted" />
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-text-primary">
              {p.title}
            </p>
            {p.subtitle && (
              <p className="mt-1 text-xs text-text-muted">{p.subtitle}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const PlaygroundTab: React.FC = () => (
  <Card className="p-8 text-center">
    <Terminal size={28} className="mx-auto text-text-muted" />
    <p className="mt-3 text-sm text-text-muted">
      Use the Compiler to experiment with code while you work through this
      roadmap.
    </p>
    <Link
      to="/playground"
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      <Terminal size={16} /> Open Compiler
    </Link>
  </Card>
);

const LiveClassesTab: React.FC<{ roadmap: ApiRoadmapDetail }> = () => (
  <Card className="p-8 text-center">
    <Video size={28} className="mx-auto text-text-muted" />
    <p className="mt-3 text-sm text-text-muted">
      Live class scheduling tied to roadmaps lands with the cohort batch.
    </p>
    <Link
      to="/classes"
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      <Video size={16} /> Browse all classes
    </Link>
  </Card>
);

/* ─── Unused icon prevention ────────────────────────────────────────
   `LayoutDashboard`, `Clock` are reserved for the cohort batch's
   progress + attendance UI on this page. Kept imported so they don't
   get flagged as "unused" by accident when the file grows. */
void LayoutDashboard;
void Clock;