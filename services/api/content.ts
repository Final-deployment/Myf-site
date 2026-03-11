/**
 * Content Service (Announcements & Library)
 */
import type { Announcement, LibraryResource } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const contentApi = {
    getLibraryResources: async (): Promise<LibraryResource[]> => {
        const response = await fetch(getApiUrl('/books'));
        return response.ok ? await response.json() : [];
    },

    getBooks: async (): Promise<any[]> => {
        const response = await fetch(getApiUrl('/books'));
        return response.ok ? await response.json() : [];
    },

    getBookByCourseId: async (courseId: string): Promise<any> => {
        const response = await fetch(getApiUrl(`/books/course/${courseId}`));
        return response.ok ? await response.json() : null;
    },

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
            const error = await response.json();
            throw new Error(error.error || 'Failed to add announcement');
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
            const error = await response.json();
            throw new Error(error.error || 'Failed to update announcement');
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
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete announcement');
        }
    }
};
