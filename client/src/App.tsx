import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/Toast';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Lesson } from './pages/Lesson';
import { Playground } from './pages/Playground';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Practice } from './pages/Practice';
import { ProblemDetail } from './pages/ProblemDetail';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { MyProjects } from './pages/MyProjects';
import { Classes } from './pages/Classes';
import { ClassDetail } from './pages/ClassDetail';
import { MyRecordings } from './pages/MyRecordings';
import { Progress } from './pages/Progress';
import { Achievements } from './pages/Achievements';
import { Streak } from './pages/Streak';
import { NotFound } from './pages/NotFound';

import { AdminGuard } from './components/admin/AdminGuard';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminProjects } from './pages/admin/AdminProjects';
import { AdminClasses } from './pages/admin/AdminClasses';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminBulkImport } from './pages/admin/AdminBulkImport';


import { useThemeStore } from './store/theme.store';
import { useAuthStore } from './store/auth.store';
import { Spinner } from './components/ui/Spinner';

/**
 * Route guard for pages that require a logged-in user.
 * Waits for auth bootstrap to settle before deciding.
 */
const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const initTheme = useThemeStore((s) => s.init);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    initTheme();
    fetchMe();
  }, [initTheme, fetchMe]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public standalone */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public marketing + catalog (AppLayout) */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route path="practice" element={<Practice />} />
            <Route path="playground" element={<Playground />} />
            <Route path="projects" element={<Projects />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:slug" element={<ClassDetail />} />
            <Route
              path="courses/:courseSlug/lessons/:lessonSlug"
              element={<Lesson />}
            />
            <Route path="practice/:slug" element={<ProblemDetail />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />

            {/* Authenticated pages */}
            <Route
              path="dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="progress"
              element={
                <RequireAuth>
                  <Progress />
                </RequireAuth>
              }
            />
            <Route
              path="achievements"
              element={
                <RequireAuth>
                  <Achievements />
                </RequireAuth>
              }
            />
            <Route
              path="streak"
              element={
                <RequireAuth>
                  <Streak />
                </RequireAuth>
              }
            />
            <Route
              path="projects/mine"
              element={
                <RequireAuth>
                  <MyProjects />
                </RequireAuth>
              }
            />
            <Route
              path="classes/mine"
              element={
                <RequireAuth>
                  <MyRecordings />
                </RequireAuth>
              }
            />

            {/* Admin */}
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:slug" element={<AdminCourseEdit />} />
              <Route path="problems" element={<AdminProblems />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="classes" element={<AdminClasses />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bulk-import" element={<AdminBulkImport />} />
            </Route>

            {/* 404 inside layout */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}