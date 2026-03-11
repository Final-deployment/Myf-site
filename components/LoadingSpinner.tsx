/**
 * Loading Spinner Component
 * 
 * Displays a loading animation with optional message.
 * Used with React.Suspense for code splitting.
 * 
 * @module components/LoadingSpinner
 */

import React, { memo } from 'react';

interface LoadingSpinnerProps {
    /** Size of the spinner: 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg';
    /** Optional loading message */
    message?: string;
    /** Whether to show full screen overlay */
    fullScreen?: boolean;
}

/** Size mappings for the spinner */
const SIZES = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
} as const;

/**
 * Loading Spinner component
 * 
 * @example
 * // Basic usage
 * <LoadingSpinner />
 * 
 * @example
 * // With message
 * <LoadingSpinner message="جاري التحميل..." size="lg" />
 * 
 * @example
 * // Full screen
 * <LoadingSpinner fullScreen message="جاري تحميل الصفحة..." />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
    size = 'md',
    message,
    fullScreen = false
}) => {
    const spinnerClasses = `
        ${SIZES[size]}
        rounded-full
        border-emerald-500/30
        border-t-emerald-500
        animate-spin
    `;

    const content = (
        <div className="flex flex-col items-center justify-center gap-4">
            {/* Spinner */}
            <div className="relative">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                {/* Spinner */}
                <div className={spinnerClasses} />
            </div>

            {/* Message */}
            {message && (
                <p className="text-gray-300 text-sm animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[#022c22]/95 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            {content}
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
