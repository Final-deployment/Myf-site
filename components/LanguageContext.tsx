/**
 * Language Context
 * 
 * Provides internationalization (i18n) support for the application.
 * Handles language switching between Arabic and English.
 * 
 * @module components/LanguageContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ar } from '../translations/ar';
import { en } from '../translations/en';

// ============================================================================
// Types
// ============================================================================

/** Supported languages */
type Language = 'ar' | 'en';

/** Text direction */
type Direction = 'rtl' | 'ltr';

/**
 * Language context type definition
 */
interface LanguageContextType {
    /** Current language code */
    language: Language;
    /** Sets the current language */
    setLanguage: (lang: Language) => void;
    /** 
     * Translates a key to the current language
     * @param key - Dot-notation key (e.g., 'header.greeting')
     * @returns Translated string or key if not found
     */
    t: (key: string) => string;
    /** Current text direction */
    dir: Direction;
}

/**
 * Provider props
 */
interface LanguageProviderProps {
    children: ReactNode;
    /** Initial language (defaults to 'ar') */
    initialLanguage?: Language;
}

// ============================================================================
// Constants
// ============================================================================

/** All available translations */
const translations: Record<Language, typeof ar> = { ar, en };

/** Local storage key for persisting language preference */
const LANGUAGE_STORAGE_KEY = 'mastaba_language';

// ============================================================================
// Context Creation
// ============================================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// Language Provider Component
// ============================================================================

/**
 * Language Provider Component
 * 
 * Wraps the application to provide translation capabilities.
 * Automatically updates document direction based on language.
 * Persists language preference to localStorage.
 * 
 * @example
 * <LanguageProvider>
 *   <App />
 * </LanguageProvider>
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
    children,
    initialLanguage = 'ar'
}) => {
    // Try to get saved language preference
    const savedLanguage = typeof window !== 'undefined'
        ? localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
        : null;

    const [language, setLanguageState] = useState<Language>(savedLanguage || initialLanguage);

    /**
     * Sets the language and updates document direction
     */
    const setLanguage = useCallback((lang: Language): void => {
        setLanguageState(lang);

        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Persist preference
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }, []);

    // Initialize direction on mount
    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    /**
     * Translates a key using dot notation
     * 
     * @param key - Translation key (e.g., 'header.greeting')
     * @returns Translated string or key if not found
     */
    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let value: unknown = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                // Fallback to key if translation not found
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    }, [language]);

    // Current direction based on language
    const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';

    // Memoize context value
    const contextValue = useMemo<LanguageContextType>(() => ({
        language,
        setLanguage,
        t,
        dir
    }), [language, setLanguage, t, dir]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to access language context
 * 
 * @throws {Error} When used outside of LanguageProvider
 * @returns Language context with translation function and language state
 * 
 * @example
 * const { t, language, setLanguage } = useLanguage();
 * const greeting = t('header.greeting');
 */
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
