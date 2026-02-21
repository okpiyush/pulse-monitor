import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WebsiteDetail from './pages/WebsiteDetail';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

const PrivateRoute = ({ children, requireMaster }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (requireMaster && !user.is_master) return <Navigate to="/dashboard" />;

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/websites/:id" element={
            <PrivateRoute>
              <WebsiteDetail />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute requireMaster>
              <AdminPanel />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
