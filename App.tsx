
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import LandingPage from './pages/LandingPage';
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

const ConditionalRoot = () => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return user ? <Navigate to="/app" replace /> : <LandingPage />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased relative overflow-hidden">
      {/* Global Atmospheric Environment */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[0%] right-[-5%] w-[35%] h-[35%] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto h-screen relative pb-20 md:pb-0 z-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConditionalRoot />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/app/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
        {/* Redirect legacy routes or handle 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
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
