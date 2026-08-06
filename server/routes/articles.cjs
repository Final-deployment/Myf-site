const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const crypto = require('crypto');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Get all articles (public)
router.get('/', (req, res) => {
    try {
        try {
            const officialArticles = require('../officialArticles.cjs');
            const insertArt = db.prepare('INSERT OR REPLACE INTO articles (id, title, content, image, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            for (const art of officialArticles) {
                insertArt.run(art.id, art.title, art.content, art.image || null, art.author_id || 'admin_mohammad', art.created_at);
            }
        } catch (e) {
            console.error('Auto sync articles error:', e);
        }

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

// Helper middleware to check if request is from JWT admin OR secret portal token
const authenticateAdminOrPortalToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === 'authenticated_token_2026' || token === 'myf_forum_2026') {
            req.user = { id: 'admin_portal', name: 'إدارة ملتقى الشباب المسلم', role: 'admin' };
            return next();
        }
    }
    // Fallback to standard JWT admin middleware
    return authenticateToken(req, res, (err) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        return requireAdmin(req, res, next);
    });
};

// Create article (admin or secret portal token)
router.post('/', authenticateAdminOrPortalToken, (req, res) => {
    const { title, content, image } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
    }

    const id = 'article_' + crypto.randomBytes(8).toString('hex');
    const createdAt = new Date().toISOString();
    const authorId = req.user ? req.user.id : 'admin_portal';
    
    try {
        db.prepare(`
            INSERT INTO articles (id, title, content, image, author_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, title, content, image || null, authorId, createdAt);
        
        const newArticle = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        console.log(`[Articles DB] Created new article: ${id} - ${title}`);
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

// Update article (admin or secret portal token)
router.put('/:id', authenticateAdminOrPortalToken, (req, res) => {
    const { title, content, image } = req.body;
    const { id } = req.params;

    if (!title || !content) {
        return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
    }

    try {
        db.prepare(`
            UPDATE articles
            SET title = ?, content = ?, image = ?
            WHERE id = ?
        `).run(title, content, image || null, id);

        const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
        console.log(`[Articles DB] Updated article: ${id}`);
        res.json(updated);
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

// Delete article (admin or secret portal token)
router.delete('/:id', authenticateAdminOrPortalToken, (req, res) => {
    try {
        db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
        console.log(`[Articles DB] Deleted article: ${req.params.id}`);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

module.exports = router;
