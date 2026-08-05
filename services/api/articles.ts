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
            const data: Article[] = await response.json();
            
            // Map by ID
            const apiMap = new Map((Array.isArray(data) ? data : []).map(a => [a.id, a]));
            
            // Merge with INITIAL_OFFICIAL_ARTICLES so no official article is missing
            for (const official of INITIAL_OFFICIAL_ARTICLES) {
                if (!apiMap.has(official.id)) {
                    apiMap.set(official.id, official as Article);
                }
            }

            const combined = Array.from(apiMap.values());
            // Sort by created_at DESC
            combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return combined;
        } catch {
            return INITIAL_OFFICIAL_ARTICLES as Article[];
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
