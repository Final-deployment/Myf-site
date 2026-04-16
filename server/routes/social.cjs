const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken } = require('../middleware.cjs');
const { deleteFile, generateDownloadUrl, uploadBufferToR2 } = require('../r2.cjs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Limit each IP to 30 uploads per hour
    message: { error: 'تجاوزت الحد المسموح به لرفع الملفات، يرجى المحاولة لاحقاً' }
});

// --- PUBLIC ROUTES (No Auth Required) ---
router.post('/public/messages', (req, res) => {
    const { content, guestName, attachmentUrl, attachmentType, attachmentName } = req.body;

    if (!content && !attachmentUrl) {
        return res.status(400).json({ error: 'الرسالة أو المرفق مطلوبان' });
    }
    if (!guestName) {
        return res.status(400).json({ error: 'الاسم مطلوب' });
    }
    if (content && content.length > 3000) {
        return res.status(400).json({ error: 'محتوى الرسالة طويل جداً (الحد الأقصى 3000 حرف)' });
    }
    if (guestName && guestName.length > 100) {
        return res.status(400).json({ error: 'الاسم طويل جداً (الحد الأقصى 100 حرف)' });
    }

    try {
        // Route ALL public complaints exclusively to admin_manager (manager@mastaba.com)
        const SUPPORT_MANAGER_ID = 'admin_manager';
        const adminCheck = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'admin'").get(SUPPORT_MANAGER_ID);
        if (!adminCheck) {
            return res.status(503).json({ error: 'خدمة الدعم الفني غير متوفرة حالياً' });
        }
        const adminId = SUPPORT_MANAGER_ID;

        const id = 'msg_' + crypto.randomUUID();
        const timestamp = new Date().toISOString();

        // Use the provided guestId or generate a new one
        const guestId = req.body.guestId || ('guest_' + crypto.randomUUID());

        // We embed the guest name in the content ONLY if it's the very first message
        // This is a simple heuristic: if they didn't provide a guestId, it's their first message
        const isFirstMessage = !req.body.guestId && guestName;
        let finalContent = content || '';

        if (isFirstMessage) {
            finalContent = `[رسالة من زائر: ${guestName}]\n${finalContent}`.trim();
        }

        db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, timestamp, read, isComplaint, expiryDate, attachmentUrl, attachmentType, attachmentName)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, guestId, adminId, finalContent, timestamp, 0, 1, null, attachmentUrl || null, attachmentType || null, attachmentName || null);

        res.json({ success: true, messageId: id, guestId });
    } catch (e) {
        console.error('Public message error:', e);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Get public messages for a guest session
router.get('/public/messages/:guestId', (req, res) => {
    try {
        const guestId = req.params.guestId;
        if (!guestId || !guestId.startsWith('guest_')) {
            return res.status(400).json({ error: 'Invalid guest ID' });
        }

        const messages = db.prepare(`
            SELECT * FROM messages 
            WHERE (senderId = ? OR receiverId = ?)
            ORDER BY timestamp ASC
        `).all(guestId, guestId);

        res.json(messages);
    } catch (e) {
        console.error('Public get messages error:', e);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

/**
 * Server-side Proxy Upload (Public)
 * Allows guests to upload files (with rate limiting). Limit 5MB.
 */
router.post('/public/upload-proxy', uploadLimiter, async (req, res) => {
    try {
        let fileName = req.query.fileName;
        let fileType = req.headers['content-type'];
        let buffer;

        // Support both JSON (Base64) and raw binary
        if (req.body && req.body.base64Data) {
            console.log(`[PublicProxyUpload] Decoding Base64 for ${req.body.fileName}`);
            fileName = req.body.fileName || fileName || `guest-upload-${Date.now()}`;
            fileType = req.body.fileType || fileType || 'application/octet-stream';

            const base64String = req.body.base64Data.replace(/^data:.*?;base64,/, '');
            buffer = Buffer.from(base64String, 'base64');
        } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
            console.log(`[PublicProxyUpload] Processing raw binary buffer`);
            buffer = req.body;
            fileName = fileName || `guest-upload-${Date.now()}`;
        } else {
            return res.status(400).json({ error: 'No file data received. Ensure Content-Type is application/octet-stream for raw, or send JSON with base64Data.' });
        }

        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ error: 'Empty file buffer' });
        }

        // Whitelist extensions
        if (fileName) {
            const ext = path.extname(fileName).toLowerCase().replace('.', '');
            const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'mp4', 'webm', 'ogg', 'pdf', 'doc', 'docx'];
            if (ext && !allowedExts.includes(ext)) {
                return res.status(415).json({ error: `File type ${ext} not permitted.` });
            }
        }

        // 10MB size limit check for public
        const MAX_SIZE_MB = 10;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
        if (buffer.length > MAX_SIZE_BYTES) {
            return res.status(413).json({ error: `حجم الملف للزوار يتجاوز الحد الأقصى وهو ${MAX_SIZE_MB} ميغابايت` });
        }

        console.log(`[PublicProxyUpload] Received ${buffer.length} bytes for ${fileName} (${fileType})`);
        const publicUrl = await uploadBufferToR2(buffer, fileName, fileType);
        console.log(`[PublicProxyUpload] Success. URL: ${publicUrl}`);
        res.json({ publicUrl });
    } catch (e) {
        console.error('[PublicProxyUpload] Failed:', e);
        res.status(500).json({ error: 'فشل في رفع الملف. حاول مرة أخرى.' });
    }
});

