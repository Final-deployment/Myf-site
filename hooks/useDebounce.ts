/**
 * @fileoverview Custom hook for debouncing values
 * @module hooks/useDebounce
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value
 * 
 * @template T - The type of value to debounce
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Only called 500ms after user stops typing
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up on value or delay change
        return () => {
            clearTimeout(timeoutId);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for debounced callback execution
 * 
 * @template Args - The argument types for the callback
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns A debounced version of the callback
 * 
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   (data: FormData) => api.save(data),
 *   1000
 * );
 * ```
 */
export function useDebouncedCallback<Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay: number = 300
): (...args: Args) => void {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return (...args: Args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };
}

export default useDebounce;
