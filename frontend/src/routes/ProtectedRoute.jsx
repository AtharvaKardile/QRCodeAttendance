
// ========================================================================
// qr-attendance-frontend/src/routes/ProtectedRoute.jsx
// ========================================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../ context/useAuth.js';
import PageLoader from '../components/UI/PageLoader';

/**
 * A wrapper for <Route> that redirects to the login
 * screen if you're not yet authenticated or if auth is not
 * yet loaded. It also handles role-based authorization.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Show loading indicator while checking auth status
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if the user's role is allowed for this route
    if (allowedRoles && !allowedRoles.includes(user?.type)) {
        // Redirect to an unauthorized page or the user's default dashboard
        console.warn(`User role '${user?.type}' not authorized for route requiring roles: ${allowedRoles.join(', ')}`);
        // Redirect to a specific unauthorized page or back to their dashboard
        // return <Navigate to="/unauthorized" replace />;
        return <Navigate to={user?.type === 'teacher' ? '/teacher' : '/student'} replace />; // Redirect to their dashboard
    }


    // If authenticated and authorized (or no specific roles required), render the child component
    return children;
};

export default ProtectedRoute;

