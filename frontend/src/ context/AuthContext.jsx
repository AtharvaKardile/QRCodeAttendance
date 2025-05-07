// ========================================================================
// qr-attendance-frontend/src/context/AuthContext.jsx
// ========================================================================
import React, { createContext, useState, useEffect, useReducer, useCallback } from 'react';
import { logoutUser as apiLogout } from '../api/authApi';
import apiClient from '../api/axiosConfig'; // Needed for interceptor setup

// Define action types for the reducer
const AUTH_ACTION_TYPES = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    SET_LOADING: 'SET_LOADING',
    INITIALIZE: 'INITIALIZE', // Action to initialize state from storage
};

// Initial state
const initialState = {
    isAuthenticated: false,
    user: null, // { PRN/Email, Name, Role ('student' or 'teacher'), etc. }
    token: null, // Although using httpOnly cookies, might store for client-side checks if needed (generally avoid)
    isLoading: true, // Start loading until initialization is complete
};

// Reducer function to manage auth state
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTION_TYPES.INITIALIZE:
        case AUTH_ACTION_TYPES.LOGIN_SUCCESS:
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                // token: action.payload.token, // If storing token
                isLoading: false,
            };
        case AUTH_ACTION_TYPES.LOGOUT:
            return {
                ...initialState, // Reset to initial state
                isLoading: false, // No longer loading after logout
            };
        case AUTH_ACTION_TYPES.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };
        default:
            return state;
    }
};

// Create the context
export const AuthContext = createContext({
    ...initialState,
    login: () => {},
    logout: async () => {},
    checkAuthStatus: async () => {}, // Add checkAuthStatus
});


// Create the provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Function to handle login success
    const login = useCallback((userData) => {
        // Store user data in localStorage for persistence across refreshes
        localStorage.setItem('user', JSON.stringify(userData));
        dispatch({ type: AUTH_ACTION_TYPES.LOGIN_SUCCESS, payload: { user: userData } });
    }, []);

    // Function to handle logout
    const logout = useCallback(async () => {
        dispatch({ type: AUTH_ACTION_TYPES.SET_LOADING, payload: true });
        try {
            await apiLogout(); // Call API to clear the httpOnly cookie
        } catch (error) {
            console.error("Logout API call failed:", error);
            // Still proceed with client-side logout even if API fails
        } finally {
            localStorage.removeItem('user'); // Clear user from localStorage
            dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
            // Optionally redirect to login page here or let ProtectedRoute handle it
        }
    }, []);

    // Function to check authentication status (e.g., on app load)
    // This relies on the httpOnly cookie being sent automatically by the browser
    // We can verify by trying to fetch user-specific data or having a dedicated endpoint
    const checkAuthStatus = useCallback(async () => {
        dispatch({ type: AUTH_ACTION_TYPES.SET_LOADING, payload: true });
        // Attempt to retrieve user data from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                // Optional: Verify token validity with a backend endpoint if needed
                // e.g., const response = await apiClient.get('/auth/verify');
                // if (response.status === 200) { ... }
                dispatch({ type: AUTH_ACTION_TYPES.INITIALIZE, payload: { user } });
                return; // Initialized from storage
            } catch (error) {
                console.error("Failed to parse stored user or verify token:", error);
                // Clear invalid stored data and proceed as unauthenticated
                localStorage.removeItem('user');
            }
        }
        // If no valid stored user, assume logged out
        dispatch({ type: AUTH_ACTION_TYPES.LOGOUT }); // Ensure state is clean

    }, []); // Removed dispatch from dependencies as it's stable

    // Effect to check auth status on initial mount
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]); // Run only once on mount

    // Effect to setup Axios interceptor for automatic logout on 401/403
    useEffect(() => {
        const interceptor = apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    // Don't logout immediately if it's a login/register attempt failure
                    const originalRequestUrl = error.config.url;
                    if (!originalRequestUrl.includes('/login') && !originalRequestUrl.includes('/register')) {
                        console.log("Interceptor: Unauthorized or Forbidden. Logging out.");
                        logout(); // Trigger logout
                    }
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            apiClient.interceptors.response.eject(interceptor);
        };
    }, [logout]); // Re-attach interceptor if logout function changes


    return (
        <AuthContext.Provider value={{ ...state, login, logout, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};
