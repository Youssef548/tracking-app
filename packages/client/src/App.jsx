import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Habits from './pages/Habits';

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><AppLayout><Calendar /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><AppLayout><Habits /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
