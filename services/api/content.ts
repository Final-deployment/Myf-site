/**
 * Content Service (Library Books & Announcements)
 */
import type { Announcement } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const contentApi = {
    // ==================== Books ====================

    getBooks: async (): Promise<any[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/books'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    getBookByCourseId: async (courseId: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/books/course/${courseId}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : null;
    },

    addBook: async (data: { title: string; path: string; courseId?: string }): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/books'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل إضافة الكتاب' }));
            throw new Error(err.error || 'فشل إضافة الكتاب');
        }
        return await response.json();
    },

    updateBook: async (id: string, data: { title: string; path: string; courseId?: string }): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/books/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل تحديث الكتاب' }));
            throw new Error(err.error || 'فشل تحديث الكتاب');
        }
        return await response.json();
    },

    deleteBook: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/books/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل حذف الكتاب' }));
            throw new Error(err.error || 'فشل حذف الكتاب');
        }
    },

    // ==================== Announcements ====================

    getAnnouncements: async (): Promise<Announcement[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/content/announcements'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    },

    addAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/content/announcements'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل إضافة الإعلان' }));
            throw new Error(err.error || 'فشل إضافة الإعلان');
        }
        return await response.json();
    },

    updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/content/announcements/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل تحديث الإعلان' }));
            throw new Error(err.error || 'فشل تحديث الإعلان');
        }
        return await response.json();
    },

    deleteAnnouncement: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/content/announcements/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل حذف الإعلان' }));
            throw new Error(err.error || 'فشل حذف الإعلان');
        }
    }
};
