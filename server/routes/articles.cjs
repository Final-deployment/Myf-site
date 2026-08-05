const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const crypto = require('crypto');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Get all articles (public)
router.get('/', (req, res) => {
    try {
        const articles = db.prepare(`
            SELECT a.*, u.name as author_name 
            FROM articles a
            LEFT JOIN users u ON a.author_id = u.id
            ORDER BY a.created_at DESC
        `).all();
        const sanitized = articles.map(art => ({
            ...art,
            author_name: (!art.author_name || art.author_name === 'محمد العايدي') ? 'إدارة الملتقى' : art.author_name
        }));
        res.json(sanitized);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

// Get article by ID (public)
router.get('/:id', (req, res) => {
    try {
        const article = db.prepare(`
            SELECT a.*, u.name as author_name 
            FROM articles a
            LEFT JOIN users u ON a.author_id = u.id
            WHERE a.id = ?
        `).get(req.params.id);
        
        if (!article) return res.status(404).json({ error: 'Article not found' });
        if (!article.author_name || article.author_name === 'محمد العايدي') {
            article.author_name = 'إدارة الملتقى';
        }
        res.json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// Create article (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, image } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = 'article_' + crypto.randomBytes(8).toString('hex');
    
    try {
        db.prepare(`
            INSERT INTO articles (id, title, content, image, author_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, title, content, image || null, req.user.id);
        
        const newArticle = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

// Delete article (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

module.exports = router;
