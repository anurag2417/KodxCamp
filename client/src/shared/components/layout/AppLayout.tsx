import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Breadcrumbs } from '@/shared/components/nav/Breadcrumbs';
import { useBreadcrumbs } from '@/shared/hooks/useBreadcrumbs';
import { useIsMarketingRoute } from '../../hooks/useIsMarketingRoute';

/**
 * App shell for the student experience.
 *
 * Rules (Master Spec, section 30 — Final KodxCamp Student Architecture):
 *   - No permanent sidebar.
 *   - Top navigation + breadcrumbs + back buttons + contextual tabs.
 *   - The shell is a single column: Navbar, then a small breadcrumb
 *     rail, then the routed page. Pages that want contextual tabs
 *     render them inside themselves (they know their own hierarchy).
 *
 * Full-bleed: every wrapper is `w-full` and no inner container caps
 * its width. Pages own their own content padding. This matches the
 * spec's "full-width marketing and workspace" direction — the shell
 * never imposes a max-width on the route.
 *
 * The breadcrumb rail is hidden on the marketing landing page and on
 * full-bleed workspaces (Lesson, ProblemDetail, ProjectDetail,
 * Playground) where the page is a fixed-height split layout and a
 * breadcrumb bar would eat vertical space that belongs to the editor.
 */
const FULL_BLEED_PATHS = [
  /^\/courses\/[^/]+\/lessons\/[^/]+\/?$/, // Lesson
  /^\/practice\/[^/]+\/?$/,                // ProblemDetail
  /^\/projects\/[^/]+\/?$/,                // ProjectDetail
  /^\/playground\/?$/,                     // Playground (fixed-height)
];

function isFullBleed(pathname: string): boolean {
  return FULL_BLEED_PATHS.some((r) => r.test(pathname));
}

export const AppLayout: React.FC = () => {
  const isMarketing = useIsMarketingRoute();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const fullBleed = isFullBleed(location.pathname);

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg">
      <Navbar />

      <main className="flex w-full flex-1 flex-col">
        {!isMarketing && !fullBleed && breadcrumbs.length > 0 && (
          <div className="w-full border-b border-border bg-bg">
            {/*
              Full-bleed breadcrumb rail. No mx-auto, no max-w-*.
              The rail spans the viewport; only horizontal padding
              keeps the trail off the edges.
            */}
            <div className="w-full px-4 py-3 md:px-6">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};