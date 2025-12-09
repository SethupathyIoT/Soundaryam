import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Menu from "./pages/Menu";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import CompaniesPage from "./pages/Companies";
import CompanyEmployeesPage from "./pages/CompanyEmployees";
import EmployeeAccountPage from "./pages/EmployeeAccount";

import ResetMenuPage from "./pages/reset-menu";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { isAuthenticated } from "./lib/auth";

// ⭐ NEW — IMPORT FOOD BILLING PAGE (FIXES WHITE SCREEN)
import EmployeeFoodBilling from "./pages/EmployeeFoodBilling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              isAuthenticated()
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Companies */}
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <Layout>
                  <CompaniesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/companies/:companyId/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <CompanyEmployeesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/:employeeId/account"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeAccountPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Billing */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Menu */}
          <Route
            path="/menu"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout>
                  <Menu />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ⭐ NEW — EMPLOYEE FOOD BILLING */}
          <Route
            path="/employees/:employeeId/food"
            element={
              <ProtectedRoute>
                <Layout>
                  <EmployeeFoodBilling />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* RESET MENU */}
          <Route
            path="/reset-menu"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ResetMenuPage />
              </ProtectedRoute>
            }
          />

          {/* CATCH ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
