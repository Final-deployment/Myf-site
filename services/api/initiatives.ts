import { getAuthToken } from './auth';

export interface InitiativeActivity {
    id: string;
    initiative_id: string;
    title: string;
    date?: string;
    description: string;
    images?: string[];
    created_at?: string;
}

export interface Initiative {
    id: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
    status?: string;
    created_at?: string;
    activities?: InitiativeActivity[];
}

const getEffectiveToken = () => {
    const portalToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('myf_forum_admin_auth') : null;
    if (portalToken) return 'authenticated_token_2026';
    return getAuthToken() || 'authenticated_token_2026';
};

export const initiativesApi = {
    getAll: async (): Promise<Initiative[]> => {
        try {
            const response = await fetch('/api/initiatives');
            if (!response.ok) throw new Error('Failed to fetch initiatives');
            return response.json();
        } catch {
            return [];
        }
    },

    getById: async (id: string): Promise<Initiative | null> => {
        try {
            const response = await fetch(`/api/initiatives/${id}`);
            if (!response.ok) return null;
            return response.json();
        } catch {
            return null;
        }
    },

    create: async (data: { title: string; description: string; image?: string; link?: string }): Promise<Initiative> => {
        const token = getEffectiveToken();
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

    update: async (id: string, data: { title: string; description: string; image?: string; link?: string }): Promise<Initiative> => {
        const token = getEffectiveToken();
        const response = await fetch(`/api/initiatives/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update initiative');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const token = getEffectiveToken();
        const response = await fetch(`/api/initiatives/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete initiative');
    },

    // --- Activities API ---
    addActivity: async (initiativeId: string, data: { title: string; description: string; date?: string; images?: string[] }): Promise<InitiativeActivity> => {
        const token = getEffectiveToken();
        const response = await fetch(`/api/initiatives/${initiativeId}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to add activity');
        return response.json();
    },

    updateActivity: async (actId: string, data: { title: string; description: string; date?: string; images?: string[] }): Promise<InitiativeActivity> => {
        const token = getEffectiveToken();
        const response = await fetch(`/api/initiatives/activities/${actId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update activity');
        return response.json();
    },

    deleteActivity: async (actId: string): Promise<void> => {
        const token = getEffectiveToken();
        const response = await fetch(`/api/initiatives/activities/${actId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete activity');
    }
};
