const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');
const { deleteFile, generateDownloadUrl, uploadBufferToR2 } = require('../r2.cjs');

router.use(authenticateToken);

// Messages
router.get('/messages', async (req, res) => {
    const userId = req.user.id;
    try {
        // Filter out expired messages dynamically or rely on cleanup
        // ALSO: Filter out complaints if the user is a student (one-way only)
        // AND: Allow admins to see ALL complaints regardless of recipient
        // Students see: non-complaints OR messages they sent (so they see their own complaints)
        const isAdmin = req.user.role === 'admin';
        const adminComplaintAccess = isAdmin ? 'OR isComplaint = 1' : '';
        const roleFilter = req.user.role === 'student'
            ? 'AND (isComplaint = 0 OR isComplaint IS NULL OR senderId = ?)'
            : '';

        const params = [userId, userId];
        if (isAdmin) {
            // No extra param for adminComplaintAccess since it's hardcoded '1'
        }
        params.push(new Date().toISOString());
        if (req.user.role === 'student') params.push(userId);

        const messages = db.prepare(`
            SELECT * FROM messages 
            WHERE (senderId = ? OR receiverId = ? ${adminComplaintAccess}) 
            AND (expiryDate IS NULL OR expiryDate > ?)
            ${roleFilter}
            ORDER BY timestamp ASC
        `).all(...params);

        // Process messages to sign attachment URLs
        const signedMessages = await Promise.all(messages.map(async (msg) => {
            if (msg.attachmentUrl) {
                try {
                    // Robust extraction: if it contains 'uploads/', take everything after (and including) it
                    // This handles R2_PUBLIC_DOMAIN/uploads/key and worker-urls/uploads/key
                    const uploadsIdx = msg.attachmentUrl.indexOf('uploads/');
                    if (uploadsIdx !== -1) {
                        const key = msg.attachmentUrl.substring(uploadsIdx);
                        msg.attachmentUrl = await generateDownloadUrl(key);
                    }
                } catch (e) {
                    console.error('Failed to sign URL for msg:', msg.id, e);
                }
            }
            return msg;
        }));

        res.json(signedMessages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Unread Count
router.get('/messages/unread', (req, res) => {
    const userId = req.user.id;
    try {
        // Exclude complaints from unread count for students
        const roleFilter = req.user.role === 'student' ? 'AND (isComplaint = 0 OR isComplaint IS NULL)' : '';
        const result = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND read = 0 ${roleFilter}`).get(userId);
        res.json({ count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get authorized contacts based on role
router.get('/contacts', (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    console.log(`[SOCIAL_CONTACTS] Fetching for user=${userId}, role=${role}`);

    try {
        let users = [];
        if (role === 'admin') {
            // Admin sees all supervisors
            const supervisors = db.prepare("SELECT id, name, role, avatar, email FROM users WHERE role = 'supervisor'").all();
            console.log(`[SOCIAL_CONTACTS] Admin: found ${supervisors.length} supervisors`);

            // Admin also sees students who have sent complaints
            const complainingStudents = db.prepare(`
                SELECT DISTINCT u.id, u.name, u.role, u.avatar, u.email 
                FROM users u
                JOIN messages m ON u.id = m.senderId
                WHERE m.receiverId = ? AND m.isComplaint = 1
            `).all(userId);
            console.log(`[SOCIAL_CONTACTS] Admin: found ${complainingStudents.length} complaining students`);

            users = [...supervisors, ...complainingStudents];
        } else if (role === 'supervisor') {
            // Supervisor sees all admins
            const admins = db.prepare("SELECT id, name, role, avatar, email FROM users WHERE role = 'admin'").all();
            console.log(`[SOCIAL_CONTACTS] Supervisor: found ${admins.length} admins`);

            // Supervisor sees their assigned students
            const students = db.prepare("SELECT id, name, role, avatar, email, supervisor_id FROM users WHERE role = 'student' AND supervisor_id = ?").all(userId);
            console.log(`[SOCIAL_CONTACTS] Supervisor: found ${students.length} students`);

            users = [...admins, ...students];
        } else if (role === 'student') {
            // Student sees all admins (for complaints)
            const admins = db.prepare("SELECT id, name, role, avatar, email FROM users WHERE role = 'admin'").all();
            console.log(`[SOCIAL_CONTACTS] Student: found ${admins.length} admins`);

            // Student sees their assigned supervisor
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(userId);
            let supervisors = [];
            if (student && student.supervisor_id) {
                supervisors = db.prepare('SELECT id, name, role, avatar, email FROM users WHERE id = ?').all(student.supervisor_id);
                console.log(`[SOCIAL_CONTACTS] Student: found supervisor=${student.supervisor_id}`);
            }

            users = [...admins, ...supervisors];
        }

        // De-duplicate if necessary (though SQL above shouldn't produce much dups except maybe admins)
        const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
        console.log(`[SOCIAL_CONTACTS] Returning ${uniqueUsers.length} total contacts`);
        res.json(uniqueUsers);
    } catch (e) {
        console.error('[SOCIAL_CONTACTS_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Cleanup Expired Messages
router.delete('/messages/cleanup', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const now = new Date().toISOString();

        // Find messages with attachments to delete
        const expiredWithAttachments = db.prepare('SELECT attachmentUrl, attachmentType FROM messages WHERE expiryDate IS NOT NULL AND expiryDate < ? AND attachmentUrl IS NOT NULL').all(now);

        for (const msg of expiredWithAttachments) {
            if (msg.attachmentUrl) {
                // Extract key from URL
                // URL format: R2_PUBLIC_DOMAIN/key or https://.../key
                try {
                    const url = new URL(msg.attachmentUrl);
                    // Key is usually pathname relative to root, but might have leading slash
                    let key = url.pathname;
                    if (key.startsWith('/')) key = key.substring(1);

                    console.log(`Deleting expired attachment: ${key}`);
                    await deleteFile(key);
                } catch (err) {
                    console.error('Failed to delete file from R2:', err);
                }
            }
        }

        const result = db.prepare('DELETE FROM messages WHERE expiryDate IS NOT NULL AND expiryDate < ?').run(now);
        res.json({ success: true, deleted: result.changes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/messages', (req, res) => {
    const { receiverId, content, attachmentUrl, attachmentType, attachmentName, isComplaint } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    try {
        let finalReceiverId = receiverId;
        let receiver = null;

        // --- Role-Based Messaging Validation ---

        // Fetch receiver details to check their role
        receiver = db.prepare('SELECT role, supervisor_id FROM users WHERE id = ?').get(finalReceiverId);

        // EXTRA COMPLAINT PROTECTION (v5):
        // If this is a complaint and the recipient is NOT an admin (or doesn't exist), 
        // find admin_main first, otherwise fall back to any admin.
        if (isComplaint === 1 || isComplaint === true) {
            if (!receiver || receiver.role !== 'admin') {
                // First, try to find admin_main specifically
                let altAdmin = db.prepare("SELECT id FROM users WHERE id = 'admin_main' AND role = 'admin'").get();
                if (!altAdmin) {
                    // Fallback to any admin
                    altAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
                }
                if (altAdmin) {
                    console.log(`[COMPLAINT_ROUTING_v5] Redirecting complaint from ${finalReceiverId} to ${altAdmin.id}`);
                    finalReceiverId = altAdmin.id;
                    // Re-fetch receiver info for the new finalReceiverId
                    receiver = db.prepare('SELECT role, supervisor_id FROM users WHERE id = ?').get(finalReceiverId);
                } else if (!receiver) {
                    return res.status(403).json({ error: 'الشكاوى ترسل للمدير فقط، ولم يتم العثور على مدير في النظام' });
                }
            }
        }

        // Standard validation for non-complaints or if no admin fallback was found
        if (!receiver) return res.status(404).json({ error: 'المستلم غير موجود' });

        // Rule 1: Student validation
        if (senderRole === 'student') {
            if (isComplaint) {
                // Complaints must go to an Admin (should be true by now due to fallback above)
                if (receiver.role !== 'admin') {
                    return res.status(403).json({ error: 'الشكاوى ترسل للمدير فقط' });
                }
            } else {
                // Regular messages must go to their assigned supervisor
                const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(senderId);
                if (!student || student.supervisor_id !== finalReceiverId) {
                    return res.status(403).json({ error: 'يمكنك مراسلة مشرفك المباشر فقط' });
                }
            }
        }

        // Rule 2: Supervisor validation
        else if (senderRole === 'supervisor') {
            const isTargetAdmin = receiver.role === 'admin';
            const isTargetMyStudent = receiver.role === 'student' && receiver.supervisor_id === senderId;

            if (!isTargetAdmin && !isTargetMyStudent) {
                return res.status(403).json({ error: 'يمكنك مراسلة المدير أو طلابك فقط' });
            }
        }

        // Rule 3: Admin validation
        else if (senderRole === 'admin') {
            // Admin can message Supervisors OR Students (as replies/support)
            console.log(`[ADMIN_MSG] Admin ${senderId} messaging ${receiver.role} ${finalReceiverId}`);
        }

        const id = 'msg_' + Date.now();
        const timestamp = new Date().toISOString();

        let expiryDate = null;
        if (attachmentUrl || attachmentType) {
            const date = new Date();
            date.setDate(date.getDate() + 7);
            expiryDate = date.toISOString();
        }

        db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate, isComplaint)
            VALUES (@id, @senderId, @receiverId, @content, @read, @timestamp, @attachmentUrl, @attachmentType, @attachmentName, @expiryDate, @isComplaint)
        `).run({
            id,
            senderId,
            receiverId: finalReceiverId,
            content: content || '',
            read: 0,
            timestamp,
            attachmentUrl: attachmentUrl || null,
            attachmentType: attachmentType || null,
            attachmentName: attachmentName || null,
            expiryDate,
            isComplaint: (isComplaint === 1 || isComplaint === true) ? 1 : 0
        });
        res.status(201).json({ id, senderId, receiverId: finalReceiverId, content, read: 0, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate, isComplaint });
    } catch (e) {
        console.error('[MESSAGING_SEND_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

router.put('/messages/:id/read', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



// Mark conversation as read
router.put('/messages/conversation/:userId/read', (req, res) => {
    const { userId: targetId } = req.params; // The sender whose messages we are marking as read
    const currentUserId = req.user.id;
    try {
        db.prepare('UPDATE messages SET read = 1 WHERE senderId = ? AND receiverId = ?').run(targetId, currentUserId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Radical Fix: Server-side Proxy Upload
 * Receives file bytes as application/octet-stream and uploads to R2
 */
router.post('/upload-proxy', async (req, res) => {
    try {
        let fileName = req.query.fileName;
        let fileType = req.headers['content-type'];
        let buffer;

        // Support both JSON (Base64) and raw binary
        if (req.body && req.body.base64Data) {
            // Case 1: JSON with Base64
            console.log(`[ProxyUpload] Decoding Base64 for ${req.body.fileName}`);
            fileName = req.body.fileName || fileName || `upload-${Date.now()}`;
            fileType = req.body.fileType || fileType || 'application/octet-stream';

            // Remove data:URL prefix if present
            const base64String = req.body.base64Data.replace(/^data:.*?;base64,/, '');
            buffer = Buffer.from(base64String, 'base64');
        } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            // Case 2: Raw binary buffer
            console.log(`[ProxyUpload] Processing raw binary buffer`);
            buffer = req.body;
            fileName = fileName || `upload-${Date.now()}`;
        } else {
            return res.status(400).json({ error: 'No file data received. Ensure Content-Type is application/octet-stream for raw, or send JSON with base64Data.' });
        }

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'Empty file buffer' });
        }

        console.log(`[ProxyUpload] Received ${buffer.length} bytes for ${fileName} (${fileType})`);

        const publicUrl = await uploadBufferToR2(buffer, fileName, fileType);

        console.log(`[ProxyUpload] Success. URL: ${publicUrl}`);
        res.json({ publicUrl });
    } catch (e) {
        console.error('[ProxyUpload] Failed:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
