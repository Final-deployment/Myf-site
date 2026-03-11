/**
 * Toast Notification System
 * 
 * Enterprise-grade notification system to replace alert() calls.
 * Provides success, error, warning, and info notifications.
 * 
 * @module components/Toast
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, memo, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/** Toast notification types */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast notification data */
export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

/** Toast context type */
interface ToastContextType {
    /** Show a success toast */
    success: (message: string, duration?: number) => void;
    /** Show an error toast */
    error: (message: string, duration?: number) => void;
    /** Show a warning toast */
    warning: (message: string, duration?: number) => void;
    /** Show an info toast */
    info: (message: string, duration?: number) => void;
    /** Dismiss a toast by ID */
    dismiss: (id: string) => void;
    /** Dismiss all toasts */
    dismissAll: () => void;
}

/** Toast provider props */
interface ToastProviderProps {
    children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================================================
// Constants
// ============================================================================

/** Default toast duration in milliseconds */
const DEFAULT_DURATION = 4000;

/** Maximum number of visible toasts */
const MAX_TOASTS = 5;

// ============================================================================
// Toast Item Component
// ============================================================================

const ToastItem = memo<{ toast: Toast; onDismiss: (id: string) => void }>(({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.duration && toast.duration > 0) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(toast.id), 300);
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onDismiss]);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    }, [toast.id, onDismiss]);

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />,
        error: <XCircle className="w-5 h-5 text-red-400" aria-hidden="true" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />,
        info: <Info className="w-5 h-5 text-blue-400" aria-hidden="true" />,
    };

    const bgColors: Record<ToastType, string> = {
        success: 'bg-emerald-500/10 border-emerald-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        warning: 'bg-amber-500/10 border-amber-500/30',
        info: 'bg-blue-500/10 border-blue-500/30',
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
                shadow-lg transition-all duration-300
                ${bgColors[toast.type]}
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
            role="alert"
            aria-live="polite"
        >
            {icons[toast.type]}
            <p className="text-white text-sm flex-1">{toast.message}</p>
            <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="إغلاق الإشعار"
            >
                <X className="w-4 h-4" aria-hidden="true" />
            </button>
        </div>
    );
});
ToastItem.displayName = 'ToastItem';

// ============================================================================
// Toast Container
// ============================================================================

const ToastContainer = memo<{ toasts: Toast[]; onDismiss: (id: string) => void }>(({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] flex flex-col gap-2"
            aria-label="الإشعارات"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
});
ToastContainer.displayName = 'ToastContainer';

// ============================================================================
// Toast Provider
// ============================================================================

/**
 * Toast Provider Component
 * 
 * Provides toast notification functionality throughout the application.
 * 
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration: number = DEFAULT_DURATION) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, type, message, duration };

        setToasts((prev) => {
            const updated = [newToast, ...prev];
            return updated.slice(0, MAX_TOASTS);
        });
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    const contextValue = useMemo<ToastContextType>(() => ({
        success: (message, duration) => addToast('success', message, duration),
        error: (message, duration) => addToast('error', message, duration),
        warning: (message, duration) => addToast('warning', message, duration),
        info: (message, duration) => addToast('info', message, duration),
        dismiss,
        dismissAll,
    }), [addToast, dismiss, dismissAll]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Custom hook to access toast notifications
 * 
 * @throws {Error} When used outside of ToastProvider
 * @returns Toast context with notification methods
 * 
 * @example
 * const toast = useToast();
 * toast.success('تم الحفظ بنجاح');
 * toast.error('حدث خطأ');
 */
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
