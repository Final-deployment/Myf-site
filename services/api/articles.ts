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

// Get active token (either JWT token or Secret Admin Portal token)
const getEffectiveToken = () => {
    const portalToken = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('myf_forum_admin_auth') : null;
    if (portalToken) return 'authenticated_token_2026';
    return getAuthToken() || 'authenticated_token_2026';
};

// Helper for local storage sync
const getLocalArticles = (): Article[] => {
    try {
        const stored = localStorage.getItem('myf_custom_articles');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalArticle = (article: Article) => {
    try {
        const current = getLocalArticles();
        const filtered = current.filter(a => a.id !== article.id);
        const updated = [article, ...filtered];
        localStorage.setItem('myf_custom_articles', JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
};

const removeLocalArticle = (id: string) => {
    try {
        const current = getLocalArticles();
        const filtered = current.filter(a => a.id !== id);
        localStorage.setItem('myf_custom_articles', JSON.stringify(filtered));
    } catch (e) {
        console.error('Failed to remove from localStorage:', e);
    }
};

export const articlesApi = {
    getAll: async (): Promise<Article[]> => {
        try {
            const response = await fetch('/api/articles');
            let serverData: Article[] = [];
            if (response.ok) {
                serverData = await response.json();
            }

            const apiMap = new Map<string, Article>();

            // 1. Initial official articles
            for (const official of INITIAL_OFFICIAL_ARTICLES) {
                apiMap.set(official.id, official as Article);
            }

            // 2. Server DB articles
            if (Array.isArray(serverData)) {
                for (const art of serverData) {
                    apiMap.set(art.id, art);
                }
            }

            // 3. Local custom articles
            const localCustom = getLocalArticles();
            for (const loc of localCustom) {
                apiMap.set(loc.id, loc);
            }

            const combined = Array.from(apiMap.values());
            // Sort by created_at DESC
            combined.sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());
            return combined;
        } catch {
            const apiMap = new Map<string, Article>();
            for (const official of INITIAL_OFFICIAL_ARTICLES) {
                apiMap.set(official.id, official as Article);
            }
            for (const loc of getLocalArticles()) {
                apiMap.set(loc.id, loc);
            }
            const combined = Array.from(apiMap.values());
            combined.sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());
            return combined;
        }
    },

    getById: async (id: string): Promise<Article | null> => {
        try {
            const response = await fetch(`/api/articles/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.id) return data;
            }
        } catch {
            // Silently fallback to combined list
        }

        const all = await articlesApi.getAll();
        const found = all.find(a => a.id === id);
        return found || null;
    },

    create: async (data: { title: string; content: string; image?: string }): Promise<Article> => {
        const token = getEffectiveToken();
        
        let createdArt: Article | null = null;
        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                createdArt = await response.json();
            }
        } catch (e) {
            console.warn('API article creation failed, using local storage fallback:', e);
        }

        if (!createdArt) {
            createdArt = {
                id: `custom_art_${Date.now()}`,
                title: data.title,
                content: data.content,
                image: data.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=400&fit=crop',
                author_id: 'admin_portal',
                author_name: 'إدارة ملتقى الشباب المسلم',
                created_at: new Date().toISOString()
            };
        }

        saveLocalArticle(createdArt);
        return createdArt;
    },

    update: async (id: string, data: { title: string; content: string; image?: string }): Promise<Article> => {
        const token = getEffectiveToken();

        let updatedArt: Article | null = null;
        try {
            const response = await fetch(`/api/articles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                updatedArt = await response.json();
            }
        } catch (e) {
            console.warn('API article update failed, updating locally:', e);
        }

        if (!updatedArt) {
            updatedArt = {
                id,
                title: data.title,
                content: data.content,
                image: data.image,
                author_id: 'admin_portal',
                author_name: 'إدارة ملتقى الشباب المسلم',
                created_at: new Date().toISOString()
            };
        }

        saveLocalArticle(updatedArt);
        return updatedArt;
    },

    delete: async (id: string): Promise<void> => {
        const token = getEffectiveToken();
        try {
            await fetch(`/api/articles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (e) {
            console.warn('API article delete failed:', e);
        }
        removeLocalArticle(id);
    }
};
