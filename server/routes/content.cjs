/**
 * Content Routes Module
 * 
 * Handles library resources and announcements.
 * - GET routes: Public
 * - POST routes: Admin only
 * 
 * @module server/routes/content
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');
const { generateDownloadUrl } = require('../r2.cjs');

// ============================================================================
// Library Resources (Public GET, Admin POST)
// ============================================================================
router.get('/library', async (req, res) => {
    try {
        const resources = db.prepare('SELECT * FROM library_resources ORDER BY createdAt DESC').all();

        // Sign URLs if they are R2 keys or contain R2 patterns
        const signedResources = await Promise.all(resources.map(async (res) => {
            if (res.url) {
                try {
                    // If it's a full URL including our R2 domain, extract the key
                    const uploadsIdx = res.url.indexOf('Books/');
                    const genIdx = res.url.indexOf('uploads/');
                    const targetIdx = uploadsIdx !== -1 ? uploadsIdx : genIdx;

                    if (targetIdx !== -1) {
                        const key = res.url.substring(targetIdx);
                        res.url = await generateDownloadUrl(key);
                    }
                } catch (e) {
                    console.error('Failed to sign library URL:', res.id, e);
                }
            }
            return res;
        }));

        res.json(signedResources);
    } catch (e) {
        console.error('[LIBRARY_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch library resources' });
    }
});

router.post('/library', authenticateToken, requireAdmin, (req, res) => {
    const { title, type, url, description, thumbnail } = req.body;

    if (!title || !type || !url) {
        return res.status(400).json({ error: 'Missing required fields: title, type, url' });
    }

    try {
        const id = 'resource_' + crypto.randomUUID();
        db.prepare(`
            INSERT INTO library_resources (id, title, type, url, description, thumbnail, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, type, url, description || '', thumbnail || '', new Date().toISOString());

        console.log(`[LIBRARY_RESOURCE_CREATED] Admin ${req.user.id} created resource: ${id}`);
        res.status(201).json({ success: true, id });
    } catch (e) {
        console.error('[LIBRARY_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create library resource' });
    }
});

// ============================================================================
// Announcements (Public GET, Admin POST)
// ============================================================================
router.get('/announcements', (req, res) => {
    try {
        const announcements = db.prepare('SELECT * FROM announcements ORDER BY date DESC').all();
        res.json(announcements);
    } catch (e) {
        console.error('[ANNOUNCEMENTS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

router.post('/announcements', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, type } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Missing required fields: title, content' });
    }

    try {
        const id = 'ann_' + crypto.randomUUID();
        const date = new Date().toISOString().split('T')[0];

        db.prepare('INSERT INTO announcements (id, title, content, type, date) VALUES (?, ?, ?, ?, ?)')
            .run(id, title, content, type || 'info', date);

        console.log(`[ANNOUNCEMENT_CREATED] Admin ${req.user.id} created announcement: ${id}`);
        res.status(201).json({ id, title, content, type: type || 'info', date });
    } catch (e) {
        console.error('[ANNOUNCEMENT_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

router.delete('/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        console.log(`[ANNOUNCEMENT_DELETED] Admin ${req.user.id} deleted announcement: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[ANNOUNCEMENT_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

// ============================================================================
// Upload URL for Cloudflare R2 (Admin Only)
// ============================================================================
router.post('/upload-url', authenticateToken, requireAdmin, async (req, res) => {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
        return res.status(400).json({ error: 'Missing fileName or fileType' });
    }

    try {
        const { generateUploadUrl } = require('../r2.cjs');
        // Sanitize filename
        const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/^\/+/, '');
        const data = await generateUploadUrl(sanitizedFileName, fileType);

        console.log(`[UPLOAD_URL_GENERATED] Admin ${req.user.id} for file: ${sanitizedFileName}`);
        res.json(data);
    } catch (e) {
        console.error('[UPLOAD_URL_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

module.exports = router;
