/**
 * User Service
 */
import type { User } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

const STORAGE_PREFIX = 'mastaba_';

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface CreateUserInput {
    email: string;
    password?: string;
    name: string;
    nameEn?: string;
    whatsapp?: string;
    country?: string;
    age?: number;
    gender?: string;
    educationLevel?: string;
    role?: string;
    status?: string;
    joinDate?: string;
    points?: number;
    level?: number;
    streak?: number;
    avatar?: string;
}

export const usersApi = {
    getUsers: async (page?: number, limit?: number, search?: string, role?: string): Promise<User[] | PaginatedResponse<User>> => {
        const token = getAuthToken();
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (search) queryParams.append('search', search);
        if (role) queryParams.append('role', role);

        const url = `${getApiUrl('/users')}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return page ? { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } } : [];
        return await response.json();
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/users/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) return null;

        const stored = localStorage.getItem(STORAGE_PREFIX + 'currentUser');
        const currentUser = stored ? JSON.parse(stored) : null;
        if (currentUser && currentUser.id === id) {
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(updatedUser));
            return updatedUser;
        }
        return null;
    },

    // Create User (Admin)
    createUser: async (userData: CreateUserInput): Promise<User | null> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/users'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create user');
        }
        return await response.json();
    },

    deleteUser: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/users/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete user');
    },

    getStudents: async (page?: number, limit?: number, search?: string): Promise<User[] | PaginatedResponse<User>> => {
        const token = getAuthToken();
        const queryParams = new URLSearchParams();
        if (page) queryParams.append('page', page.toString());
        if (limit) queryParams.append('limit', limit.toString());
        if (search) queryParams.append('search', search);

        const url = `${getApiUrl('/users/students')}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return page ? { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } } : [];
        return await response.json();
    },

    getFavorites: async (userId: string): Promise<any[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/users/${userId}/favorites`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    },

    toggleFavorite: async (userId: string, targetId: string | number, type: string): Promise<{ action: string; success: boolean } | null> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/users/${userId}/favorites/toggle`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetId, type })
        });
        if (!response.ok) return null;
        return await response.json();
    },

    getUserDetails: async (id: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/users/${id}/details?_t=${Date.now()}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user details');
        return await response.json();
    }
};
