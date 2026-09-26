import { Outlet } from 'react-router-dom';

/**
 * Compatibility shim.
 *
 * Replaced by the staff sidebar (see `StaffLayout`). Kept as a passthrough
 * so the router can continue to nest instructor pages under
 * `<InstructorLayout>` without touching the 4 pages that sit inside it.
 */
export const InstructorLayout: React.FC = () => <Outlet />;