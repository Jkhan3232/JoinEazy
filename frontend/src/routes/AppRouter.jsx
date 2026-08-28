import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout.jsx";
import AppShell from "../layouts/AppShell.jsx";
import { useAuth } from "../hooks/useAuth";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage.jsx";
import AdminAssignmentsCreatePage from "../pages/admin/AdminAssignmentsCreatePage.jsx";
import AdminAssignmentsEditPage from "../pages/admin/AdminAssignmentsEditPage.jsx";
import AdminAssignmentsPage from "../pages/admin/AdminAssignmentsPage.jsx";
import AdminCoursesPage from "../pages/admin/AdminCoursesPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminGroupsPage from "../pages/admin/AdminGroupsPage.jsx";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import StudentAssignmentDetailPage from "../pages/student/StudentAssignmentDetailPage.jsx";
import StudentAssignmentsPage from "../pages/student/StudentAssignmentsPage.jsx";
import StudentCoursePage from "../pages/student/StudentCoursePage.jsx";
import StudentCoursesPage from "../pages/student/StudentCoursesPage.jsx";
import StudentDashboardPage from "../pages/student/StudentDashboardPage.jsx";
import StudentGroupPage from "../pages/student/StudentGroupPage.jsx";
import StudentProfilePage from "../pages/student/StudentProfilePage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === "PROFESSOR" ? "/professor/dashboard" : "/student/dashboard"}
      replace
    />
  );
}

function LegacyAdminRedirect() {
  const location = useLocation();
  const targetPath = location.pathname.replace(/^\/admin/, "/professor");

  return <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />;
}

function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route element={<AppShell />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
          <Route path="/student/group" element={<StudentGroupPage />} />
          <Route
            path="/student/assignments"
            element={<StudentAssignmentsPage />}
          />
          <Route
            path="/student/assignments/:assignmentId"
            element={<StudentAssignmentDetailPage />}
          />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["PROFESSOR"]} />}>
        <Route element={<AppShell />}>
          <Route path="/professor/dashboard" element={<AdminDashboardPage />} />
          <Route path="/professor/courses" element={<AdminCoursesPage />} />
          <Route
            path="/professor/assignments"
            element={<AdminAssignmentsPage />}
          />
          <Route
            path="/professor/assignments/create"
            element={<AdminAssignmentsCreatePage />}
          />
          <Route
            path="/professor/assignments/:assignmentId/edit"
            element={<AdminAssignmentsEditPage />}
          />
          <Route path="/professor/groups" element={<AdminGroupsPage />} />
          <Route path="/professor/students" element={<AdminStudentsPage />} />
          <Route path="/professor/analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>

      <Route path="/admin/*" element={<LegacyAdminRedirect />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default AppRouter;
