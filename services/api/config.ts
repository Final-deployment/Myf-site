/**
 * API Configuration
 */

// In development with Vite proxy, we use /api
// In production (Android APK), we use the full URL
export const API_BASE_URL = import.meta.env.PROD && !window.location.host.includes('localhost')
    ? 'https://muslimyouth.ps/api'
    : '/api';

export const getApiUrl = (endpoint: string) => {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // For mobile builds (Capacitor with androidScheme: 'https'), 
    // window.location.origin will be 'https://localhost'
    // Also check for capacitor:// scheme and production builds not on the real server
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        const isCapacitor = origin.includes('capacitor://') ||
            origin === 'https://localhost' ||
            origin === 'http://localhost';
        if (isCapacitor) {
            return `https://muslimyouth.ps/api${cleanEndpoint}`;
        }
    }

    return `${API_BASE_URL}${cleanEndpoint}`;
};
