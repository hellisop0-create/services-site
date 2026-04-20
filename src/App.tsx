import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WorkerProfileForm from './pages/WorkerProfileForm';
import AdminDashboard from './pages/AdminDashboard';
import UserProfilePage from './pages/UserProfilePage';

// Helper component for protected routes
const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; workerOnly?: boolean }> = ({ 
  children, 
  adminOnly = false,
  workerOnly = false
}) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse">Checking access...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin && user.email !== 'hellisop0@gmail.com') return <Navigate to="/" />;
  if (workerOnly && profile?.role !== 'worker') return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* User Profile */}
            <Route path="/profile" element={
              <PrivateRoute>
                <UserProfilePage />
              </PrivateRoute>
            } />

            {/* Worker Profile Edit */}
            <Route path="/profile/edit" element={
              <PrivateRoute workerOnly>
                <WorkerProfileForm />
              </PrivateRoute>
            } />

            {/* Admin Dashboard */}
            <Route path="/admin" element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
