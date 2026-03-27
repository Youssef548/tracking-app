import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import PageTransition from './components/PageTransition';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';
import CalendarSkeleton from './components/skeletons/CalendarSkeleton';
import AnalyticsSkeleton from './components/skeletons/AnalyticsSkeleton';
import HabitsSkeleton from './components/skeletons/HabitsSkeleton';
import AuthSkeleton from './components/skeletons/AuthSkeleton';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Habits = lazy(() => import('./pages/Habits'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNavBar />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-12">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}

function LazyPage({ skeleton, children }) {
  return (
    <Suspense fallback={skeleton}>
      <PageTransition>
        {children}
      </PageTransition>
    </Suspense>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          <LazyPage skeleton={<AuthSkeleton />}><Login /></LazyPage>
        } />
        <Route path="/register" element={
          <LazyPage skeleton={<AuthSkeleton />}><Register /></LazyPage>
        } />
        <Route path="/" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<DashboardSkeleton />}><Dashboard /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<CalendarSkeleton />}><Calendar /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<AnalyticsSkeleton />}><Analytics /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="/habits" element={
          <ProtectedRoute><AppLayout>
            <LazyPage skeleton={<HabitsSkeleton />}><Habits /></LazyPage>
          </AppLayout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
