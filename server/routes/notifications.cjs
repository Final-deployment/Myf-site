const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Configure web-push
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:support@mastaba.org',
        publicVapidKey,
        privateVapidKey
    );
} else {
    console.warn('\n[WARNING] VAPID keys not configured in .env. Web Push Notifications will not work.\n');
}

// ============================================================================
// Get VAPID Public Key
// ============================================================================
router.get('/vapid-public-key', (req, res) => {
    if (!publicVapidKey) {
        return res.status(500).json({ error: 'VAPID keys not configured on server' });
    }
    res.json({ publicKey: publicVapidKey });
});

// ============================================================================
// Subscribe User to Push Notifications
// ============================================================================
router.post('/subscribe', authenticateToken, (req, res) => {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
        // Insert or ignore (endpoint is UNIQUE)
        db.prepare(`
            INSERT OR IGNORE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?)
        `).run(
            userId,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth
        );
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('[PUSH_SUBSCRIBE_ERROR]:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// ============================================================================
// Send Notification (Admin Only)
// ============================================================================
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
    const { title, body, url } = req.body;
    let { targetUserIds } = req.body; // Optional: array of user IDs

    if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
        let subscriptions = [];
        if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
            const placeholders = targetUserIds.map(() => '?').join(',');
            subscriptions = db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`).all(...targetUserIds);
        } else {
            subscriptions = db.prepare(`SELECT * FROM push_subscriptions`).all();
        }

        const payload = JSON.stringify({
            title,
            body,
            url: url || '/',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png'
        });

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            return webpush.sendNotification(pushSubscription, payload)
                .catch(err => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        // Subscription has expired or is no longer valid, remove it
                        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
                    } else {
                        console.error('[PUSH_SEND_ERROR]:', err);
                    }
                });
        });

        await Promise.all(promises);
        res.json({ success: true, count: subscriptions.length });
    } catch (error) {
        console.error('[PUSH_BROADCAST_ERROR]:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

module.exports = router;
