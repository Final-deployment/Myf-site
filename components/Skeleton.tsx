/**
 * Skeleton Loading Components
 * 
 * Provides skeleton loading placeholders for better UX during content loading.
 * Uses shimmer animation defined in src/index.css.
 * 
 * @module components/Skeleton
 */

import React, { memo } from 'react';

// ============================================================================
// Base Skeleton Component
// ============================================================================

interface SkeletonProps {
    /** Width of the skeleton (Tailwind class or custom) */
    width?: string;
    /** Height of the skeleton (Tailwind class or custom) */
    height?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether skeleton is circular */
    rounded?: boolean;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = memo(({
    width = 'w-full',
    height = 'h-4',
    className = '',
    rounded = false
}) => (
    <div
        className={`skeleton ${width} ${height} ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
        aria-hidden="true"
        role="presentation"
    />
));

Skeleton.displayName = 'Skeleton';

// ============================================================================
// Skeleton Text Lines
// ============================================================================

interface SkeletonTextProps {
    /** Number of lines to show */
    lines?: number;
    /** Whether last line should be shorter */
    lastLineShorter?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Skeleton for text paragraphs
 */
export const SkeletonText: React.FC<SkeletonTextProps> = memo(({
    lines = 3,
    lastLineShorter = true,
    className = ''
}) => (
    <div className={`space-y-2 ${className}`} aria-hidden="true" role="presentation">
        {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
                key={index}
                width={lastLineShorter && index === lines - 1 ? 'w-3/4' : 'w-full'}
                height="h-3"
            />
        ))}
    </div>
));

SkeletonText.displayName = 'SkeletonText';

// ============================================================================
// Skeleton Card
// ============================================================================

interface SkeletonCardProps {
    /** Whether to show image placeholder */
    showImage?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Skeleton for course/content cards
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = memo(({
    showImage = true,
    className = ''
}) => (
    <div
        className={`glass-panel p-0 rounded-2xl overflow-hidden ${className}`}
        aria-hidden="true"
        role="presentation"
    >
        {showImage && (
            <Skeleton width="w-full" height="h-48" className="rounded-none" />
        )}
        <div className="p-5 space-y-3">
            <Skeleton width="w-2/3" height="h-5" />
            <Skeleton width="w-1/2" height="h-3" />
            <div className="flex justify-between pt-2">
                <Skeleton width="w-16" height="h-3" />
                <Skeleton width="w-16" height="h-3" />
            </div>
        </div>
    </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// ============================================================================
// Skeleton Dashboard
// ============================================================================

/**
 * Full dashboard skeleton for initial load
 */
export const SkeletonDashboard: React.FC = memo(() => (
    <div className="space-y-6 animate-fade-in" aria-hidden="true" role="presentation">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                            <Skeleton width="w-24" height="h-3" />
                            <Skeleton width="w-16" height="h-8" />
                        </div>
                        <Skeleton width="w-12" height="h-12" rounded />
                    </div>
                </div>
            ))}
        </div>

        {/* Badges Section */}
        <div className="glass-panel rounded-2xl p-4">
            <Skeleton width="w-32" height="h-5" className="mb-4" />
            <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton width="w-12" height="h-12" rounded />
                        <Skeleton width="w-16" height="h-2" />
                    </div>
                ))}
            </div>
        </div>

        {/* Course Cards */}
        <div>
            <Skeleton width="w-40" height="h-6" className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    </div>
));

SkeletonDashboard.displayName = 'SkeletonDashboard';

// ============================================================================
// Skeleton List Item
// ============================================================================

/**
 * Skeleton for list items (e.g., students list, notifications)
 */
export const SkeletonListItem: React.FC = memo(() => (
    <div
        className="flex items-center gap-4 p-4 glass-panel rounded-xl"
        aria-hidden="true"
        role="presentation"
    >
        <Skeleton width="w-12" height="h-12" rounded />
        <div className="flex-1 space-y-2">
            <Skeleton width="w-1/3" height="h-4" />
            <Skeleton width="w-1/2" height="h-3" />
        </div>
        <Skeleton width="w-20" height="h-8" />
    </div>
));

SkeletonListItem.displayName = 'SkeletonListItem';

// ============================================================================
// Skeleton Table
// ============================================================================

interface SkeletonTableProps {
    /** Number of rows to show */
    rows?: number;
    /** Number of columns */
    columns?: number;
}

/**
 * Skeleton for table content
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = memo(({
    rows = 5,
    columns = 4
}) => (
    <div className="space-y-2" aria-hidden="true" role="presentation">
        {/* Header */}
        <div className="flex gap-4 p-4 bg-white/5 rounded-lg">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} width="flex-1" height="h-4" />
            ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 p-4 border-b border-white/5">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton
                        key={colIndex}
                        width="flex-1"
                        height="h-4"
                    />
                ))}
            </div>
        ))}
    </div>
));

SkeletonTable.displayName = 'SkeletonTable';

// ============================================================================
// Export All Components
// ============================================================================

export default {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonDashboard,
    SkeletonListItem,
    SkeletonTable
};
