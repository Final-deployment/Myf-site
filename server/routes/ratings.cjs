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

        const processedRatings = ratings.map(rating => {
            const replies = db.prepare('SELECT * FROM rating_replies WHERE ratingId = ? ORDER BY createdAt ASC').all(rating.id);
            return { ...rating, replies };
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
    const userName = req.user.name;

    try {
        // Fetch user country for display
        const user = db.prepare('SELECT country FROM users WHERE id = ?').get(userId);
        const country = user ? user.country : '';

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
    const userName = req.user.name;
    const role = req.user.role;

    try {
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
        db.prepare('DELETE FROM ratings WHERE id = ?').run(id);
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
