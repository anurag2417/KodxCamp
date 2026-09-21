import { Navigate, useParams } from 'react-router-dom';

/**
 * Legacy route: /admin/courses/:slug
 *
 * The course editor now lives under /instructor/courses/:slug so that
 * instructors (and admins) share the same experience with permission-driven
 * UI. This component redirects old links to the new location.
 */
export const AdminCourseEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/instructor" replace />;
  return <Navigate to={`/instructor/courses/${slug}`} replace />;
};

export default AdminCourseEdit;