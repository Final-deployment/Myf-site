/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles login, logout, user state management, and session expiration.
 * 
 * @module components/AuthContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { api, getAuthToken } from '../services/api';
import { User, SESSION_TIMEOUT_MS } from '../types';

// ============================================================================
// Constants
// ============================================================================

/** Key for storing last activity timestamp */
const LAST_ACTIVITY_KEY = 'mastaba_last_activity';

/** Interval for checking session expiration (1 minute) */
const SESSION_CHECK_INTERVAL = 60 * 1000;

// ============================================================================
// Types
// ============================================================================

/**
 * Authentication context type definition
 */
interface AuthContextType {
    /** Currently logged in user, null if not authenticated */
    user: User | null;
    /** Whether authentication state is being loaded */
    isLoading: boolean;
    /** Whether user is currently authenticated */
    isAuthenticated: boolean;
    /** 
     * Attempts to log in a user
     * @param email - User's email address
     * @param password - User's password
     * @returns Promise that resolves to true if login successful
     */
    login: (email: string, password: string) => Promise<boolean>;
    /** Logs out the current user */
    logout: () => void;
    /**
     * Updates the current user's information
     * @param updates - Partial user object with fields to update
     */
    updateUser: (updates: Partial<User>) => void;
    /** Updates the last activity timestamp to prevent session expiration */
    refreshActivity: () => void;
    /** 
     * Checks if stored token is valid and auto-logs in user
     * @returns Promise that resolves to true if session is valid
     */
    checkSession: () => Promise<boolean>;
    /**
     * Directly sets the user (used after registration/verification)
     */
    setUser: (user: User | null) => void;
}

/**
 * Auth provider props
 */
interface AuthProviderProps {
    children: ReactNode;
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods.
 * Persists authentication state in localStorage.
 * Includes automatic session expiration after inactivity.
 * 
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionCheckRef = useRef<number | null>(null);

    /**
     * Updates the last activity timestamp
     */
    const updateLastActivity = useCallback((): void => {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }, []);

    /**
     * Checks if the session has expired
     */
    const isSessionExpired = useCallback((): boolean => {
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (!lastActivity) return false;

        const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
        return timeSinceActivity > SESSION_TIMEOUT_MS;
    }, []);

    /**
     * Handles session expiration - logs out user
     */
    const handleSessionExpiration = useCallback((): void => {
        // Session expired due to inactivity - logout user
        api.logout();
        setUser(null);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
    }, []);


    // Set up session expiration check interval
    useEffect(() => {
        if (user) {
            // Check session expiration every minute
            sessionCheckRef.current = window.setInterval(() => {
                if (isSessionExpired()) {
                    handleSessionExpiration();
                }
            }, SESSION_CHECK_INTERVAL);

            // Update activity on user interactions
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            const handleActivity = () => updateLastActivity();

            events.forEach(event => {
                window.addEventListener(event, handleActivity, { passive: true });
            });

            return () => {
                if (sessionCheckRef.current) {
                    clearInterval(sessionCheckRef.current);
                }
                events.forEach(event => {
                    window.removeEventListener(event, handleActivity);
                });
            };
        }
    }, [user, isSessionExpired, handleSessionExpiration, updateLastActivity]);

    /**
     * Attempts to log in with email and password
     */
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const loggedUser = await api.login(email, password);
            if (loggedUser) {
                setUser(loggedUser);
                updateLastActivity(); // Start tracking activity
                setIsLoading(false);
                return true;
            }
            setIsLoading(false);
            return false;
        } catch (error: unknown) {
            setIsLoading(false);
            const authError = error as { needsVerification?: boolean };
            if (authError.needsVerification) {
                // Re-throw to be caught by the component
                throw error;
            }
            return false;
        }
    }, [updateLastActivity]);

    /**
     * Logs out the current user
     */
    const logout = useCallback((): void => {
        if (sessionCheckRef.current) {
            clearInterval(sessionCheckRef.current);
        }
        api.logout();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setUser(null);
    }, []);

    /**
     * Updates the current user's information
     */
    const updateUser = useCallback(async (updates: Partial<User>): Promise<void> => {
        if (user) {
            try {
                const updatedUser = await api.updateUser(user.id, updates);
                if (updatedUser) {
                    setUser(updatedUser);
                }
            } catch (error) {
                console.error('Failed to update user:', error);
            }
        }
    }, [user]);

    /**
     * Checks if stored token is valid and restores session
     * Uses localStorage for session persistence (no backend call)
     */
    const checkSession = useCallback(async (): Promise<boolean> => {
        // Check for stored user in localStorage
        const storedUser = api.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
            updateLastActivity();
            return true;
        }
        return false;
    }, [updateLastActivity]);

    // Check for existing session on mount and validate expiration
    useEffect(() => {
        const initAuth = async () => {
            const storedUser = api.getCurrentUser();
            const token = getAuthToken();

            if (storedUser) {
                // Check if session has expired (frontend inactivity)
                if (isSessionExpired()) {
                    handleSessionExpiration();
                } else {
                    setUser(storedUser);
                    updateLastActivity();
                    // Optional: re-validate with server in background
                    checkSession();
                }
            } else if (token) {
                // No user object but we have a token - try to restore
                await checkSession();
            }
            setIsLoading(false);
        };

        initAuth();
    }, [isSessionExpired, handleSessionExpiration, updateLastActivity, checkSession]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<AuthContextType>(() => ({
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        refreshActivity: updateLastActivity,
        checkSession,
        setUser
    }), [user, isLoading, login, logout, updateUser, updateLastActivity, checkSession]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to access authentication context
 * 
 * @throws {Error} When used outside of AuthProvider
 * @returns Authentication context with user state and methods
 * 
 * @example
 * const { user, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
