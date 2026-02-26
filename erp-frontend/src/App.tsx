import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";
import Users from "./pages/Users";
import Forbidden from "./pages/Forbidden";
import Audit from "./pages/Audit";

import ProtectedRoute from "./auth/ProtectedRoute";
import RequirePermission from "./auth/RequirePermission";
import { AuthProvider } from "./auth/AuthContext";
import AppLayout from "./components/AppLayout";
import { LayoutProvider } from "./layout/LayoutContext";

function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/forbidden"
            element={
              <ProtectedRoute>
                <Forbidden />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route
              path="users"
              element={
                <RequirePermission anyOf={["users.read"]} redirectTo="/forbidden">
                  <Users />
                </RequirePermission>
              }
            />

            <Route
              path="audit"
              element={
                <RequirePermission anyOf={["audit.read"]} redirectTo="/forbidden">
                  <Audit />
                </RequirePermission>
              }
            />
          </Route>
        </Routes>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;