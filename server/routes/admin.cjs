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
const multer = require('multer');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');
const { performBackup } = require('../services/backupService.cjs');

const upload = multer({ dest: path.join(__dirname, '../../data/uploads/') });

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
// Dashboard Statistics (Extremely Fast via SQLite Native functions)
// ============================================================================
router.get('/stats/dashboard', authenticateToken, requireAdmin, (req, res) => {
    try {
        const totalStudents = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'student'").get().total;
        const totalCourses = db.prepare("SELECT COUNT(*) as total FROM courses WHERE status = 'published'").get().total;
        
        // Calculate a basic average completion rate out of 100 based on level (simplified logic from previous frontend)
        // If users' level is used as completion factor, limit it. If you want strict progress tracking, you'd use enrollments.
        // As a quick fallback matching the frontend's previous heuristic:
        const avgCompletion = db.prepare(`SELECT AVG(level) as avgLevel FROM users WHERE role = 'student'`).get().avgLevel || 1;
        const completionRate = Math.min(Math.round(avgCompletion * 10), 100);

        res.json({
            totalStudents,
            activeCourses: totalCourses,
            completionRate
        });
    } catch (e) {
        console.error('[ADMIN_STATS_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
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
            // We do not delete Local Backups here anymore, because they are tracked in Local Backups table!
            // if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        });
    } catch (e) {
        console.error('[BACKUP_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

router.get('/backup/download/:filename', authenticateToken, requireAdmin, (req, res) => {
    const filename = req.params.filename;
    console.log('[API] GET /backup/download/' + filename);
    
    // Safety check so they cannot navigate folders
    if (!/^[a-zA-Z0-9_-]+\.sqlite$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const backupPath = path.join(__dirname, '../../data/backups', filename);
    if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة محلياً.' });
    }
    
    res.download(backupPath, filename, (err) => {
        if (err) console.error('[BACKUP_DOWNLOAD_ERROR]:', err);
    });
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

router.get('/backup/local', authenticateToken, requireAdmin, (req, res) => {
    console.log('[API] GET /backup/local');
    try {
        const backupDir = path.join(__dirname, '../../data/backups');
        if (!fs.existsSync(backupDir)) {
            return res.json({ files: [] });
        }
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sqlite'));
        const fileList = files.map(file => {
            const stats = fs.statSync(path.join(backupDir, file));
            return {
                id: file,
                name: file,
                date: stats.mtime.toISOString(),
                size: stats.size,
                type: file.startsWith('cloud-') ? 'auto' : 'manual'
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ files: fileList });
    } catch (e) {
        console.error('[LOCAL_BACKUPS_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch local backups' });
    }
});

router.post('/backup/restore', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
    console.log('[API] POST /backup/restore');
    if (!req.file) {
        return res.status(400).json({ error: 'لم يتم إرفاق ملف النسخة الاحتياطية' });
    }

    try {
        const tempPath = req.file.path;
        const dbPath = path.join(__dirname, '../../data/db.sqlite');
        const backupDbPath = path.join(__dirname, `../../data/db-pre-restore-${Date.now()}.sqlite`);

        // 1. Check if the uploaded file is a valid sqlite file
        const Database = require('better-sqlite3');
        try {
            const testDb = new Database(tempPath, { fileMustExist: true });
            testDb.prepare('SELECT count(*) FROM users').get();
            testDb.close();
        } catch (dbErr) {
            fs.unlinkSync(tempPath);
            return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح أو تالف! يرجى التأكد من الملف.' });
        }

        // 2. Perform safe restore (Backup current live db first)
        fs.copyFileSync(dbPath, backupDbPath);
        
        // 3. Clear file locks by closing the database
        db.close();
        
        // 4. Overwrite live database!
        fs.copyFileSync(tempPath, dbPath);
        
        // 5. Cleanup
        fs.unlinkSync(tempPath);
        
        res.json({ success: true, message: 'تم الاستعادة بنجاح! الرجاء إعادة تشغيل الخادم المضيف (السيرفر) يدوياً لتطبيق النسخة وقراءة البيانات.' });
        
    } catch (e) {
        console.error('[RESTORE_ERROR]:', e);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء الاستعادة: ' + e.message });
    }
});

module.exports = router;
