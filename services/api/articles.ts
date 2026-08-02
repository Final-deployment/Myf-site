import { getAuthToken } from './auth';

export interface Article {
    id: string;
    title: string;
    content: string;
    image?: string;
    author_id: string;
    author_name?: string;
    created_at: string;
}

export const articlesApi = {
    getAll: async (): Promise<Article[]> => {
        const response = await fetch('/api/articles');
        if (!response.ok) throw new Error('Failed to fetch articles');
        return response.json();
    },

    create: async (data: { title: string; content: string; image?: string }): Promise<Article> => {
        const token = getAuthToken();
        const response = await fetch('/api/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create article');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(`/api/articles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete article');
    }
};
