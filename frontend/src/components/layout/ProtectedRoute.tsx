import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLoadingScreen from '../ui/AppLoadingScreen';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
