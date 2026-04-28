import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportPortal from './pages/ReportPortal';
import TrackReport from './pages/TrackReport';
import Profile from './pages/Profile';

// SuperAdmin pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Organizations from './pages/superadmin/Organizations';

// OrgAdmin pages
import OrgAdminDashboard from './pages/orgadmin/Dashboard';
import Reports from './pages/orgadmin/Reports';
import ReportDetail from './pages/orgadmin/ReportDetail';
import Policies from './pages/orgadmin/Policies';
import Analytics from './pages/orgadmin/Analytics';
import Staff from './pages/orgadmin/Staff';

// Reporter pages
import ReporterDashboard from './pages/reporter/Dashboard';
import MyReports from './pages/reporter/MyReports';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── PUBLIC ───────────────────────────────────────────── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/report" element={<ReportPortal />} />
        <Route path="/track" element={<TrackReport />} />

        {/* ── PROFILE — all logged-in roles ────────────────────── */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['SuperAdmin', 'OrgAdmin', 'Investigator', 'Reporter']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
        </Route>

        {/* ── SUPER ADMIN ──────────────────────────────────────── */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={['SuperAdmin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* ── ORG ADMIN & INVESTIGATOR ──────────────────────────── */}
        <Route
          path="/orgadmin"
          element={
            <ProtectedRoute roles={['OrgAdmin', 'Investigator']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrgAdminDashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="policies" element={<Policies />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="staff" element={<Staff />} />
        </Route>

        {/* ── REPORTER ─────────────────────────────────────────── */}
        <Route
          path="/reporter"
          element={
            <ProtectedRoute roles={['Reporter']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ReporterDashboard />} />
          <Route path="my-reports" element={<MyReports />} />
        </Route>

        {/* ── CATCH-ALL ────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}