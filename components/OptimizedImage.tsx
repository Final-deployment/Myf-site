/**
 * OptimizedImage Component
 * 
 * Enhanced image component with:
 * - Lazy loading
 * - Error handling with fallback
 * - Loading placeholder
 * - Blur-up effect
 * 
 * @module components/OptimizedImage
 */

import React, { useState, memo } from 'react';

// ============================================================================
// Types
// ============================================================================

interface OptimizedImageProps {
    /** Image source URL */
    src: string;
    /** Alt text for accessibility */
    alt: string;
    /** Additional CSS classes */
    className?: string;
    /** Width of the image */
    width?: number | string;
    /** Height of the image */
    height?: number | string;
    /** Fallback image URL */
    fallback?: string;
    /** Whether to show loading placeholder */
    showPlaceholder?: boolean;
    /** Object fit style */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    /** Click handler */
    onClick?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Default fallback image (gradient placeholder) */
const DEFAULT_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23064e3b"%3E%3C/stop%3E%3Cstop offset="100%25" style="stop-color:%23065f46"%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g)"%3E%3C/rect%3E%3C/svg%3E';

// ============================================================================
// Component
// ============================================================================

/**
 * Optimized image with lazy loading and fallback
 * 
 * @example
 * <OptimizedImage
 *   src="/course-thumbnail.jpg"
 *   alt="Course thumbnail"
 *   className="w-full h-48 rounded-xl"
 *   fallback="/placeholder.jpg"
 * />
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
    src,
    alt,
    className = '',
    width,
    height,
    fallback = DEFAULT_FALLBACK,
    showPlaceholder = true,
    objectFit = 'cover',
    onClick
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(true);
    };

    const imageSrc = hasError ? fallback : src;

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
            onClick={onClick}
        >
            {/* Loading placeholder */}
            {showPlaceholder && !isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 animate-pulse" />
            )}

            {/* Image */}
            <img
                src={imageSrc}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                className={`
                    w-full h-full transition-opacity duration-300
                    ${isLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                style={{ objectFit }}
            />

            {/* Error overlay */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/30">
                    <span className="text-gray-400 text-sm">
                        📷
                    </span>
                </div>
            )}
        </div>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
