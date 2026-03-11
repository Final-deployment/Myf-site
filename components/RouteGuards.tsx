import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Guard for authenticated users (Students/Admins)
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!isAuthenticated) {
        // Redirect to landing if not authenticated, bit save current location
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * Guard for Admin-only routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        // Unauthorized users go to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

/**
 * Guard for public auth pages (Login/Register)
 * Redirects to dashboard if already logged in
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return <>{children}</>;
};

/**
 * Guard for Supervisor-only routes
 */
export const SupervisorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    if (!isAuthenticated || (user?.role !== 'supervisor' && user?.role !== 'admin')) {
        // Supervisors only (Admins can also see them for testing/support)
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
