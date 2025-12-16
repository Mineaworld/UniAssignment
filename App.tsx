
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { ToastProvider } from './components/ToastContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Subjects from './pages/Subjects';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-auto h-screen relative pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <MobileNav />
    </div>
  );
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
