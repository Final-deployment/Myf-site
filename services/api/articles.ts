import { getAuthToken } from './auth';
import { INITIAL_OFFICIAL_ARTICLES } from './officialArticles';

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
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('Failed to fetch articles');
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
            return INITIAL_OFFICIAL_ARTICLES;
        } catch {
            return INITIAL_OFFICIAL_ARTICLES;
        }
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
