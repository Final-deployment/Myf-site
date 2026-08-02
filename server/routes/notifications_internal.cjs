const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');

// ============================================================================
// Helper: Create an in-app notification (importable by other modules)
// ============================================================================
function createNotification(userId, type, title, body, link = null) {
    try {
        db.prepare(`
            INSERT INTO in_app_notifications (id, user_id, type, title, body, link)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run('notif_' + crypto.randomUUID(), userId, type, title, body, link);
    } catch (e) {
        console.error('[NOTIFICATION_CREATE_ERROR]:', e.message);
    }
}

// ============================================================================
// Batch create notifications for multiple users
// ============================================================================
function createNotificationBatch(userIds, type, title, body, link = null) {
    const insert = db.prepare(`
        INSERT INTO in_app_notifications (id, user_id, type, title, body, link)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const batchTx = db.transaction((ids) => {
        for (const uid of ids) {
            insert.run('notif_' + crypto.randomUUID(), uid, type, title, body, link);
        }
    });
    try {
        batchTx(userIds);
    } catch (e) {
        console.error('[NOTIFICATION_BATCH_ERROR]:', e.message);
    }
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============================================================================
// Get notifications for the current user (paginated)
// ============================================================================
router.get('/', (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const notifications = db.prepare(`
            SELECT * FROM in_app_notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM in_app_notifications WHERE user_id = ?').get(userId).count;

        res.json({ notifications, total, page, limit });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Get unread count (for badge)
// ============================================================================
router.get('/unread-count', (req, res) => {
    try {
        const result = db.prepare('SELECT COUNT(*) as count FROM in_app_notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
        res.json({ count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Mark a notification as read
// ============================================================================
router.put('/:id/read', (req, res) => {
    try {
        const result = db.prepare('UPDATE in_app_notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'الإشعار غير موجود' });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Mark all notifications as read
// ============================================================================
router.put('/read-all', (req, res) => {
    try {
        db.prepare('UPDATE in_app_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Delete a notification
// ============================================================================
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM in_app_notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'الإشعار غير موجود' });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.createNotificationBatch = createNotificationBatch;
