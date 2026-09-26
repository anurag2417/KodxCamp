import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { StaffLayout } from '@/shared/components/layout/StaffLayout';
import { Spinner } from '@/shared/components/ui/Spinner';
import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminBulkImport } from '@/features/admin/pages/AdminBulkImport';
import { AdminClasses } from '@/features/admin/pages/AdminClasses';
import { AdminCourses } from '@/features/admin/pages/AdminCourses';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { AdminMedia } from '@/features/media/pages/AdminMedia';
import { AdminProblems } from '@/features/admin/pages/AdminProblems';
import { AdminProjects } from '@/features/admin/pages/AdminProjects';
import { AdminProjectSubmissions } from '@/features/admin/pages/AdminProjectSubmissions';
import { AdminSubmissionEvaluation } from '@/features/admin/pages/AdminSubmissionEvaluation';
import { AdminRoadmaps } from '@/features/admin/pages/AdminRoadmaps';
import { AdminRoadmapEdit } from '@/features/admin/pages/AdminRoadmapEdit';
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
import { MyLearning } from '@/features/dashboard/pages/MyLearning';
import { InstructorGuard } from '@/features/instructor/components/InstructorGuard';
import { InstructorStudents } from '@/features/instructor/pages/InstructorStudents';
import { InstructorStudentDetail } from '@/features/instructor/pages/InstructorStudentDetail';
import { InstructorCourses } from '@/features/instructor/components/InstructorCourses';
import { InstructorCourseEdit } from '@/features/instructor/components/InstructorCourseEdit';
import { InstructorCourseCreate } from '@/features/instructor/pages/InstructorCourseCreate';
import { InstructorDashboard } from '@/features/instructor/pages/InstructorDashboard';
import { InstructorCohorts } from '@/features/instructor/pages/InstructorCohorts';
import { InstructorCohortDetail } from '@/features/instructor/pages/InstructorCohortDetail';
import { InstructorProjectSubmissions } from '@/features/instructor/pages/InstructorProjectSubmissions';
import { InstructorSubmissionReview } from '@/features/instructor/pages/InstructorSubmissionReview';
import { InstructorAnnouncements } from '@/features/announcements/pages/InstructorAnnouncements';
import { Notifications } from '@/features/notifications/pages/Notifications';
import Home from '@/features/marketing/pages/Home';
import { Playground } from '@/features/playground/pages/Playground';
import { Practice } from '@/features/problems/pages/Practice';
import { ProblemDetail } from '@/features/problems/pages/ProblemDetail';
import { Achievements } from '@/features/progress/pages/Achievements';
import { Progress } from '@/features/progress/pages/Progress';
import { Streak } from '@/features/progress/pages/Streak';
import { MyProjects } from '@/features/projects/pages/MyProjects';
import { ProjectDetail } from '@/features/projects/pages/ProjectDetail';
import { Projects } from '@/features/projects/pages/Projects';
import { Roadmaps } from '@/features/roadmaps/pages/Roadmaps';
import { RoadmapDetail } from '@/features/roadmaps/pages/RoadmapDetail';
import { RoadmapWorkspace } from '@/features/roadmaps/pages/RoadmapWorkspace';
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
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/verify" element={<VerifyOtp />} />
        <Route path="/signup/setup" element={<SetupAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/invitations/:token" element={<AcceptInvitation />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* Student shell */}
        <Route element={<AppLayout />}>
          <Route
            path="/my-learning"
            element={
              <RequireAuth>
                <MyLearning />
              </RequireAuth>
            }
          />

          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/roadmaps/:slug" element={<RoadmapDetail />} />
          <Route
            path="/roadmaps/:slug/:tab"
            element={
              <RequireAuth>
                <RoadmapWorkspace />
              </RequireAuth>
            }
          />

          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route
            path="/courses/:courseSlug/lessons/:lessonSlug"
            element={<Lesson />}
          />

          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:slug" element={<ProblemDetail />} />

          <Route path="/playground" element={<Playground />} />

          <Route path="/projects" element={<Projects />} />
          <Route
            path="/projects/mine"
            element={
              <RequireAuth>
                <MyProjects />
              </RequireAuth>
            }
          />
          <Route path="/projects/:slug" element={<ProjectDetail />} />

          <Route path="/classes" element={<Classes />} />
          <Route
            path="/classes/mine"
            element={
              <RequireAuth>
                <MyRecordings />
              </RequireAuth>
            }
          />
          <Route path="/classes/:slug" element={<ClassDetail />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/progress"
            element={
              <RequireAuth>
                <Progress />
              </RequireAuth>
            }
          />
          <Route
            path="/achievements"
            element={
              <RequireAuth>
                <Achievements />
              </RequireAuth>
            }
          />
          <Route
            path="/streak"
            element={
              <RequireAuth>
                <Streak />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Instructor shell */}
        <Route
          element={
            <InstructorGuard>
              <StaffLayout role="instructor" />
            </InstructorGuard>
          }
        >
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route
            path="/instructor/courses"
            element={<InstructorCourses />}
          />
          <Route
            path="/instructor/cohorts"
            element={<InstructorCohorts />}
          />
          <Route
            path="/instructor/cohorts/:cohortId"
            element={<InstructorCohortDetail />}
          />
          <Route
            path="/instructor/announcements"
            element={<InstructorAnnouncements />}
          />
          <Route
            path="/instructor/students"
            element={<InstructorStudents />}
          />
          <Route
            path="/instructor/courses/:slug/students/:userId"
            element={<InstructorStudentDetail />}
          />
          <Route
            path="/instructor/courses/new"
            element={<InstructorCourseCreate />}
          />
          <Route
            path="/instructor/courses/:slug"
            element={<InstructorCourseEdit />}
          />
          <Route
            path="/instructor/projects/:slug/submissions"
            element={<InstructorProjectSubmissions />}
          />
          <Route
            path="/instructor/submissions/:submissionId"
            element={<InstructorSubmissionReview />}
          />
        </Route>

        {/* Admin shell */}
        <Route
          element={
            <AdminGuard>
              <StaffLayout role="admin" />
            </AdminGuard>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/roadmaps" element={<AdminRoadmaps />} />
          <Route
            path="/admin/roadmaps/:slug"
            element={<AdminRoadmapEdit />}
          />
          <Route path="/admin/problems" element={<AdminProblems />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route
            path="/admin/projects/:slug/submissions"
            element={<AdminProjectSubmissions />}
          />
          <Route
            path="/admin/projects/submissions/:submissionId"
            element={<AdminSubmissionEvaluation />}
          />
          <Route path="/admin/classes" element={<AdminClasses />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/bulk-import" element={<AdminBulkImport />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}