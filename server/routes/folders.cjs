/**
 * Course Folders Routes Module
 * 
 * Handles folder CRUD operations.
 * - GET folders: Public (for course organization)
 * - POST/DELETE folders: Admin only
 * 
 * @module server/routes/folders
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// ============================================================================
// Get all folders (Public - needed for course organization)
// ============================================================================
router.get('/', (req, res) => {
    try {
        const folders = db.prepare('SELECT * FROM course_folders ORDER BY order_index ASC').all();
        res.json(folders);
    } catch (e) {
        console.error('[FOLDERS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
});

// ============================================================================
// Create a folder (Admin Only)
// ============================================================================
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { name, thumbnail } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    try {
        const id = 'folder_' + crypto.randomUUID();
        const sanitizedName = name.trim();
        const defaultThumbnail = 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop';

        db.prepare('INSERT INTO course_folders (id, name, thumbnail) VALUES (?, ?, ?)')
            .run(id, sanitizedName, thumbnail || defaultThumbnail);

        console.log(`[FOLDER_CREATED] Admin ${req.user.id} created folder ${id}: ${sanitizedName}`);
        res.json({ success: true, id, name: sanitizedName });
    } catch (e) {
        console.error('[FOLDER_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// ============================================================================
// Update folder (Admin Only)
// ============================================================================
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, thumbnail, order_index } = req.body;

    try {
        const existing = db.prepare('SELECT id FROM course_folders WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (thumbnail) {
            updates.push('thumbnail = ?');
            values.push(thumbnail);
        }
        if (order_index !== undefined) {
            updates.push('order_index = ?');
            values.push(order_index);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);
        db.prepare(`UPDATE course_folders SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        console.log(`[FOLDER_UPDATED] Admin ${req.user.id} updated folder ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[FOLDER_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// ============================================================================
// Delete a folder (Admin Only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const existing = db.prepare('SELECT id FROM course_folders WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Move courses out of folder before deleting
        const coursesInFolder = db.prepare('SELECT COUNT(*) as count FROM courses WHERE folder_id = ?').get(id);

        db.prepare('UPDATE courses SET folder_id = NULL WHERE folder_id = ?').run(id);
        db.prepare('DELETE FROM course_folders WHERE id = ?').run(id);

        console.log(`[FOLDER_DELETED] Admin ${req.user.id} deleted folder ${id} (${coursesInFolder.count} courses moved)`);
        res.json({ success: true, movedCourses: coursesInFolder.count });
    } catch (e) {
        console.error('[FOLDER_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

module.exports = router;
