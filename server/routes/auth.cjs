const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { generateOTP, sendVerificationEmail } = require('../email.cjs');

const SECRET_KEY = process.env.SECRET_KEY || 'your-default-secret';

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(400).json({ error: 'Cannot find user' });

        const passwordMatch = bcrypt.compareSync(password, user.password);
        if (passwordMatch) {
            if (user.role === 'student' && !user.emailVerified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    errorAr: 'البريد الإلكتروني لم يتم تفعيله بعد',
                    needsVerification: true,
                    email: user.email
                });
            }
            const { password: _, verificationCode, verificationExpiry, ...userWithoutPassword } = user;
            const accessToken = jwt.sign(
                { id: user.id, email: user.email, role: user.role, emailVerified: !!user.emailVerified },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ accessToken, user: userWithoutPassword });
        } else {
            res.status(403).json({ error: 'Invalid password' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, name, nameEn, whatsapp, country, age, gender, educationLevel, role = 'student' } = req.body;

    // Password strength validation
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', errorAr: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    try {
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const id = 'user_' + crypto.randomUUID();
        const hashedPassword = bcrypt.hashSync(password, 10);
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
            INSERT INTO users (id, email, password, name, nameEn, role, points, level, joinDate, verificationCode, verificationExpiry, emailVerified, whatsapp, country, age, gender, educationLevel, supervisor_id)
            VALUES (@id, @email, @password, @name, @nameEn, @role, @points, @level, @joinDate, @verificationCode, @verificationExpiry, @emailVerified, @whatsapp, @country, @age, @gender, @educationLevel, @supervisor_id)
        `).run(newUser);

        // Auto-enroll new students in the foundational course
        if (role === 'student') {
            try {
                const foundationalCourseId = 'course_madkhal';
                const fCourse = db.prepare('SELECT days_available FROM courses WHERE id = ?').get(foundationalCourseId);
                if (fCourse) {
                    const date = new Date();
                    date.setDate(date.getDate() + (fCourse.days_available || 30));
                    const deadline = date.toISOString();
                    db.prepare(`
                        INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at, deadline, progress, completed, is_locked)
                        VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0)
                    `).run(id, foundationalCourseId, deadline);
                    db.prepare('UPDATE courses SET students_count = students_count + 1 WHERE id = ?').run(foundationalCourseId);
                    console.log(`[AUTH] Auto-enrolled new student ${id} in ${foundationalCourseId}`);
                }
            } catch (enrollErr) {
                console.error('[AUTH] Failed to auto-enroll new student:', enrollErr.message);
            }
        }

        // Send verification email (non-blocking to prevent SMTP timeout from failing registration)
        sendVerificationEmail(email, name, otp).catch(emailErr => {
            console.error('[Registration] Email sending failed:', emailErr.message);
        });

        res.status(201).json({ success: true, message: 'User registered. Please verify email.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Verify Email
router.post('/verify-email', (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.verificationCode !== otp) return res.status(400).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.verificationExpiry)) return res.status(400).json({ error: 'OTP expired' });

        db.prepare('UPDATE users SET emailVerified = 1, verificationCode = NULL, verificationExpiry = NULL WHERE id = ?').run(user.id);
        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, emailVerified: true }, SECRET_KEY, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: { ...userWithoutPassword, emailVerified: true }, accessToken });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
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
        res.status(500).json({ error: e.message });
    }
});

// Import middleware
const { authenticateToken } = require('../middleware.cjs');

// Change Password
router.post('/change-password', authenticateToken, (req, res) => {
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
        const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(403).json({ error: 'Incorrect current password' });
        }

        // Hash new password and update
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
