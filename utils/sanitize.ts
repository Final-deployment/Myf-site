/**
 * Utility functions for input sanitization and XSS prevention
 * @module utils/sanitize
 */

/**
 * HTML entities map for escaping special characters
 */
const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

/**
 * Sanitizes a string by escaping HTML special characters
 * Prevents XSS attacks by converting dangerous characters to HTML entities
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string safe for HTML rendering
 * 
 * @example
 * sanitizeHTML('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 */
export const sanitizeHTML = (input: string): string => {
    if (typeof input !== 'string') {
        return '';
    }
    return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Removes all HTML tags from a string
 * Useful for plain text fields that should never contain HTML
 * 
 * @param input - The string to strip tags from
 * @returns Plain text string without HTML tags
 * 
 * @example
 * stripTags('<p>Hello <b>World</b></p>')
 * // Returns: 'Hello World'
 */
export const stripTags = (input: string): string => {
    if (typeof input !== 'string') {
        return '';
    }
    return input.replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes an object by applying sanitization to all string values
 * Recursively processes nested objects
 * 
 * @param obj - The object to sanitize
 * @returns New object with sanitized string values
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
    const sanitized: Record<string, unknown> = {};

    // Fields that should NOT be HTML-escaped (URLs, etc.)
    const urlFields = ['videoUrl', 'thumbnail', 'avatar', 'url', 'imageUrl', 'src', 'href'];

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            // Skip HTML encoding for URL fields - just use sanitizeURL instead
            if (urlFields.includes(key) || key.toLowerCase().includes('url')) {
                sanitized[key] = sanitizeURL(value);
            } else {
                sanitized[key] = sanitizeHTML(value);
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeHTML(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
};

/**
 * Validates and sanitizes an email address
 * 
 * @param email - Email address to validate
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
    if (typeof email !== 'string') {
        return '';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = email.trim().toLowerCase();
    return emailRegex.test(trimmed) ? trimmed : '';
};

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks
 * 
 * @param url - URL to sanitize
 * @returns Safe URL or empty string if potentially dangerous
 */
export const sanitizeURL = (url: string): string => {
    if (typeof url !== 'string') {
        return '';
    }
    const trimmed = url.trim();
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = trimmed.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return '';
        }
    }

    return trimmed;
};

export default {
    sanitizeHTML,
    stripTags,
    sanitizeObject,
    sanitizeEmail,
    sanitizeURL
};
