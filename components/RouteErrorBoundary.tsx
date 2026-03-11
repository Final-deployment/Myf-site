/**
 * Route Error Boundary Component
 * 
 * Catches errors in child components and displays a user-friendly fallback UI.
 * Can be used to wrap individual routes or sections of the app.
 * 
 * @module components/RouteErrorBoundary
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface RouteErrorBoundaryProps {
    /** Child components to render */
    children: ReactNode;
    /** Optional fallback component */
    fallback?: ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Optional custom title for the error message */
    errorTitle?: string;
}

interface RouteErrorBoundaryState {
    /** Whether an error has been caught */
    hasError: boolean;
    /** The caught error */
    error: Error | null;
    /** Stack trace info */
    errorInfo: ErrorInfo | null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Error boundary component for catching and displaying errors gracefully
 * 
 * @example
 * <RouteErrorBoundary>
 *   <MyComponent />
 * </RouteErrorBoundary>
 */
class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
    constructor(props: RouteErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    /**
     * Update state when an error is caught
     */
    static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
        return { hasError: true, error };
    }

    /**
     * Log error information
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console in development
        console.error('RouteErrorBoundary caught an error:', error, errorInfo);
    }

    /**
     * Reset error state and retry
     */
    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    /**
     * Navigate to home/dashboard
     */
    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback, errorTitle } = this.props;

        if (hasError) {
            // Return custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div
                    className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
                    role="alert"
                    aria-live="assertive"
                >
                    {/* Error Icon */}
                    <div className="w-20 h-20 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10 text-red-400" aria-hidden="true" />
                    </div>

                    {/* Error Title */}
                    <h2 className="text-2xl font-bold text-white mb-3">
                        {errorTitle || 'حدث خطأ غير متوقع'}
                    </h2>

                    {/* Error Description */}
                    <p className="text-gray-300 mb-6 max-w-md">
                        نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية.
                    </p>

                    {/* Error Details (Development only) */}
                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="mb-6 w-full max-w-lg text-left">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                                تفاصيل الخطأ (للمطورين)
                            </summary>
                            <pre className="mt-2 p-4 bg-black/30 rounded-lg text-xs text-red-300 overflow-auto max-h-40">
                                {error.message}
                                {'\n\n'}
                                {error.stack}
                            </pre>
                        </details>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium"
                            aria-label="حاول مرة أخرى"
                        >
                            <RefreshCw className="w-5 h-5" aria-hidden="true" />
                            حاول مرة أخرى
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                            aria-label="العودة للرئيسية"
                        >
                            <Home className="w-5 h-5" aria-hidden="true" />
                            الرئيسية
                        </button>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default RouteErrorBoundary;
