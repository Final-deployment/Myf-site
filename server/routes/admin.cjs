/**
 * Admin Routes Module
 * 
 * Handles admin-specific operations (R2 files, activity logs).
 * All routes require admin authentication.
 * 
 * @module server/routes/admin
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');
const { performBackup } = require('../services/backupService.cjs');

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'myf-videos';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

// ============================================================================
// R2 Files (Admin Only)
// ============================================================================
router.get('/r2/files', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const prefix = req.query.prefix || '';
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: '/',
            MaxKeys: 1000
        });

        const data = await r2Client.send(command);
        const folders = (data.CommonPrefixes || []).map(p => ({
            name: p.Prefix,
            path: p.Prefix,
            type: 'folder'
        }));

        const files = (data.Contents || [])
            .filter(item => {
                if (item.Key === prefix) return false;
                const ext = path.extname(item.Key).toLowerCase();
                return ['.mp4', '.m4v', '.mov', '.webm', '.avi', '.mkv', '.mp3', '.wav', '.jpg', '.png', '.jpeg'].includes(ext);
            })
            .map(item => ({
                id: item.ETag,
                name: item.Key.replace(prefix, ''),
                fullName: item.Key,
                size: item.Size,
                lastModified: item.LastModified,
                url: `${R2_PUBLIC_DOMAIN}/${item.Key}`
            }));

        res.json({ files, folders, prefix });
    } catch (e) {
        console.error('[ADMIN_R2_FILES_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch R2 files' });
    }
});

// ============================================================================
// System Activity Logs (Admin Only)
// ============================================================================
router.get('/system-activity-logs', authenticateToken, requireAdmin, (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM system_activity_logs ORDER BY timestamp DESC LIMIT 1000').all();
        res.json(logs);
    } catch (e) {
        console.error('[ADMIN_LOGS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

router.post('/system-activity-logs', authenticateToken, (req, res) => {
    const { userId, action, details } = req.body;

    if (!userId || !action) {
        return res.status(400).json({ error: 'Missing userId or action' });
    }

    try {
        db.prepare(`
            INSERT INTO system_activity_logs (id, userId, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `).run('log_' + crypto.randomUUID(), userId, action, details || '', new Date().toISOString());
        res.status(201).json({ success: true });
    } catch (e) {
        console.error('[ADMIN_LOGS_POST_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create activity log' });
    }
});

// ============================================================================
// System Settings (Admin Only)
// ============================================================================
router.get('/settings/backup', authenticateToken, requireAdmin, (req, res) => {
    console.log('[API] GET /settings/backup');
    try {
        const settings = db.prepare('SELECT key, value FROM system_settings WHERE key LIKE ?').all('%backup%');
        const settingsObj = {};
        settings.forEach(s => {
            if (s.key === 'auto_backup_enabled' || s.key === 'cloud_backup_enabled') {
                settingsObj[s.key] = s.value === '1';
            } else {
                settingsObj[s.key] = s.value;
            }
        });
        res.json(settingsObj);
    } catch (e) {
        console.error('[SETTINGS_GET_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

router.post('/settings/backup', authenticateToken, requireAdmin, (req, res) => {
    console.log('[API] POST /settings/backup', req.body);
    try {
        const { auto_backup_enabled, cloud_backup_enabled, backup_retention_days } = req.body;

        const update = db.prepare('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');

        if (auto_backup_enabled !== undefined) update.run(auto_backup_enabled ? '1' : '0', 'auto_backup_enabled');
        if (cloud_backup_enabled !== undefined) update.run(cloud_backup_enabled ? '1' : '0', 'cloud_backup_enabled');
        if (backup_retention_days !== undefined) update.run(String(backup_retention_days), 'backup_retention_days');

        res.json({ success: true });
    } catch (e) {
        console.error('[SETTINGS_POST_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Database Backup & Restore (Admin Only)
// ============================================================================
router.get('/backup/download', authenticateToken, requireAdmin, async (req, res) => {
    console.log('[API] GET /backup/download');
    try {
        const result = await performBackup(false);
        const backupPath = path.join(__dirname, '../../data/backups', result.fileName);

        res.download(backupPath, 'database-backup.sqlite', (err) => {
            if (err) console.error('[BACKUP_DOWNLOAD_ERROR]:', err);
            if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        });
    } catch (e) {
        console.error('[BACKUP_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

router.post('/backup/cloud', authenticateToken, requireAdmin, async (req, res) => {
    console.log('[API] POST /backup/cloud');
    try {
        const result = await performBackup(true);
        res.json({
            success: true,
            url: result.publicUrl,
            key: result.fileName,
            size: result.size
        });
    } catch (e) {
        console.error('[CLOUD_BACKUP_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to upload cloud backup' });
    }
});

router.post('/backup/restore', authenticateToken, requireAdmin, async (req, res) => {
    console.log('[API] POST /backup/restore');
    // Note: Re-initializing DB while running is complex with better-sqlite3
    // We'll support JSON import or direct SQL execution for simpler restoration
    // or tell user to replace file manually if it's a structural change.
    res.status(501).json({ error: 'Restore via API not yet implemented. Please replace db.sqlite manually for now.' });
});

module.exports = router;
