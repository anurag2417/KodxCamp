import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface Props {
  /**
   * Which sidebar to render. Determines the section list.
   * Admin routes render the admin sidebar; instructor routes render
   * the instructor sidebar. A user who is both will see the admin
   * sidebar on /admin/* and the instructor sidebar on /instructor/*.
   */
  role: 'instructor' | 'admin';
}

/**
 * Shell for staff routes (instructor and admin).
 *
 * Master Spec: staff get a permanent sidebar because they're doing
 * operational work, not immersive learning. The Navbar stays at the
 * top so staff can navigate back to the student surface in one click.
 *
 * Layout: Navbar (sticky, full width) → [Sidebar | Outlet].
 *
 * Full-bleed: the shell spans 100% of the viewport. The Sidebar has a
 * fixed width (256px) by design — it's a staff affordance from the
 * spec, not content that should stretch. The `<main>` column fills the
 * remaining space with no max-width cap, so admin tables and instructor
 * dashboards render edge-to-edge.
 *
 * The `items-start` on the flex row is required for the sticky
 * sidebar to have room to stick — flex items default to stretch, and
 * a stretched sticky child has no room to move.
 */
export const StaffLayout: React.FC<Props> = ({ role }) => (
  <div className="flex min-h-screen w-full flex-col bg-bg">
    <Navbar />
    <div className="flex w-full flex-1 items-start">
      <Sidebar role={role} />
      <main className="min-w-0 w-full flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);