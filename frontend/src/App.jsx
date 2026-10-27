import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminDashboardPage from "./admin/AdminDashboard";
import AdminLoginPage from "./admin/AdminLoginPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem("token"));

  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const hasAdminToken = Boolean(localStorage.getItem("adminToken"));

  if (!hasAdminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const hasToken = Boolean(localStorage.getItem("token"));

  if (hasToken) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
