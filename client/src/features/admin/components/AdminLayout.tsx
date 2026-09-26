import { Outlet } from 'react-router-dom';

/**
 * Compatibility shim.
 *
 * Before Batch 1, `AdminLayout` rendered a horizontal tab bar for the
 * admin section (Overview, Courses, Problems, ...). That bar is now
 * redundant: the staff sidebar in `StaffLayout` provides the same
 * navigation, and stacking two section switchers on top of each other
 * was one of the things the Master Spec explicitly warned against
 * ("do not overload the dashboard with dozens of metrics" extends to
 * navigation chrome).
 *
 * This component now renders only the `<Outlet />`. It is kept in the
 * codebase so the router can continue to nest admin pages under
 * `<AdminLayout>` — a future batch will remove it entirely once the
 * router mounts admin pages directly under `StaffLayout`.
 */
export const AdminLayout: React.FC = () => <Outlet />;