/**
 * Server-side Proxy Upload (Protected)
 * Receives file bytes as application/octet-stream and uploads to R2
 */
router.post('/upload-proxy', authenticateToken, uploadLimiter, async (req, res) => {
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

        // Whitelist extensions
        if (fileName) {
            const ext = path.extname(fileName).toLowerCase().replace('.', '');
            const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'mp4', 'webm', 'ogg', 'pdf', 'doc', 'docx'];
            if (ext && !allowedExts.includes(ext)) {
                return res.status(415).json({ error: `File type not permitted.` });
            }
        }

        // 20MB size limit check (20 * 1024 * 1024 bytes)
        const MAX_SIZE_MB = 20;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
        if (buffer.length > MAX_SIZE_BYTES) {
            return res.status(413).json({ error: `حجم الملف يتجاوز الحد الأقصى المسموح به وهو ${MAX_SIZE_MB} ميغابايت` });
        }

        console.log(`[ProxyUpload] Received ${buffer.length} bytes for ${fileName} (${fileType})`);

        const publicUrl = await uploadBufferToR2(buffer, fileName, fileType);

        console.log(`[ProxyUpload] Success. URL: ${publicUrl}`);
        res.json({ publicUrl });
    } catch (e) {
        console.error('[ProxyUpload] Failed:', e);
        res.status(500).json({ error: 'فشل في رفع الملف. حاول مرة أخرى.' });
    }
});

// --- PROTECTED ROUTES ---
router.use(authenticateToken);

