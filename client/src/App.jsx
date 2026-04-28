import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { useAuth } from './hooks/useAuth.js';

import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import InviteLandingPage from './pages/InviteLandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AppShell from './pages/AppShell.jsx';
import TripsPanel from './pages/TripsPanel.jsx';
import TripPage from './pages/TripPage.jsx';
import ExpensePage from './pages/ExpensePage.jsx';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes — no shell */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InviteLandingPage />} />

      {/* App routes — wrapped in AppShell */}
      <Route path="/" element={
        <PrivateRoute>
          <AppShell>
            <TripsPanel />
          </AppShell>
        </PrivateRoute>
      } />

      <Route path="/trips/:id" element={
        <PrivateRoute>
          <AppShell>
            <TripPage />
          </AppShell>
        </PrivateRoute>
      } />

      <Route path="/trips/:id/expenses" element={
        <PrivateRoute>
          <AppShell>
            <ExpensePage />
          </AppShell>
        </PrivateRoute>
      } />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
