const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { generateOTP, sendVerificationEmail, sendPasswordResetOtpEmail, sendApprovalNotificationEmail, sendRejectionNotificationEmail } = require('../email.cjs');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 8, // Limit each IP to 8 requests per windowMs
    message: { 
        error: 'Too many requests from this IP, please try again after 5 minutes', 
        errorAr: 'تجاوزت الحد المسموح به من المحاولات، يرجى المحاولة بعد 5 دقائق' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});


let SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.warn('\n[SECURITY WARNING] No SECRET_KEY found in environment variables!');
    console.warn('Using a randomly generated transient key. All active sessions will be invalidated on server restart.\n');
    SECRET_KEY = crypto.randomBytes(64).toString('hex');
}

// Login
router.post('/login', authLimiter, async (req, res) => {
    const { email, password, rememberMe } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(400).json({ error: 'Cannot find user' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            if (user.role === 'student' && !user.emailVerified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    errorAr: 'البريد الإلكتروني لم يتم تفعيله بعد',
                    needsVerification: true,
                    email: user.email
                });
            }
            // Check if student is approved by admin
            if (user.role === 'student' && !user.approved) {
                return res.status(403).json({
                    error: 'Account pending approval',
                    errorAr: 'حسابك بانتظار موافقة المسؤولين. سيتم إبلاغك عبر البريد الإلكتروني عند الموافقة.',
                    pendingApproval: true
                });
            }
            const { password: _, verificationCode, verificationExpiry, ...userWithoutPassword } = user;
            const expiresIn = rememberMe ? '30d' : '24h';
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, emailVerified: !!user.emailVerified },
                SECRET_KEY,
                { expiresIn }
            );
            res.json({ accessToken, user: userWithoutPassword });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (e) {
        console.error('[LOGIN_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
});

// Register
router.post('/register', authLimiter, async (req, res) => {
    const { email, password, name, nameEn, whatsapp, country, age, gender, educationLevel, role = 'student' } = req.body;

    // Password strength validation
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', errorAr: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    try {
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const id = 'user_' + crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        // Find available supervisor
        let supervisorId = null;
        try {
            const supervisors = db.prepare(`
                SELECT id, supervisor_capacity, supervisor_priority 
                FROM users 
                WHERE role = 'supervisor'
            `).all();

            const candidates = supervisors.map(sv => {
                const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;
                return { ...sv, count };
            }).filter(sv => sv.count < (sv.supervisor_capacity || 0));

            // Sort by count (ASC) then priority (ASC)
            candidates.sort((a, b) => {
                if (a.count !== b.count) return a.count - b.count;
                return (a.supervisor_priority || 999) - (b.supervisor_priority || 999);
            });

            if (candidates.length > 0) {
                supervisorId = candidates[0].id;
            }
        } catch (svError) {
            console.error('Error finding supervisor during registration:', svError);
        }

        const newUser = {
            id, email, password: hashedPassword, name, nameEn: nameEn || name, role,
            points: 0, level: 1, joinDate: new Date().toISOString().split('T')[0],
            verificationCode: otp, verificationExpiry: expiry, emailVerified: 0,
            whatsapp: whatsapp || '', country: country || '', age: age || 0,
            gender: gender || '', educationLevel: educationLevel || '',
            supervisor_id: supervisorId
        };

        db.prepare(`
            INSERT INTO users (id, email, password, name, nameEn, role, points, level, joinDate, verificationCode, verificationExpiry, emailVerified, whatsapp, country, age, gender, educationLevel, supervisor_id, approved)
            VALUES (@id, @email, @password, @name, @nameEn, @role, @points, @level, @joinDate, @verificationCode, @verificationExpiry, @emailVerified, @whatsapp, @country, @age, @gender, @educationLevel, @supervisor_id, 0)
        `).run(newUser);

        // NOTE: Auto-enrollment is now deferred until admin approval

        // Send verification email (non-blocking to prevent SMTP timeout from failing registration)
        sendVerificationEmail(email, name, otp).catch(emailErr => {
            console.error('[Registration] Email sending failed:', emailErr.message);
        });

        res.status(201).json({ success: true, message: 'User registered. Please verify email.' });
    } catch (e) {
        console.error('[REGISTER_ERROR]:', e.message);
        // Handle duplicate email from race condition (double-click)
        if (e.message && e.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل', errorAr: 'هذا البريد الإلكتروني مسجل بالفعل' });
        }
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.', errorAr: 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.' });
    }
});

