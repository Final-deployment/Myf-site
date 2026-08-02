const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');

// GET /api/ratings - Fetch all ratings with their replies
router.get('/', async (req, res) => {
    try {
        const ratings = db.prepare(`
            SELECT r.*, u.avatar as userAvatar 
            FROM ratings r
            LEFT JOIN users u ON r.userId = u.id
            ORDER BY r.createdAt DESC
        `).all();

        const allReplies = db.prepare('SELECT * FROM rating_replies ORDER BY createdAt ASC').all();
        const repliesByRating = new Map();
        for (const reply of allReplies) {
            if (!repliesByRating.has(reply.ratingId)) {
                repliesByRating.set(reply.ratingId, []);
            }
            repliesByRating.get(reply.ratingId).push(reply);
        }

        const processedRatings = ratings.map(rating => {
            return { ...rating, replies: repliesByRating.get(rating.id) || [] };
        });

        res.json(processedRatings);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/ratings - Submit a new rating
router.post('/', authenticateToken, (req, res) => {
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    try {
        // Fix: Fetch name + country in one query (was 2 separate queries)
        const userRecord = db.prepare('SELECT name, country FROM users WHERE id = ?').get(userId);
        const userName = userRecord?.name || 'مستخدم';
        const country = userRecord?.country || '';

        const id = 'rate_' + crypto.randomUUID();
        db.prepare(`
            INSERT INTO ratings (id, userId, userName, userCountry, rating, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, userId, userName, country, rating, comment);

        res.status(201).json({ id, userId, userName, userCountry: country, rating, comment });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/ratings/:id/reply - Reply to a rating
router.post('/:id/reply', authenticateToken, (req, res) => {
    const { id: ratingId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        const ratingExists = db.prepare('SELECT id FROM ratings WHERE id = ?').get(ratingId);
        if (!ratingExists) {
            return res.status(404).json({ error: 'التقييم غير موجود' });
        }

        // Fix: Fetch name from DB — JWT payload does not contain 'name'
        const userRecord = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
        const userName = userRecord?.name || 'مستخدم';

        const id = 'reply_' + crypto.randomUUID();
        db.prepare(`
            INSERT INTO rating_replies (id, ratingId, userId, userName, role, content)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, ratingId, userId, userName, role, content);

        res.status(201).json({ id, ratingId, userId, userName, role, content });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/ratings/:id - Delete a rating (Admin/Supervisor only)
router.delete('/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'Unauthorized to delete ratings' });
    }

    const { id } = req.params;
    try {
        db.transaction(() => {
            db.prepare('DELETE FROM rating_replies WHERE ratingId = ?').run(id);
            db.prepare('DELETE FROM ratings WHERE id = ?').run(id);
        })();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/ratings/reply/:replyId - Delete a reply (Admin/Supervisor only)
router.delete('/reply/:replyId', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'Unauthorized to delete replies' });
    }

    const { replyId } = req.params;
    try {
        db.prepare('DELETE FROM rating_replies WHERE id = ?').run(replyId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
