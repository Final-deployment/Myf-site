/**
 * @fileoverview Custom hook for API calls with loading and error states
 * @module hooks/useApi
 */

import { useState, useCallback } from 'react';

/**
 * API call state interface
 */
interface UseApiState<T> {
    /** The data returned from the API */
    data: T | null;
    /** Loading state indicator */
    loading: boolean;
    /** Error message if request failed */
    error: string | null;
}

/**
 * API call options
 */
interface UseApiOptions {
    /** Number of retry attempts on failure */
    retries?: number;
    /** Delay between retries in ms */
    retryDelay?: number;
    /** Callback on successful call */
    onSuccess?: () => void;
    /** Callback on error */
    onError?: (error: string) => void;
}

/**
 * Return type for useApi hook
 */
interface UseApiReturn<T, Args extends unknown[]> extends UseApiState<T> {
    /** Execute the API call */
    execute: (...args: Args) => Promise<T | null>;
    /** Reset state to initial values */
    reset: () => void;
    /** Set data directly */
    setData: (data: T | null) => void;
}

/**
 * Custom hook for managing API calls with automatic loading and error states
 * 
 * @template T - The type of data returned by the API
 * @template Args - The argument types for the API function
 * @param apiFunction - The async function to call
 * @param options - Optional configuration
 * @returns Object containing data, loading, error, and execute function
 * 
 * @example
 * ```tsx
 * const { data: users, loading, error, execute } = useApi(api.getUsers);
 * 
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 * ```
 */
export function useApi<T, Args extends unknown[] = []>(
    apiFunction: (...args: Args) => Promise<T>,
    options: UseApiOptions = {}
): UseApiReturn<T, Args> {
    const { retries = 0, retryDelay = 1000, onSuccess, onError } = options;

    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    /**
     * Execute the API call with retry logic
     */
    const execute = useCallback(
        async (...args: Args): Promise<T | null> => {
            setState((prev) => ({ ...prev, loading: true, error: null }));

            let lastError: string | null = null;

            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const result = await apiFunction(...args);
                    setState({ data: result, loading: false, error: null });
                    onSuccess?.();
                    return result;
                } catch (err) {
                    lastError = err instanceof Error ? err.message : 'An error occurred';

                    if (attempt < retries) {
                        // Wait before retry
                        await new Promise((resolve) => setTimeout(resolve, retryDelay));
                    }
                }
            }

            // All retries failed
            setState((prev) => ({ ...prev, loading: false, error: lastError }));
            if (lastError) {
                onError?.(lastError);
            }
            return null;
        },
        [apiFunction, retries, retryDelay, onSuccess, onError]
    );

    /**
     * Reset state to initial values
     */
    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    /**
     * Set data directly
     */
    const setData = useCallback((data: T | null) => {
        setState((prev) => ({ ...prev, data }));
    }, []);

    return {
        ...state,
        execute,
        reset,
        setData,
    };
}

export default useApi;