// Verify Email
router.post('/verify-email', authLimiter, (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.verificationCode !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.verificationExpiry)) return res.status(400).json({ error: 'OTP expired' });

        db.prepare('UPDATE users SET emailVerified = 1, verificationCode = NULL, verificationExpiry = NULL WHERE id = ?').run(user.id);

        // If student is not yet approved, do NOT return accessToken - just confirm verification
        if (user.role === 'student' && !user.approved) {
            return res.json({
                success: true,
                pendingApproval: true,
                message: 'Email verified. Your account is pending admin approval.',
                messageAr: 'تم التحقق من بريدك الإلكتروني. حسابك بانتظار موافقة المسؤولين.'
            });
        }

        // For approved users or non-students, return full login data
        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, emailVerified: true }, SECRET_KEY, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: { ...userWithoutPassword, emailVerified: true }, accessToken });
    } catch (e) {
        console.error('[VERIFY_EMAIL_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء التحقق من البريد' });
    }
});
router.post('/resend-otp', authLimiter, async (req, res) => {
    const { email } = req.body;
    try {
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const result = db.prepare('UPDATE users SET verificationCode = ?, verificationExpiry = ? WHERE LOWER(email) = LOWER(?)').run(otp, expiry, email);
        if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
        const user = db.prepare('SELECT name FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await sendVerificationEmail(email, user.name, otp);
        res.json({ success: true });
    } catch (e) {
        console.error('[RESEND_OTP_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء إعادة إرسال الرمز' });
    }
});
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Forgot Password (Public) - Generates OTP instead of overwriting password
router.post('/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required', errorAr: 'يرجى إدخال البريد الإلكتروني' });

    try {
        const user = db.prepare('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found', errorAr: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' });
        }

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
        db.prepare('UPDATE users SET verificationCode = ?, verificationExpiry = ? WHERE id = ?').run(otp, expiry, user.id);

        const emailResult = await sendPasswordResetOtpEmail(user.email, user.name, otp);

        if (!emailResult.success) {
            console.error('[FORGOT_PASSWORD] Failed to send email:', emailResult.error);
            return res.status(500).json({ error: 'Failed to send email', errorAr: 'فشل في إرسال البريد الإلكتروني. حاول مرة أخرى.' });
        }

        console.log(`[AUTH] Password reset OTP sent for user ${user.id} (${user.email})`);
        res.json({ success: true, message: 'OTP sent to your email', messageAr: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
    } catch (e) {
        console.error('[FORGOT_PASSWORD_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
    }
});

// Reset Password (Public) - Verify OTP and update password
router.post('/reset-password', authLimiter, async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields', errorAr: 'يرجى إملاء جميع الحقول المطلوبة' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', errorAr: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    try {
        const user = db.prepare('SELECT id, verificationCode, verificationExpiry FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found', errorAr: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' });
        }

        if (user.verificationCode !== otp) {
            return res.status(400).json({ error: 'Invalid OTP', errorAr: 'الرمز المدخل غير صحيح' });
        }

        if (new Date(user.verificationExpiry) < new Date()) {
            return res.status(400).json({ error: 'OTP expired', errorAr: 'انتهت صلاحية الرمز، يرجى طلب رمز جديد' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ?, verificationCode = NULL, verificationExpiry = NULL WHERE id = ?').run(hashedPassword, user.id);

        console.log(`[AUTH] Password reset successful for user ${user.id}`);
        res.json({ success: true, message: 'Password updated successfully', messageAr: 'تم تعيين كلمة المرور الجديدة بنجاح' });
    } catch (e) {
        console.error('[RESET_PASSWORD_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
    }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Please provide both current and new password' });
    }

    // Password strength validation
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters', errorAr: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    try {
        // Get user current password
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(403).json({ error: 'Incorrect current password' });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (e) {
        console.error('[CHANGE_PASSWORD_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تغيير كلمة المرور' });
    }
});
// Admin: Pending Students Management
// ============================================================================

// Get all pending (unapproved) students
router.get('/pending-students', authenticateToken, requireAdmin, (req, res) => {
    try {
        const students = db.prepare(`
            SELECT id, name, nameEn, email, whatsapp, country, age, gender, educationLevel, joinDate, emailVerified, approved
            FROM users
            WHERE role = 'student' AND approved = 0 AND emailVerified = 1
            ORDER BY joinDate DESC
        `).all();
        res.json(students);
    } catch (e) {
        console.error('[PENDING_STUDENTS_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch pending students' });
    }
});

// Approve a student
router.post('/approve-student/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        if (student.approved) return res.status(400).json({ error: 'Student already approved' });

        // Approve the student
        db.prepare('UPDATE users SET approved = 1 WHERE id = ?').run(id);

        // Auto-enroll in foundational course upon approval
        try {
            const foundationalCourseId = 'course_madkhal';
            const fCourse = db.prepare('SELECT days_available FROM courses WHERE id = ?').get(foundationalCourseId);
            if (fCourse) {
                const date = new Date();
                date.setDate(date.getDate() + (fCourse.days_available || 30));
                const deadline = date.toISOString();
                const enrollResult = db.prepare(`
                    INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at, deadline, progress, completed, is_locked)
                    VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0)
                `).run(id, foundationalCourseId, deadline);
                // Fix #9: Only increment students_count after successful INSERT (not when IGNORE fires)
                if (enrollResult.changes > 0) {
                    db.prepare('UPDATE courses SET students_count = students_count + 1 WHERE id = ?').run(foundationalCourseId);
                }
                console.log(`[ADMIN] Auto-enrolled approved student ${id} in ${foundationalCourseId}`);
            }
        } catch (enrollErr) {
            console.error('[ADMIN] Failed to auto-enroll approved student:', enrollErr.message);
        }

        // Send approval notification email
        sendApprovalNotificationEmail(student.email, student.name).catch(err => {
            console.error('[ADMIN] Failed to send approval email:', err.message);
        });

        // Log the action
        try {
            db.prepare(`
                INSERT INTO system_activity_logs (id, userId, action, details, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run('log_' + crypto.randomUUID(), req.user.id, 'approve_student', `Approved student: ${student.name} (${student.email})`, new Date().toISOString());
        } catch (logErr) {}

        console.log(`[ADMIN] Student ${id} approved by admin ${req.user.id}`);
        res.json({ success: true, message: 'Student approved successfully' });
    } catch (e) {
        console.error('[APPROVE_STUDENT_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to approve student' });
    }
});

// Reject a student
router.post('/reject-student/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const student = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'student'").get(id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Send rejection notification email
        sendRejectionNotificationEmail(student.email, student.name, reason || '').catch(err => {
            console.error('[ADMIN] Failed to send rejection email:', err.message);
        });

        // Delete the student account
        db.prepare('DELETE FROM users WHERE id = ?').run(id);

        // Log the action
        try {
            db.prepare(`
                INSERT INTO system_activity_logs (id, userId, action, details, timestamp)
                VALUES (?, ?, ?, ?, ?)
            `).run('log_' + crypto.randomUUID(), req.user.id, 'reject_student', `Rejected student: ${student.name} (${student.email})${reason ? ' - Reason: ' + reason : ''}`, new Date().toISOString());
        } catch (logErr) {}

        console.log(`[ADMIN] Student ${id} rejected by admin ${req.user.id}`);
        res.json({ success: true, message: 'Student rejected and removed' });
    } catch (e) {
        console.error('[REJECT_STUDENT_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to reject student' });
    }
});

module.exports = router;
