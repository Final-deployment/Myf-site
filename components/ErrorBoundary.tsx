/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * @module components/ErrorBoundary
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    /** Child components to wrap */
    children: ReactNode;
    /** Optional fallback component */
    fallback?: ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    /** Whether an error has been caught */
    hasError: boolean;
    /** The error that was caught */
    error: Error | null;
    /** Error info with component stack */
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary class component for catching React errors
 * 
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    /**
     * Update state when an error is thrown
     */
    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    /**
     * Log the error and call optional callback
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    /**
     * Reset the error state to retry rendering
     */
    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    /**
     * Navigate to home page
     */
    handleGoHome = (): void => {
        window.location.href = '/';
    };

    /**
     * Nuclear option: clear all app data and reload
     */
    handleClearAndReload = async (): Promise<void> => {
        try {
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();

            // Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(r => r.unregister()));
            }

            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
        } catch (e) {
            console.error('Failed to clear data:', e);
        }

        // Hard reload
        window.location.href = '/';
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Custom fallback provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
                    <div className="glass-panel p-8 rounded-3xl max-w-lg w-full text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        {/* Error Title */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            حدث خطأ غير متوقع
                        </h1>
                        <p className="text-gray-400 mb-6">
                            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
                        </p>

                        {/* Error Details (Always shown for debugging) */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-900/20 rounded-xl text-right">
                                <p className="text-red-400 text-sm font-mono overflow-auto max-h-24 break-all">
                                    {error.message}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors justify-center"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span>إعادة المحاولة</span>
                            </button>
                            <button
                                onClick={this.handleClearAndReload}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors justify-center"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                <span>مسح البيانات وإعادة التشغيل</span>
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center gap-2 transition-colors justify-center"
                            >
                                <Home className="w-5 h-5" />
                                <span>الصفحة الرئيسية</span>
                            </button>
                        </div>

                        {/* Help Text */}
                        <p className="text-gray-500 text-xs mt-4 leading-relaxed">
                            إذا استمرت المشكلة، جرّب زر "مسح البيانات" أعلاه ثم سجّل دخولك مجدداً.
                            <br />
                            أو تواصل مع الدعم الفني عبر فقاعة المحادثة البرتقالية.
                        </p>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;
