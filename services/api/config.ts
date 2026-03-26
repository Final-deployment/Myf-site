/**
 * API Configuration
 */

// Check if running inside Capacitor (mobile app)
const isCapacitorApp = typeof window !== 'undefined' && (
    window.location.origin.includes('capacitor://') ||
    window.location.origin === 'https://localhost' ||
    window.location.origin === 'http://localhost'
);

// For Capacitor (mobile app), use the full URL
// For browser (same server), always use relative /api path
export const API_BASE_URL = isCapacitorApp
    ? 'https://muslimyouth.ps/api'
    : '/api';

export const getApiUrl = (endpoint: string) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (isCapacitorApp) {
        return `https://muslimyouth.ps/api${cleanEndpoint}`;
    }

    return `${API_BASE_URL}${cleanEndpoint}`;
};

