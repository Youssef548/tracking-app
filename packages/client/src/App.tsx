import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import PageTransition from './components/PageTransition';
import WeekPageSkeleton from './components/skeletons/WeekPageSkeleton';
import MonthPageSkeleton from './components/skeletons/MonthPageSkeleton';
import ReviewPageSkeleton from './components/skeletons/ReviewPageSkeleton';
import AnalyticsSkeleton from './components/skeletons/AnalyticsSkeleton';
import SettingsSkeleton from './components/skeletons/SettingsSkeleton';
import AuthSkeleton from './components/skeletons/AuthSkeleton';

const WeekPage = lazy(() => import('./pages/WeekPage'));
const MonthPage = lazy(() => import('./pages/MonthPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-12">{children}</main>
      <BottomNavBar />
    </div>
  );
}

function LazyPage({
  skeleton,
  children,
}: {
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={skeleton}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <LazyPage skeleton={<AuthSkeleton />}>
              <Login />
            </LazyPage>
          }
        />
        <Route
          path="/register"
          element={
            <LazyPage skeleton={<AuthSkeleton />}>
              <Register />
            </LazyPage>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<WeekPageSkeleton />}>
                  <WeekPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/month"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<MonthPageSkeleton />}>
                  <MonthPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<ReviewPageSkeleton />}>
                  <ReviewPage />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<AnalyticsSkeleton />}>
                  <Analytics />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LazyPage skeleton={<SettingsSkeleton />}>
                  <Settings />
                </LazyPage>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
