/**
 * Quizzes Routes Module
 * 
 * Handles quiz CRUD and results.
 * - GET quizzes: Public (for course learning)
 * - POST/PUT/DELETE quizzes: Admin only
 * - POST results: Authenticated users
 * 
 * @module server/routes/quizzes
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// ============================================================================
// Get all quizzes (Public - needed for course learning)
// ============================================================================
router.get('/', (req, res) => {
    try {
        const quizzes = db.prepare('SELECT * FROM quizzes').all();
        res.json(quizzes.map(q => ({
            ...q,
            questions: JSON.parse(q.questions || '[]'),
            passingScore: q.passing_score || 70,
            titleEn: q.title_en || q.title
        })));
    } catch (e) {
        console.error('[QUIZZES_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// ============================================================================
// Create Quiz (Admin Only)
// ============================================================================
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { id, title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;

    if (!id || !title || !courseId) {
        return res.status(400).json({ error: 'Missing required fields: id, title, courseId' });
    }

    try {
        db.prepare(`
            INSERT INTO quizzes (id, title, title_en, courseId, questions, passing_score, afterEpisodeIndex, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, titleEn || title, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex || 0, description || '');

        console.log(`[QUIZ_CREATED] Admin ${req.user.id} created quiz: ${id}`);
        res.status(201).json({ success: true, id });
    } catch (e) {
        console.error('[QUIZ_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

// ============================================================================
// Update Quiz (Admin Only)
// ============================================================================
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;

    try {
        const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        db.prepare(`
            UPDATE quizzes 
            SET title = ?, title_en = ?, courseId = ?, questions = ?, passing_score = ?, afterEpisodeIndex = ?, description = ?
            WHERE id = ?
        `).run(title, titleEn || title, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex || 0, description || '', id);

        console.log(`[QUIZ_UPDATED] Admin ${req.user.id} updated quiz: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[QUIZ_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to update quiz' });
    }
});

// ============================================================================
// Delete Quiz (Admin Only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        console.log(`[QUIZ_DELETED] Admin ${req.user.id} deleted quiz: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[QUIZ_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// ============================================================================
// Save quiz results (Authenticated Users)
// ============================================================================
router.post('/results', authenticateToken, (req, res) => {
    const { quizId, score, total, percentage } = req.body;
    const userId = req.user.id; // Use authenticated user's ID

    if (!quizId || score === undefined || total === undefined || percentage === undefined) {
        return res.status(400).json({ error: 'Missing required fields: quizId, score, total, percentage' });
    }

    try {
        // SECURITY: Check enrollment deadline
        const quiz = db.prepare('SELECT courseId FROM quizzes WHERE id = ?').get(quizId);
        if (quiz && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            const enrollment = db.prepare('SELECT progress, completed, deadline, is_locked FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, quiz.courseId);
            if (enrollment) {
                let locked = enrollment.is_locked;
                if (!locked && enrollment.deadline && new Date() > new Date(enrollment.deadline) && enrollment.progress < 100 && !enrollment.completed) {
                    db.prepare('UPDATE enrollments SET is_locked = 1 WHERE user_id = ? AND course_id = ?').run(userId, quiz.courseId);
                    locked = 1;
                }
                if (locked) {
                    return res.status(403).json({ error: 'انتهت الفترة المتاحة لدراسة المساق، يرجى مراجعة المشرف للتقديم.', isLockedOut: true });
                }
            }
        }

        db.prepare(`
            INSERT INTO quiz_results (id, userId, quizId, score, total, percentage, completedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('res_' + crypto.randomUUID(), userId, quizId, score, total, percentage, new Date().toISOString());

        res.status(201).json({ success: true });
    } catch (e) {
        console.error('[QUIZ_RESULT_SAVE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
});

// ============================================================================
// Get current user's quiz results (Authenticated Users)
// ============================================================================
router.get('/results', authenticateToken, (req, res) => {
    try {
        const results = db.prepare(`
            SELECT qr.*, q.title as quizTitle 
            FROM quiz_results qr 
            JOIN quizzes q ON qr.quizId = q.id 
            WHERE qr.userId = ?
            ORDER BY qr.completedAt DESC
        `).all(req.user.id);

        res.json(results);
    } catch (e) {
        console.error('[QUIZ_RESULTS_GET_OWN_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch your quiz results' });
    }
});

// ============================================================================
// Get specific user's quiz results (Admin Only or Self)
// ============================================================================
router.get('/results/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;

    // Users can only view their own results (or admin can view any)
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const results = db.prepare(`
            SELECT qr.*, q.title as quizTitle 
            FROM quiz_results qr 
            JOIN quizzes q ON qr.quizId = q.id 
            WHERE qr.userId = ?
            ORDER BY qr.completedAt DESC
        `).all(userId);

        res.json(results);
    } catch (e) {
        console.error('[QUIZ_RESULTS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch quiz results' });
    }
});

module.exports = router;
