import { getAuthToken } from './auth';

export interface Initiative {
    id: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
    status: string;
    created_at: string;
}

export const initiativesApi = {
    getAll: async (): Promise<Initiative[]> => {
        const response = await fetch('/api/initiatives');
        if (!response.ok) throw new Error('Failed to fetch initiatives');
        return response.json();
    },

    create: async (data: { title: string; description: string; image?: string; link?: string }): Promise<Initiative> => {
        const token = getAuthToken();
        const response = await fetch('/api/initiatives', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create initiative');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/initiatives/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete initiative');
    }
};
