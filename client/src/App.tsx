import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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

import { useThemeStore } from './store/theme.store';
import { useAuthStore } from './store/auth.store';

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
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetail />} />
            <Route path="courses/:courseSlug/lessons/:lessonSlug" element={<Lesson />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:slug" element={<ProblemDetail />} />
            <Route path="playground" element={<Playground />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/mine" element={<MyProjects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/mine" element={<MyRecordings />} />
            <Route path="classes/:slug" element={<ClassDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="progress" element={<Progress />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="streak" element={<Streak />} />

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
            </Route>

            {/* 404 fallback (inside layout so navbar/sidebar stay) */}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}