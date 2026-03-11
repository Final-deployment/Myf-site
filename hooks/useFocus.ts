/**
 * @fileoverview Custom hook for focus management and focus trapping
 * @module hooks/useFocus
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Focus trap options
 */
interface UseFocusTrapOptions {
    /** Whether the focus trap is active */
    isActive?: boolean;
    /** Element to return focus to when trap is deactivated */
    returnFocusTo?: HTMLElement | null;
    /** Auto-focus first focusable element when trap is activated */
    autoFocus?: boolean;
}

/**
 * Focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Custom hook for trapping focus within a container (useful for modals/dialogs)
 * 
 * @param options - Focus trap configuration
 * @returns Ref to attach to the container element
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const containerRef = useFocusTrap({ isActive: isOpen });
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input placeholder="Email" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
    options: UseFocusTrapOptions = {}
): React.RefObject<T> {
    const { isActive = true, returnFocusTo = null, autoFocus = true } = options;
    const containerRef = useRef<T>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // Get all focusable elements in container
    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!containerRef.current) return [];
        const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
        return Array.from(elements).filter((el): el is HTMLElement => (el as HTMLElement).offsetParent !== null);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Store previously focused element
        previouslyFocusedRef.current = document.activeElement as HTMLElement;

        // Auto focus first element
        if (autoFocus) {
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Shift + Tab
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            }
            // Tab
            else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // Return focus to previous element
            const elementToFocus = returnFocusTo || previouslyFocusedRef.current;
            if (elementToFocus && typeof elementToFocus.focus === 'function') {
                elementToFocus.focus();
            }
        };
    }, [isActive, autoFocus, returnFocusTo, getFocusableElements]);

    return containerRef;
}

/**
 * Custom hook for managing focus state
 * 
 * @returns Tuple of [ref, isFocused, focus, blur]
 * 
 * @example
 * ```tsx
 * function Input() {
 *   const [inputRef, isFocused, focus] = useFocus<HTMLInputElement>();
 *   
 *   return (
 *     <div className={isFocused ? 'focused' : ''}>
 *       <input ref={inputRef} />
 *       <button onClick={focus}>Focus Input</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocus<T extends HTMLElement = HTMLElement>(): [
    React.RefObject<T>,
    boolean,
    () => void,
    () => void
] {
    const elementRef = useRef<T>(null);
    const [isFocused, setIsFocused] = useState(false);

    const focus = useCallback(() => {
        elementRef.current?.focus();
    }, []);

    const blur = useCallback(() => {
        elementRef.current?.blur();
    }, []);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);

        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);

        return () => {
            element.removeEventListener('focus', handleFocus);
            element.removeEventListener('blur', handleBlur);
        };
    }, []);

    return [elementRef, isFocused, focus, blur];
}

export default useFocusTrap;
