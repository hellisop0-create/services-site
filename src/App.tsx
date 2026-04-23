import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatBox from './pages/ChatBox';
import WorkerProfileForm from './pages/WorkerProfileForm';
import AdminDashboard from './pages/AdminDashboard';
import UserProfilePage from './pages/UserProfilePage';
// Note: Assuming ChatListPage is the correct component for the chats route
import ChatListPage from './pages/ChatListPage'; 

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

/**
 * Wrapper to extract URL params and Auth state 
 * and pass them as props to the ChatBox component
 */
const ChatRouteWrapper = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return <div className="h-screen flex items-center justify-center">Loading Chat...</div>;
  }

  return (
    <ChatBox 
      chatId={id || ''} 
      currentUser={{
        uid: user.uid,
        email: user.email || '',
        role: profile.role
      }} 
    />
  );
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
            
            {/* Unified Chat List Route */}
            <Route path="/chats" element={
              <PrivateRoute>
                <ChatListPage />
              </PrivateRoute>
            } />
            
            {/* Updated Chat Route with Wrapper */}
            <Route path="/chat/:id" element={
              <PrivateRoute>
                <ChatRouteWrapper />
              </PrivateRoute>
            } />
            
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