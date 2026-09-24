import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { Spinner } from '@/shared/components/ui/Spinner';
import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminBulkImport } from '@/features/admin/pages/AdminBulkImport';
import { AdminClasses } from '@/features/admin/pages/AdminClasses';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { AdminProblems } from '@/features/admin/pages/AdminProblems';
import { AdminProjects } from '@/features/admin/pages/AdminProjects';
import { AdminUsers } from '@/features/admin/pages/AdminUsers';
import { Login } from '@/features/auth/pages/Login';
import { Signup } from '@/features/auth/pages/Signup';
import { VerifyOtp } from '@/features/auth/pages/VerifyOtp';
import { SetupAccount } from '@/features/auth/pages/SetupAccount';
import { ForgotPassword } from '@/features/auth/pages/ForgotPassword';
import { ResetPassword } from '@/features/auth/pages/ResetPassword';
import { AcceptInvitation } from '@/features/auth/pages/AcceptInvitation';
import { ClassDetail } from '@/features/classes/pages/ClassDetail';
import { Classes } from '@/features/classes/pages/Classes';
import { MyRecordings } from '@/features/classes/pages/MyRecordings';
import { CourseDetail } from '@/features/courses/pages/CourseDetail';
import { Courses } from '@/features/courses/pages/Courses';
import { Lesson } from '@/features/courses/pages/Lesson';
import { Dashboard } from '@/features/dashboard/pages/Dashboard';
import { InstructorGuard } from '@/features/instructor/components/InstructorGuard';
import { InstructorLayout } from '@/features/instructor/components/InstructorLayout';
import { InstructorStudents } from '@/features/instructor/pages/InstructorStudents';
import { InstructorStudentDetail } from '@/features/instructor/pages/InstructorStudentDetail';
import { InstructorCourses } from '@/features/instructor/components/InstructorCourses';
import { InstructorCourseEdit } from '@/features/instructor/components/InstructorCourseEdit';
import { InstructorCourseCreate } from '@/features/instructor/pages/InstructorCourseCreate';
import { Home } from '@/features/marketing/pages/Home';
import { Playground } from '@/features/playground/pages/Playground';
import { Practice } from '@/features/problems/pages/Practice';
import { ProblemDetail } from '@/features/problems/pages/ProblemDetail';
import { Achievements } from '@/features/progress/pages/Achievements';
import { Progress } from '@/features/progress/pages/Progress';
import { Streak } from '@/features/progress/pages/Streak';
import { MyProjects } from '@/features/projects/pages/MyProjects';
import { ProjectDetail } from '@/features/projects/pages/ProjectDetail';
import { Projects } from '@/features/projects/pages/Projects';
import { NotFound } from '@/app/pages/NotFound';
import { useAuthStore } from '@/shared/store/auth.store';

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const bootstrapped = useAuthStore((state) => state.bootstrapped);

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* ─── Auth ─────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/verify" element={<VerifyOtp />} />
        <Route path="/signup/setup" element={<SetupAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/invitations/:token"
          element={<AcceptInvitation />}
        />

        {/* Legacy route - redirects to the new signup flow. */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />

          {/* ─── Courses ───────────────────────────────────── */}
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route
            path="courses/:courseSlug/lessons/:lessonSlug"
            element={<Lesson />}
          />

          {/* ─── Practice ──────────────────────────────────── */}
          <Route path="practice" element={<Practice />} />
          <Route path="practice/:slug" element={<ProblemDetail />} />

          {/* ─── Playground ────────────────────────────────── */}
          <Route path="playground" element={<Playground />} />

          {/* ─── Projects ──────────────────────────────────── */}
          {/* "mine" must come before ":slug" - otherwise the
              dynamic segment swallows the literal route. */}
          <Route path="projects" element={<Projects />} />
          <Route
            path="projects/mine"
            element={
              <RequireAuth>
                <MyProjects />
              </RequireAuth>
            }
          />
          <Route path="projects/:slug" element={<ProjectDetail />} />

          {/* ─── Classes ───────────────────────────────────── */}
          <Route path="classes" element={<Classes />} />
          <Route
            path="classes/mine"
            element={
              <RequireAuth>
                <MyRecordings />
              </RequireAuth>
            }
          />
          <Route path="classes/:slug" element={<ClassDetail />} />

          {/* ─── User-only ─────────────────────────────────── */}
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

          {/* ─── Instructor ────────────────────────────────── */}
          <Route
            path="instructor"
            element={
              <InstructorGuard>
                <InstructorLayout />
              </InstructorGuard>
            }
          >
            <Route index element={<InstructorCourses />} />
            {/* Static "students" route must come before dynamic
                "courses/:slug/..." so the more specific path wins. */}
            <Route path="students" element={<InstructorStudents />} />
            <Route
              path="courses/:slug/students/:userId"
              element={<InstructorStudentDetail />}
            />
            <Route path="courses/new" element={<InstructorCourseCreate />} />
            <Route path="courses/:slug" element={<InstructorCourseEdit />} />
          </Route>

          {/* ─── Admin ─────────────────────────────────────── */}
          <Route
            path="admin"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="bulk-import" element={<AdminBulkImport />} />
            <Route
              path="courses"
              element={<Navigate to="/instructor" replace />}
            />
            <Route
              path="courses/:slug"
              element={<Navigate to="/instructor" replace />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}