import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ROUTES } from "@config/routes";
import RootLayout from "@components/layout/RootLayout";
import { AuthProvider } from "@features/auth/context/AuthProvider";
import { ProtectedRoute } from "@features/auth/components/ProtectedRoute";

const HomePage = lazy(() => import("@pages/HomePage"));
const LoginPage = lazy(() => import("@pages/LoginPage"));
const RegisterPage = lazy(() => import("@pages/RegisterPage"));
const DashboardPage = lazy(() => import("@features/dashboard/pages/DashboardPage"));
const IdeasPage = lazy(() => import("@features/ideas/pages/IdeasPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          {/* -- Public Routes -- */}
          <Route index element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

          {/* -- Protected Routes -- */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.IDEAS}
            element={
              <ProtectedRoute>
                <IdeasPage />
              </ProtectedRoute>
            }
          />

          {/* -- Catch All Route -- */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
