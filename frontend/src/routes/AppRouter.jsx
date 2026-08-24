import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout.jsx";
import AppShell from "../layouts/AppShell.jsx";
import { useAuth } from "../hooks/useAuth";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage.jsx";
import AdminAssignmentsCreatePage from "../pages/admin/AdminAssignmentsCreatePage.jsx";
import AdminAssignmentsEditPage from "../pages/admin/AdminAssignmentsEditPage.jsx";
import AdminAssignmentsPage from "../pages/admin/AdminAssignmentsPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminGroupsPage from "../pages/admin/AdminGroupsPage.jsx";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import StudentAssignmentsPage from "../pages/student/StudentAssignmentsPage.jsx";
import StudentDashboardPage from "../pages/student/StudentDashboardPage.jsx";
import StudentGroupPage from "../pages/student/StudentGroupPage.jsx";
import StudentProfilePage from "../pages/student/StudentProfilePage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"} replace />;
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
          <Route path="/student/group" element={<StudentGroupPage />} />
          <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route element={<AppShell />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
          <Route path="/admin/assignments/create" element={<AdminAssignmentsCreatePage />} />
          <Route path="/admin/assignments/:assignmentId/edit" element={<AdminAssignmentsEditPage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default AppRouter;
