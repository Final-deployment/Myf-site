/**
 * R2 Storage Routes Module
 * 
 * Handles Cloudflare R2 file operations.
 * All routes require admin authentication.
 * 
 * @module server/routes/r2
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Apply authentication to all R2 routes - these are sensitive file operations
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// List files from R2 (Admin Only)
// ============================================================================
router.get('/files', async (req, res) => {
    try {
        const { listFiles } = require('../r2.cjs');
        const prefix = req.query.prefix || '';
        const files = await listFiles(prefix);

        console.log(`[R2_LIST] Admin ${req.user.id} listed files with prefix: ${prefix}`);
        res.json(files);
    } catch (e) {
        console.error('[R2_LIST_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// ============================================================================
// Get Upload URL (Admin Only)
// ============================================================================
router.post('/upload-url', async (req, res) => {
    try {
        const { generateUploadUrl } = require('../r2.cjs');
        const { fileName, fileType, folderPath } = req.body;

        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({ error: 'fileName is required and must be a string' });
        }

        // Sanitize filename to prevent path traversal
        const sanitizedFileName = fileName.replace(/\.\./g, '').replace(/^\/+/, '');
        const sanitizedFolderPath = folderPath ? folderPath.replace(/\.\./g, '') : undefined;

        const data = await generateUploadUrl(sanitizedFileName, fileType || 'application/octet-stream', sanitizedFolderPath);
        console.log(`[R2_UPLOAD_URL] Admin ${req.user.id} generated upload URL for: ${sanitizedFileName}`);
        res.json(data);
    } catch (e) {
        console.error('[R2_UPLOAD_URL_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// ============================================================================
// Delete file (Admin Only)
// ============================================================================
router.delete('/file', async (req, res) => {
    try {
        const { deleteFile } = require('../r2.cjs');
        const { key } = req.body;

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'key is required and must be a string' });
        }

        // Sanitize key to prevent path traversal
        const sanitizedKey = key.replace(/\.\./g, '');

        await deleteFile(sanitizedKey);
        console.log(`[R2_DELETE] Admin ${req.user.id} deleted file: ${sanitizedKey}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[R2_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// ============================================================================
// Rename/Move file (Admin Only)
// ============================================================================
router.post('/rename', async (req, res) => {
    try {
        const { renameFile } = require('../r2.cjs');
        const { oldKey, newKey } = req.body;

        if (!oldKey || !newKey || typeof oldKey !== 'string' || typeof newKey !== 'string') {
            return res.status(400).json({ error: 'oldKey and newKey are required and must be strings' });
        }

        // Sanitize keys to prevent path traversal
        const sanitizedOldKey = oldKey.replace(/\.\./g, '');
        const sanitizedNewKey = newKey.replace(/\.\./g, '');

        await renameFile(sanitizedOldKey, sanitizedNewKey);
        console.log(`[R2_RENAME] Admin ${req.user.id} renamed ${sanitizedOldKey} -> ${sanitizedNewKey}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[R2_RENAME_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// ============================================================================
// Create folder (Admin Only)
// ============================================================================
router.post('/folder', async (req, res) => {
    try {
        const { createFolder } = require('../r2.cjs');
        const { folderPath } = req.body;

        if (!folderPath || typeof folderPath !== 'string') {
            return res.status(400).json({ error: 'folderPath is required and must be a string' });
        }

        // Sanitize path to prevent path traversal
        const sanitizedPath = folderPath.replace(/\.\./g, '').replace(/^\/+/, '');

        await createFolder(sanitizedPath);
        console.log(`[R2_CREATE_FOLDER] Admin ${req.user.id} created folder: ${sanitizedPath}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[R2_CREATE_FOLDER_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

module.exports = router;
