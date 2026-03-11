/**
 * @fileoverview Custom hook for pagination logic
 * @module hooks/usePagination
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Pagination state interface
 */
interface PaginationState {
    /** Current page (1-indexed) */
    currentPage: number;
    /** Items per page */
    itemsPerPage: number;
    /** Total number of items */
    totalItems: number;
}

/**
 * Pagination return interface
 */
interface UsePaginationReturn<T> {
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Items for current page */
    paginatedItems: T[];
    /** Whether there's a next page */
    hasNextPage: boolean;
    /** Whether there's a previous page */
    hasPrevPage: boolean;
    /** Go to next page */
    nextPage: () => void;
    /** Go to previous page */
    prevPage: () => void;
    /** Go to specific page */
    goToPage: (page: number) => void;
    /** Set items per page */
    setItemsPerPage: (count: number) => void;
    /** Start index for current page (0-indexed) */
    startIndex: number;
    /** End index for current page (0-indexed, exclusive) */
    endIndex: number;
    /** Items per page setting */
    itemsPerPage: number;
}

/**
 * Pagination options
 */
interface UsePaginationOptions {
    /** Initial page number (default: 1) */
    initialPage?: number;
    /** Items per page (default: 10) */
    itemsPerPage?: number;
}

/**
 * Custom hook for managing pagination state and logic
 * 
 * @template T - The type of items being paginated
 * @param items - Array of items to paginate
 * @param options - Pagination options
 * @returns Pagination state and controls
 * 
 * @example
 * ```tsx
 * const { paginatedItems, currentPage, totalPages, nextPage, prevPage } = 
 *   usePagination(allUsers, { itemsPerPage: 20 });
 * 
 * return (
 *   <div>
 *     {paginatedItems.map(user => <UserCard key={user.id} user={user} />)}
 *     <span>Page {currentPage} of {totalPages}</span>
 *     <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
 *     <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
 *   </div>
 * );
 * ```
 */
export function usePagination<T>(
    items: T[],
    options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
    const { initialPage = 1, itemsPerPage: defaultItemsPerPage = 10 } = options;

    const [state, setState] = useState<PaginationState>({
        currentPage: initialPage,
        itemsPerPage: defaultItemsPerPage,
        totalItems: items.length,
    });

    // Calculate total pages
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(items.length / state.itemsPerPage)),
        [items.length, state.itemsPerPage]
    );

    // Ensure current page is valid when items change
    const validCurrentPage = useMemo(
        () => Math.min(state.currentPage, totalPages),
        [state.currentPage, totalPages]
    );

    // Calculate indices
    const startIndex = useMemo(
        () => (validCurrentPage - 1) * state.itemsPerPage,
        [validCurrentPage, state.itemsPerPage]
    );

    const endIndex = useMemo(
        () => Math.min(startIndex + state.itemsPerPage, items.length),
        [startIndex, state.itemsPerPage, items.length]
    );

    // Get paginated items
    const paginatedItems = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex]
    );

    // Navigation helpers
    const hasNextPage = validCurrentPage < totalPages;
    const hasPrevPage = validCurrentPage > 1;

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
        }
    }, [hasNextPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) {
            setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
        }
    }, [hasPrevPage]);

    const goToPage = useCallback(
        (page: number) => {
            const validPage = Math.max(1, Math.min(page, totalPages));
            setState((prev) => ({ ...prev, currentPage: validPage }));
        },
        [totalPages]
    );

    const setItemsPerPage = useCallback((count: number) => {
        setState((prev) => ({
            ...prev,
            itemsPerPage: Math.max(1, count),
            currentPage: 1, // Reset to first page when changing items per page
        }));
    }, []);

    return {
        currentPage: validCurrentPage,
        totalPages,
        paginatedItems,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        setItemsPerPage,
        startIndex,
        endIndex,
        itemsPerPage: state.itemsPerPage,
    };
}

export default usePagination;
