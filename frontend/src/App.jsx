import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboardPage from "./admin/AdminDashboard";
import AdminLoginPage from "./admin/AdminLoginPage";

const AdminProtectedRoute = ({ children }) => {
  const hasAdminToken = Boolean(localStorage.getItem("adminToken"));
  if (!hasAdminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
    </Routes>
  );
}