// Messages
router.put('/messages/read', (req, res) => {
    const userId = req.user.id;
    const { senderId } = req.body;
    
    if (!senderId) {
        return res.status(400).json({ error: 'Sender ID is required' });
    }

    try {
        db.prepare(`
            UPDATE messages 
            SET read = 1 
            WHERE receiverId = ? AND senderId = ? AND read = 0
        `).run(userId, senderId);
        
        res.json({ success: true });
    } catch (e) {
        console.error('[Mark Messages Read] Error:', e);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

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
        // Exclude complaints and admin messages from unread count for students
        const roleFilter = req.user.role === 'student'
            ? "AND (isComplaint = 0 OR isComplaint IS NULL) AND senderId NOT IN (SELECT id FROM users WHERE role = 'admin') AND senderId != 'admin_manager'"
            : '';
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
            // Admin sees all admins
            const admins = db.prepare("SELECT id, name, role, avatar, email FROM users WHERE role = 'admin'").all();
            console.log(`[SOCIAL_CONTACTS] Admin: found ${admins.length} admins`);

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

            // Admin ALSO sees guests
            const guestMessages = db.prepare(`
                SELECT DISTINCT senderId 
                FROM messages 
                WHERE receiverId = ? AND senderId LIKE 'guest_%'
            `).all(userId);

            const guests = guestMessages.map(g => {
                try {
                    // Find first message from this guest to extract name
                    const firstMsg = db.prepare(`SELECT content FROM messages WHERE senderId = ? ORDER BY timestamp ASC LIMIT 1`).get(g.senderId);
                    let guestNameStr = 'زائر ' + (g.senderId.split('_')[1] || '').substring(0, 4);

                    if (firstMsg && firstMsg.content && firstMsg.content.includes('[رسالة من زائر:')) {
                        const match = firstMsg.content.match(/\[رسالة من زائر:\s*(.*?)\]/);
                        if (match && match[1]) {
                            guestNameStr = match[1].trim();
                        }
                    }

                    return {
                        id: g.senderId,
                        name: guestNameStr,
                        role: 'guest', // User role 'guest' so UI explicitly flags it
                        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(guestNameStr || 'زائر') + '&background=random',
                        email: 'guest@local'
                    };
                } catch (err) {
                    console.error('[SOCIAL_CONTACTS] Error processing guest', g.senderId, err);
                    return {
                        id: g.senderId,
                        name: 'زائر',
                        role: 'guest',
                        avatar: 'https://ui-avatars.com/api/?name=%D8%B2%D8%A7%D8%A6%D8%B1&background=random',
                        email: 'guest@local'
                    };
                }
            });

            console.log(`[SOCIAL_CONTACTS] Admin: found ${complainingStudents.length} complaining students, ${guests.length} guests`);

            users = [...admins, ...supervisors, ...complainingStudents, ...guests];
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

    if (content && content.length > 5000) {
        return res.status(400).json({ error: 'محتوى الرسالة أطول من الحد الأقصى المسموح به' });
    }

    try {
        let finalReceiverId = receiverId;
        let receiver = null;

        // --- Role-Based Messaging Validation ---

        // Fetch receiver details to check their role (unless it's a guest)
        if (finalReceiverId && finalReceiverId.startsWith('guest_')) {
            // It's a guest, so there is no user record
            receiver = { role: 'guest' };
            console.log(`[MSG_DEBUG] senderId=${senderId}, receiverId=${finalReceiverId}, isComplaint=${isComplaint}, receiverRole=guest`);
        } else {
            receiver = db.prepare('SELECT role, supervisor_id FROM users WHERE id = ?').get(finalReceiverId);
            console.log(`[MSG_DEBUG] senderId=${senderId}, receiverId=${finalReceiverId}, isComplaint=${isComplaint}, receiverExists=${!!receiver}, receiverRole=${receiver?.role}`);
        }

        // COMPLAINT ROUTING: All complaints go exclusively to admin_manager (manager@mastaba.com)
        const SUPPORT_MANAGER_ID = 'admin_manager';
        if (isComplaint === 1 || isComplaint === true) {
            // Note: If an ADMIN is replying TO A GUEST or STUDENT, it's technically a complaint reply, but we don't re-route it back to the admin!
            if (senderRole !== 'admin') {
                let supportManager = db.prepare("SELECT id, role FROM users WHERE id = ?").get(SUPPORT_MANAGER_ID);
                if (!supportManager) {
                     // Fallback: If manager was accidentally deleted, route to the first available admin
                     supportManager = db.prepare("SELECT id, role FROM users WHERE role = 'admin' LIMIT 1").get();
                }
                
                if (supportManager) {
                    console.log(`[COMPLAINT_ROUTING] Routing complaint from ${senderId} to ${supportManager.id}`);
                    finalReceiverId = supportManager.id;
                    receiver = db.prepare('SELECT role, supervisor_id FROM users WHERE id = ?').get(finalReceiverId);
                } else {
                    return res.status(503).json({ error: 'خدمة الدعم الفني غير متوفرة حالياً لعدم وجود مدير للنظام' });
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
            // Admin can message Supervisors, Students, OR Guests (as replies/support)
            console.log(`[ADMIN_MSG] Admin ${senderId} messaging ${receiver.role} ${finalReceiverId}`);
        }

        const id = 'msg_' + crypto.randomUUID();
        const timestamp = new Date().toISOString();

        let expiryDate = null;
        if (attachmentUrl || attachmentType) {
            const date = new Date();
            // Technical Support files expire in 14 days, regular attachments in 7
            if (isComplaint === 1 || isComplaint === true || senderRole === 'admin') {
                date.setDate(date.getDate() + 14);
            } else {
                date.setDate(date.getDate() + 7);
            }
            expiryDate = date.toISOString();
        }

        // Force Admin-to-Student/Guest messages to be flagged as support messages
        // so they properly route to the student's SupportChatBubble.
        let finalIsComplaint = (isComplaint === 1 || isComplaint === true) ? 1 : 0;
        
        let isGuestParams = String(finalReceiverId).startsWith('guest_') || !receiver;
        if (senderRole === 'admin') {
            if (isGuestParams || (receiver && receiver.role === 'student')) {
                finalIsComplaint = 1;
            }
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
            isComplaint: finalIsComplaint
        });
        res.status(201).json({ id, senderId, receiverId: finalReceiverId, content, read: 0, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate, isComplaint: finalIsComplaint });
    } catch (e) {
        console.error('[MESSAGING_SEND_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Broadcast Message (Only for admin_manager)
router.post('/broadcast', (req, res) => {
    const { content, attachmentUrl, attachmentType, attachmentName } = req.body;
    const senderId = req.user.id;

    if (senderId !== 'admin_manager') {
        return res.status(403).json({ error: 'غير مصرح لك بإرسال تعميمات. هذه الصلاحية لمدير الدعم الفني فقط.' });
    }

    try {
        // Get all students
        const students = db.prepare("SELECT id FROM users WHERE role = 'student'").all();
        
        if (students.length === 0) {
            return res.json({ success: true, count: 0, message: 'لا يوجد طلاب مسجلين' });
        }

        const timestamp = new Date().toISOString();
        let expiryDate = null;
        
        if (attachmentUrl || attachmentType) {
            const date = new Date();
            date.setDate(date.getDate() + 14); // Keep broadcast attachments for 14 days
            expiryDate = date.toISOString();
        }

        const insert = db.prepare(`
            INSERT INTO messages (id, senderId, receiverId, content, read, timestamp, attachmentUrl, attachmentType, attachmentName, expiryDate, isComplaint)
            VALUES (@id, @senderId, @receiverId, @content, 0, @timestamp, @attachmentUrl, @attachmentType, @attachmentName, @expiryDate, 0)
        `);

        // Execute as a transaction for performance
        const broadcastTx = db.transaction((studentsToMessage) => {
            let count = 0;
            for (const student of studentsToMessage) {
                insert.run({
                    id: 'msg_' + crypto.randomUUID(),
                    senderId: 'admin_manager',
                    receiverId: student.id,
                    content: content || '',
                    timestamp,
                    attachmentUrl: attachmentUrl || null,
                    attachmentType: attachmentType || null,
                    attachmentName: attachmentName || null,
                    expiryDate
                });
                count++;
            }
            return count;
        });

        const messagesSent = broadcastTx(students);
        console.log(`[BROADCAST] admin_manager sent broadcast to ${messagesSent} students.`);
        
        res.status(201).json({ success: true, count: messagesSent });
    } catch (e) {
        console.error('[BROADCAST_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

router.put('/messages/:id/read', (req, res) => {
    const { id } = req.params;
    try {
        // SECURITY: Only allow the recipient to mark a message as read
        const message = db.prepare('SELECT receiverId FROM messages WHERE id = ?').get(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        // Allow admins to mark any message, otherwise only the recipient
        if (req.user.role !== 'admin' && message.receiverId !== req.user.id) {
            return res.status(403).json({ error: 'Cannot mark messages that are not yours as read' });
        }
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

// Admin ONLY: Delete a specific message
router.delete('/messages/:id', (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'غير مصرح لك بحذف الرسائل' });
    }
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM messages WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin ONLY: Delete an entire conversation with a specific user
router.delete('/messages/conversation/:userId', (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'غير مصرح لك بحذف المحادثات' });
    }
    const { userId: targetId } = req.params;
    const adminId = req.user.id;
    try {
        db.prepare('DELETE FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)').run(adminId, targetId, targetId, adminId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
