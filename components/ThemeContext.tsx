/**
 * Theme Context
 * 
 * Provides theme switching capabilities for the application.
 * Supports 'day' (light) and 'night' (dark) themes.
 * 
 * @module components/ThemeContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

/** Available theme options */
type Theme = 'day' | 'night';

/**
 * Theme context type definition
 */
interface ThemeContextType {
    /** Current theme */
    theme: Theme;
    /** Sets the theme directly */
    setTheme: (theme: Theme) => void;
    /** Toggles between day and night themes */
    toggleTheme: () => void;
    /** Whether dark mode is active */
    isDark: boolean;
}

/**
 * Provider props
 */
interface ThemeProviderProps {
    children: ReactNode;
    /** Initial theme (defaults based on system preference) */
    initialTheme?: Theme;
}

// ============================================================================
// Constants
// ============================================================================

/** Local storage key for persisting theme preference */
const THEME_STORAGE_KEY = 'mastaba_theme';

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Theme Provider Component
// ============================================================================

/**
 * Theme Provider Component
 * 
 * Wraps the application to provide theme management.
 * Persists theme preference to localStorage.
 * Respects system preference on first load.
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    initialTheme
}) => {
    /**
     * Gets the initial theme based on:
     * 1. Provided initialTheme prop
     * 2. Saved preference in localStorage
     * 3. System preference (prefers-color-scheme)
     * 4. Default to 'night'
     */
    const getInitialTheme = (): Theme => {
        if (initialTheme) return initialTheme;

        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
            if (saved) return saved;

            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'night' : 'day';
        }

        return 'night';
    };

    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    /**
     * Sets the theme and persists to storage
     */
    const setTheme = useCallback((newTheme: Theme): void => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);

        // Update document class for global CSS targeting
        document.documentElement.classList.remove('theme-day', 'theme-night');
        document.documentElement.classList.add(`theme-${newTheme}`);
    }, []);

    /**
     * Toggles between day and night themes
     */
    const toggleTheme = useCallback((): void => {
        setTheme(theme === 'day' ? 'night' : 'day');
    }, [theme, setTheme]);

    // Apply theme class on mount and changes
    useEffect(() => {
        document.documentElement.classList.remove('theme-day', 'theme-night');
        document.documentElement.classList.add(`theme-${theme}`);
    }, [theme]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent): void => {
            // Only auto-switch if user hasn't set a preference
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (!saved) {
                setTheme(e.matches ? 'night' : 'day');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [setTheme]);

    // Memoize context value
    const contextValue = useMemo<ThemeContextType>(() => ({
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'night'
    }), [theme, setTheme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to access theme context
 * 
 * @throws {Error} When used outside of ThemeProvider
 * @returns Theme context with theme state and toggle function
 * 
 * @example
 * const { theme, toggleTheme, isDark } = useTheme();
 */
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
