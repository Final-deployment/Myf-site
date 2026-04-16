/**
 * Authentication Service
 */
import type { User } from '../../types';
import { getApiUrl } from './config';

const STORAGE_PREFIX = 'mastaba_';

export interface ApiError {
    message: string;
    messageAr?: string;
    code?: string;
}

export interface AuthError extends ApiError {
    needsVerification?: boolean;
    email?: string;
}

export const getAuthToken = (): string | undefined => {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) return token;

        const stored = localStorage.getItem(STORAGE_PREFIX + 'currentUser') || sessionStorage.getItem(STORAGE_PREFIX + 'currentUser');
        const user = stored ? JSON.parse(stored) : null;
        return user?.access_token || undefined;
    } catch {
        return undefined;
    }
};

export const authApi = {
    login: async (email: string, password: string, rememberMe: boolean = false): Promise<User | null> => {
        try {
            const response = await fetch(getApiUrl('/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.needsVerification) {
                    const authError: AuthError = {
                        message: errorData.error || 'Email not verified',
                        messageAr: errorData.errorAr,
                        needsVerification: true,
                        email: email
                    };
                    throw authError;
                }
                if (errorData.pendingApproval) {
                    const authError: AuthError & { pendingApproval: boolean } = {
                        message: errorData.error || 'Account pending approval',
                        messageAr: errorData.errorAr,
                        pendingApproval: true
                    };
                    throw authError;
                }
                return null;
            }

            const data = await response.json();
            if (data.accessToken && data.user) {
                const user: User = {
                    ...data.user,
                    access_token: data.accessToken,
                    nameEn: data.user.nameEn || data.user.name,
                    joinDate: data.user.joinDate,
                    emailVerified: !!data.user.emailVerified,
                    supervisorId: data.user.supervisor_id || data.user.supervisorId, // Ensure both cases work
                    supervisorCapacity: data.user.supervisor_capacity || data.user.supervisorCapacity,
                    supervisorPriority: data.user.supervisor_priority || data.user.supervisorPriority,
                };
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
                storage.setItem('authToken', data.accessToken);
                return user;
            }
            return null;
        } catch (error: unknown) {
            if ((error as AuthError).needsVerification) throw error;
            if ((error as any).pendingApproval) throw error;
            return null;
        }
    },

    register: async (userData: any): Promise<{ user: User | null; error: any | null }> => {
        try {
            const response = await fetch(getApiUrl('/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) return { user: null, error: { message: data.error || 'Registration failed', messageAr: data.errorAr } };

            const user: User = { ...data.user, access_token: data.accessToken };
            if (data.accessToken) localStorage.setItem('authToken', data.accessToken);
            return { user, error: null };
        } catch (error: any) {
            return { user: null, error: { message: error.message } };
        }
    },

    verifyOtp: async (email: string, token: string): Promise<{ success: boolean; user: User | null; error: any | null; pendingApproval?: boolean }> => {
        try {
            const response = await fetch(getApiUrl('/verify-email'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: token })
            });
            const data = await response.json();
            if (!response.ok) return { success: false, user: null, error: data.errorAr || data.error };

            // If pending approval, do NOT save user data or token — just return success
            if (data.pendingApproval) {
                return { success: true, user: null, error: null, pendingApproval: true };
            }

            // Guard: if server returned success but no user object, treat as pendingApproval
            if (!data.user) {
                return { success: true, user: null, error: null, pendingApproval: true };
            }

            const user = {
                ...data.user,
                access_token: data.accessToken,
                supervisorId: data.user.supervisor_id || data.user.supervisorId,
                supervisorCapacity: data.user.supervisor_capacity || data.user.supervisorCapacity,
                supervisorPriority: data.user.supervisor_priority || data.user.supervisorPriority,
            };
            localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(user));
            return { success: true, user, error: null };
        } catch (error: any) {
            return { success: false, user: null, error: { message: error.message } };
        }
    },

    resendOtp: async (email: string): Promise<{ error: any | null }> => {
        try {
            const response = await fetch(getApiUrl('/resend-otp'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!response.ok) {
                const data = await response.json();
                return { error: data.errorAr || data.error };
            }
            return { error: null };
        } catch (error: any) {
            return { error: { message: error.message } };
        }
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; error: any | null }> => {
        try {
            const response = await fetch(getApiUrl('/forgot-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) return { success: false, error: data.errorAr || data.error };
            return { success: true, error: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    resetPassword: async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; error: any | null }> => {
        try {
            const response = await fetch(getApiUrl('/reset-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await response.json();
            if (!response.ok) return { success: false, error: data.errorAr || data.error };
            return { success: true, error: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    getCurrentUser: (): User | null => {
        try {
            const stored = localStorage.getItem(STORAGE_PREFIX + 'currentUser') || sessionStorage.getItem(STORAGE_PREFIX + 'currentUser');
            if (!stored) return null;
            
            const user = JSON.parse(stored);
            
            // Validate required fields to prevent crashes from corrupted data
            if (!user || typeof user !== 'object' || !user.id || !user.role || !user.email) {
                console.warn('[Auth] Corrupted user data detected in storage. Clearing...');
                localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
                sessionStorage.removeItem(STORAGE_PREFIX + 'currentUser');
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                return null;
            }
            
            return user;
        } catch (e) {
            console.error('[Auth] Failed to parse stored user data:', e);
            // Clear corrupted data
            localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
            sessionStorage.removeItem(STORAGE_PREFIX + 'currentUser');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            return null;
        }
    },

    logout: (): void => {
        localStorage.removeItem(STORAGE_PREFIX + 'currentUser');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem(STORAGE_PREFIX + 'currentUser');
        sessionStorage.removeItem('authToken');
    }
};
