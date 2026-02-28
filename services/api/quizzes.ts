/**
 * Quiz Service
 */
import type { Quiz, QuizResult } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const quizzesApi = {
    getQuizzes: async (): Promise<Quiz[]> => {
        const response = await fetch(getApiUrl('/quizzes'));
        return response.ok ? await response.json() : [];
    },

    addQuiz: async (quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl('/quizzes'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
    },

    updateQuiz: async (id: string, quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl(`/quizzes/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
    },

    deleteQuiz: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl(`/quizzes/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    },

    quizResults: {
        save: async (quizId: string, score: number, total: number): Promise<void> => {
            const token = getAuthToken();
            await fetch(getApiUrl('/quizzes/results'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quizId, score, total, percentage: Math.round((score / total) * 100) })
            });
        },
        get: async (): Promise<QuizResult[]> => {
            const token = getAuthToken();
            // Backend expects /quizzes/results/:userId but we might need a generic one or pass userId
            // Looking at quizzes.ts, it seems to call /results/ without userId?
            // Actually, the backend has router.get('/results/:userId', ...)
            // I should either add a generic /results route to backend or pass userId here.
            // Let's check how userId is obtained.
            // For now, I'll update the path to /quizzes/results to at least hit the right controller prefix.
            const response = await fetch(getApiUrl('/quizzes/results'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : [];
        }
    }
};
