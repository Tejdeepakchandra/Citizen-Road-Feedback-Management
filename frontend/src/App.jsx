import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "react-hot-toast";
import { CssBaseline, Box, CircularProgress } from "@mui/material";

// Layout Components
import MainLayout from "./components/layout/MainLayout";

// Page Components

import HomePage from "./pages/HomePage";
import CitizenDashboard from "./pages/Dashboard/CitizenDashboard";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import StaffDashboard from "./pages/Dashboard/StaffDashboard";
//user
import NewReport from "./pages/User/Reports/NewReport";
import MyReports from "./pages/User/Reports/MyReports";
import ReportDetail from "./pages/User/Reports/ReportDetail";
import GiveFeedback from "./pages/User/Feedback/GiveFeedback";
import FeedbackList from "./pages/User/Feedback/FeedbackList";
import DonatePage from "./pages/User/Donations/DonatePage";


import ManageStaff from "./pages/Admin/ManageStaff";
import AssignTasks from "./pages/Admin/AssignTasks";
import SystemAnalytics from "./pages/Admin/SystemAnalytics";
import ContentManager from "./pages/Admin/ContentManager";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import UserSettingsPage from "./pages/User/Settings/UserSettingsPage";
import ProfilePage from "./pages/User/Profile/ProfilePage";
import UserGallery from './pages/User/UserGallery';
import NotificationsPage from './pages/NotificationsPage';


// Admin Pages
import ManageUsers from "./pages/Admin/ManageUsers";
import ImageApprovals from "./pages/Admin/ImageApprovals";
import GalleryManagement from "./pages/Admin/GalleryManagement";
import FinancialManagement from "./pages/Admin/FinancialManagement";
import SystemHealth from "./pages/Admin/SystemHealth";
import IssueManagement from "./pages/Admin/IssueManagement";
import AdminSettingsPage from "./pages/Admin/AdminSettingsPage";
// New Profile Pages
import AdminProfile from "./pages/Admin/AdminProfile";
import StaffProfilePage from "./pages/Staff/StaffProfilePage";

import Tasks from "./pages/Staff/Tasks";
import UpdateProgress from "./pages/Staff/UpdateProgress";
import UploadImages from "./pages/Staff/UploadImages";
import WorkHistory from "./pages/Staff/WorkHistory";
import StaffTaskDetail from "./pages/Staff/StaffTaskDetail";
import Performance from "./pages/Staff/Performance";
import StaffSettingsPage from "./pages/Staff/StaffSettingsPage";

// Component to set up navigation in AuthContext
const AuthNavigationSetter = ({ children }) => {
  const { setNavigate } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (setNavigate) {
      setNavigate(navigate);
    }
  }, [setNavigate, navigate]);

  return children;
};

// Loading Component
const LoadingScreen = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
    }}
  >
    <CircularProgress />
  </Box>
);

// Public Route Component (for unauthenticated users only - login/register)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

// Protected Route Component (for authenticated users only)
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isInitialized } = useAuth();

  if (loading || !isInitialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "staff":
        return <Navigate to="/staff/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Role-based Profile Component
const ProfileWrapper = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <AdminProfile />;
    case "staff":
      return <StaffProfilePage />;
    default:
      return <ProfilePage />;
  }
};

// App Content - This must be inside AuthProvider context
const AppContent = () => {
  return (
    <AuthNavigationSetter>
      <Routes>
        {/* All routes use MainLayout */}
        <Route element={<MainLayout />}>
          {/* Public routes (no auth required) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<UserGallery />} />

          {/* Auth routes (only for unauthenticated users) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected routes (require authentication) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileWrapper />
              </ProtectedRoute>
            }
          />

          {/* Citizen routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/new"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <NewReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/my-reports"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute
                allowedRoles={["citizen", "user", "staff", "admin"]}
              >
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback/give/:reportId"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <GiveFeedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <FeedbackList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donate"
            element={
              <ProtectedRoute>
                <DonatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/notifications"
            element={
              <ProtectedRoute allowedRoles={["citizen", "user"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageStaff />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IssueManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/pending"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IssueManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports/categories"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IssueManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assign-tasks"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AssignTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SystemAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ContentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/image-approvals"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ImageApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GalleryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financial"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FinancialManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SystemHealth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Staff routes - ALL INSIDE MainLayout */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/tasks"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/tasks/pending"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/tasks/completed"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/tasks/:id"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffTaskDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/update-progress"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <UpdateProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/update-progress/:id"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <UpdateProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/upload-images"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <UploadImages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/history"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <WorkHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/history/week"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <WorkHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/history/month"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <WorkHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/performance"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <Performance />
              </ProtectedRoute>
            }
          />
         
          <Route
            path="/staff/settings"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/notifications"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthNavigationSetter>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SidebarProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </SidebarProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;