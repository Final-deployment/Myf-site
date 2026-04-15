import { CourseFolder } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const foldersApi = {
    getFolders: async (): Promise<CourseFolder[]> => {
        const response = await fetch(getApiUrl('/folders'));
        if (!response.ok) throw new Error('Failed to fetch folders');
        return await response.json();
    },

    createFolder: async (name: string, thumbnail?: string): Promise<{ success: boolean, id: string }> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/folders'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, thumbnail })
        });
        if (!response.ok) throw new Error('Failed to create folder');
        return await response.json();
    },

    deleteFolder: async (id: string): Promise<{ success: boolean, movedCourses: number }> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/folders/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete folder');
        return await response.json();
    },

    updateFolder: async (id: string, data: { name?: string, thumbnail?: string, order_index?: number }): Promise<{ success: boolean }> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/folders/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update folder');
        return await response.json();
    }
};
