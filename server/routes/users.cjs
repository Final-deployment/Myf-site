/**
 * User Routes Module
 * 
 * Handles user CRUD operations with proper authentication and authorization.
 * 
 * @module server/routes/users
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin, requireAdminOrSupervisor } = require('../middleware.cjs');

// The protected support manager account — cannot be deleted, demoted, or have its role changed
const PROTECTED_MANAGER_ID = 'admin_manager';

// ============================================================================
// SECURITY: Whitelist of allowed update fields (prevents SQL injection)
// ============================================================================
const STUDENT_UPDATE_FIELDS = [
    'name', 'nameEn', 'avatar', 'whatsapp', 'country', 'age', 'gender', 'educationLevel'
];

const ADMIN_UPDATE_FIELDS = [
    ...STUDENT_UPDATE_FIELDS,
    'status', 'points', 'level', 'streak',
    'supervisor_id', 'supervisor_capacity', 'supervisor_priority'
];

// ============================================================================
// Get all users (Admin Only)
// ============================================================================
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search ? req.query.search.toLowerCase() : '';
        const roleFilter = req.query.role || '';

        let baseQuery = `
            SELECT u.id, u.name, u.email, u.role, u.points, u.level, u.joinDate, u.status,
            u.supervisor_capacity as supervisorCapacity, u.supervisor_priority as supervisorPriority, u.supervisor_id as supervisorId,
            (SELECT COUNT(*) FROM episode_progress ep INNER JOIN episodes e ON ep.episode_id = e.id AND e.courseId = ep.course_id WHERE ep.user_id = u.id AND ep.completed = 1) as completedLessons,
            (SELECT GROUP_CONCAT(c.title, ', ') FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = u.id) as activeCourses
            FROM users u
            WHERE 1=1
        `;

        const params = [];
        if (search) {
            baseQuery += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (roleFilter) {
            baseQuery += ` AND u.role = ?`;
            params.push(roleFilter);
        }

        if (!isNaN(page) && page > 0) {
            // Paginated Response
            const countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1 ` + 
                (search ? ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)` : '') +
                (roleFilter ? ` AND u.role = ?` : '');
            
            const total = db.prepare(countQuery).get(...params).total;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;

            baseQuery += ` ORDER BY u.joinDate DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const users = db.prepare(baseQuery).all(...params);
            return res.json({
                data: users,
                pagination: { total, page, limit, totalPages }
            });
        }

        // Backward compatibility: Unpaginated
        const users = db.prepare(baseQuery).all(...params);
        res.json(users);
    } catch (e) {
        console.error('[USERS_GET_ALL_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ============================================================================
// Get students list with progress (Admin/Supervisor)
// ============================================================================
router.get('/students', authenticateToken, requireAdminOrSupervisor, (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search ? req.query.search.toLowerCase() : '';

        let baseQuery = `
            SELECT u.id, u.name, u.email, u.role, u.points, u.level, u.joinDate, u.status, u.supervisor_id as supervisorId,
            (SELECT COUNT(*) FROM episode_progress ep INNER JOIN episodes e ON ep.episode_id = e.id AND e.courseId = ep.course_id WHERE ep.user_id = u.id AND ep.completed = 1) as completedLessons,
            (SELECT GROUP_CONCAT(c.title, ', ') FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = u.id) as activeCourses
            FROM users u
            WHERE u.role = 'student'
        `;

        const params = [];
        if (req.user.role === 'supervisor') {
            baseQuery += ` AND u.supervisor_id = ?`;
            params.push(req.user.id);
        }
        if (search) {
            baseQuery += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (!isNaN(page) && page > 0) {
            let countQuery = `SELECT COUNT(*) as total FROM users u WHERE u.role = 'student'`;
            if (req.user.role === 'supervisor') countQuery += ` AND u.supervisor_id = ?`;
            if (search) countQuery += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)`;

            const total = db.prepare(countQuery).get(...params).total;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;

            baseQuery += ` ORDER BY u.joinDate DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const students = db.prepare(baseQuery).all(...params);
            return res.json({
                data: students,
                pagination: { total, page, limit, totalPages }
            });
        }

        // Backward compatibility
        const students = db.prepare(baseQuery).all(...params);
        res.json(students);
    } catch (e) {
        console.error('[USERS_GET_STUDENTS_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// ============================================================================
// Create new user (Admin Only)
// ============================================================================
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role = 'student',
            nameEn,
            avatar,
            streak = 0,
            status = 'active',
            points = 0,
            level = 1
        } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields: name, email, password' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check existing
        const existing = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Find available supervisor for students
        let supervisorId = null;
        if (role === 'student') {
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

                candidates.sort((a, b) => {
                    if (a.count !== b.count) return a.count - b.count;
                    return (a.supervisor_priority || 999) - (b.supervisor_priority || 999);
                });

                if (candidates.length > 0) {
                    supervisorId = candidates[0].id;
                }
            } catch (svError) {
                console.error('[SUPERVISOR_ASSIGNMENT_ERROR]:', svError.message);
            }
        }

        const newUser = {
            id: 'user_' + crypto.randomUUID(),
            name,
            nameEn: nameEn || name,
            email,
            password: hashedPassword,
            role,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=064e3b&color=fff&size=100`,
            joinDate: new Date().toISOString().split('T')[0],
            points,
            level,
            streak,
            status,
            emailVerified: 1,
            supervisor_id: supervisorId,
            approved: 1
        };

        db.prepare(`
            INSERT INTO users (id, name, nameEn, email, password, role, avatar, joinDate, points, level, streak, status, emailVerified, supervisor_id, approved) 
            VALUES (@id, @name, @nameEn, @email, @password, @role, @avatar, @joinDate, @points, @level, @streak, @status, @emailVerified, @supervisor_id, @approved)
        `).run(newUser);

        const { password: _, ...userWithoutPass } = newUser;
        console.log(`[USER_CREATED] Admin ${req.user.id} created user ${newUser.id}`);
        res.json(userWithoutPass);
    } catch (e) {
        console.error('[ADMIN_CREATE_USER_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// ============================================================================
// Update user profile (Owner or Admin)
// SECURITY FIX: Using whitelist to prevent SQL injection
// ============================================================================
router.put('/:id', authenticateToken, requireOwnerOrAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // PROTECTION: Block role/status changes on the protected manager account
    if (id === PROTECTED_MANAGER_ID && req.user.id !== PROTECTED_MANAGER_ID) {
        // Only the manager themselves can update their own profile (name, avatar, etc.)
        // No one else can change their role or status
        if (updates.role || updates.status) {
            return res.status(403).json({ error: 'لا يمكن تعديل صلاحيات أو حالة حساب مدير الدعم الفني' });
        }
    }
    // Even the manager themselves cannot change their own role
    if (id === PROTECTED_MANAGER_ID && updates.role && updates.role !== 'admin') {
        return res.status(403).json({ error: 'لا يمكن تغيير رتبة حساب مدير الدعم الفني' });
    }

    try {
        // Filter updates to only allowed fields (SECURITY: prevents SQL injection)
        const safeUpdates = {};
        const allowedFields = (req.user.role === 'admin' || req.user.role === 'supervisor') 
            ? ADMIN_UPDATE_FIELDS 
            : STUDENT_UPDATE_FIELDS;
            
        for (const key of Object.keys(updates)) {
            let isAllowed = allowedFields.includes(key);

            // Allow admins to update the role
            if (key === 'role' && req.user.role === 'admin') {
                isAllowed = true;
            }

            if (isAllowed) {
                safeUpdates[key] = updates[key];
            } else {
                console.warn(`[SECURITY] Blocked attempt to update field: ${key} by user ${req.user.id}`);
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Build parameterized query
        const fields = Object.keys(safeUpdates).map(k => {
            if (!/^[a-zA-Z_]+$/.test(k)) throw new Error('Invalid field name');
            return `${k} = ?`;
        }).join(', ');
        const values = Object.values(safeUpdates);

        const result = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[USER_UPDATED] User ${req.user.id} updated user ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[USER_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ============================================================================
// Delete user (Admin Only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // PROTECTION: Block deletion of the protected manager account
    if (id === PROTECTED_MANAGER_ID) {
        return res.status(403).json({ error: 'لا يمكن حذف حساب مدير الدعم الفني - هذا الحساب محمي من الحذف' });
    }

    try {
        try {
            db.transaction(() => {
                const cleanup = [
                    { t: 'enrollments', c: 'user_id' },
                    { t: 'episode_progress', c: 'user_id' },
                    { t: 'quiz_results', c: 'userId' },
                    { t: 'certificates', c: 'user_id' },
                    { t: 'favorites', c: 'userId' },
                    { t: 'ratings', c: 'userId' },
                    { t: 'messages', c: 'senderId' },
                    { t: 'messages', c: 'receiverId' },
                    { t: 'system_activity_logs', c: 'userId' }
                ];
                for (let {t, c} of cleanup) {
                    try { db.prepare(`DELETE FROM ${t} WHERE ${c} = ?`).run(id); } catch(ex) {}
                }
            })();
        } catch(e) { console.error('[USER_CLEANUP_WARN]:', e.message); }

        const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[USER_DELETED] Admin ${req.user.id} deleted user ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[USER_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============================================================================
// Get user details (Owner or Admin/Supervisor)
// ============================================================================
router.get('/:id/details', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Check authorization
    const isOwner = req.user.id === id;
    const isAdmin = req.user.role === 'admin';
    const isSupervisor = req.user.role === 'supervisor';

    if (!isOwner && !isAdmin && !isSupervisor) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const userData = db.prepare(`
            SELECT id, name, nameEn, email, role, avatar, status, joinDate, points, level, whatsapp, country,
                   age, gender, educationLevel,
                   supervisor_capacity as supervisorCapacity, 
                   supervisor_priority as supervisorPriority,
                   supervisor_id as supervisorId
            FROM users WHERE id = ?
        `).get(id);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }



        const user = { ...userData };

        // Supervisors can only view their assigned students
        if (isSupervisor && !isOwner && user.supervisorId !== req.user.id) {
            return res.status(403).json({ error: 'هذا الأمر من صلاحيات مشرف آخر أو من صلاحيات الإدارة وليس من صلاحياتك' });
        }

        // Get supervisor name if applicable
        if (user.supervisorId) {
            const supervisor = db.prepare('SELECT name FROM users WHERE id = ?').get(user.supervisorId);
            if (supervisor) {
                user.supervisorName = supervisor.name;
            }
        }

        // Get student count for supervisors
        if (user.role === 'supervisor') {
            const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(id).count;
            user.studentCount = studentCount;
        }

        // Get enrollments
        const enrollments = db.prepare(`
            SELECT e.course_id, c.title as courseTitle, e.progress, e.last_accessed, e.enrolled_at, e.is_locked, e.deadline,
                   c.lessons_count,
                   (SELECT COUNT(*) FROM episode_progress ep INNER JOIN episodes eps ON ep.episode_id = eps.id AND eps.courseId = ep.course_id WHERE ep.user_id = e.user_id AND ep.course_id = e.course_id AND ep.completed = 1) as completed_lessons
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.user_id = ?
        `).all(id);

        // Get quiz results grouped by course
        const quizResults = db.prepare(`
            SELECT qr.quizId, qr.score, qr.total, qr.percentage, qr.completedAt,
                   q.title as quizTitle, q.courseId, q.passing_score,
                   c.title as courseTitle
            FROM quiz_results qr
            JOIN quizzes q ON qr.quizId = q.id
            LEFT JOIN courses c ON q.courseId = c.id
            WHERE qr.userId = ?
            ORDER BY qr.completedAt DESC
        `).all(id);

        // Get total courses count
        const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses WHERE status = ?').get('published');

        // Get certificates
        const certificates = db.prepare(`
            SELECT cert.id, c.title as courseTitle, cert.issue_date as issueDate 
            FROM certificates cert 
            JOIN courses c ON cert.course_id = c.id 
            WHERE cert.user_id = ?
        `).all(id);

        // Get extension archive
        const extensions = db.prepare(`
            SELECT ea.id, ea.course_id, c.title as courseTitle, ea.extended_at, ea.days_added,
                   u.name as extendedBy, u.role as extendedByRole
            FROM extension_archive ea
            JOIN courses c ON ea.course_id = c.id
            JOIN users u ON ea.extended_by = u.id
            WHERE ea.user_id = ?
            ORDER BY ea.extended_at DESC
        `).all(id);

        // Calculate academic summary
        const completedCourses = enrollments.filter(e => e.progress >= 100).length;
        const totalQuizzes = quizResults.length;
        const avgScore = totalQuizzes > 0 
            ? Math.round(quizResults.reduce((sum, qr) => sum + (qr.percentage || 0), 0) / totalQuizzes) 
            : 0;

        const academicSummary = {
            enrolledCourses: enrollments.length,
            completedCourses,
            remainingCourses: (totalCourses?.count || 0) - enrollments.length,
            totalAvailableCourses: totalCourses?.count || 0,
            totalQuizzes,
            avgQuizScore: avgScore,
            certificatesCount: certificates.length
        };

        res.json({ user, enrollments, quizResults, academicSummary, certificates, extensions });
    } catch (e) {
        console.error('[USER_DETAILS_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// ============================================================================
// Unlock a student's course (Admin or Supervisor only)
// ============================================================================
router.put('/:userId/enrollment/:courseId/unlock', authenticateToken, requireAdminOrSupervisor, (req, res) => {
    const { userId, courseId } = req.params;

    try {
        // If supervisor, check if this student belongs to them
        if (req.user.role === 'supervisor') {
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(userId);
            if (!student || student.supervisor_id !== req.user.id) {
                return res.status(403).json({ error: 'هذا الأمر من صلاحيات مشرف آخر أو من صلاحيات الإدارة وليس من صلاحياتك' });
            }
        }

        // Get course to calculate new deadline
        const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const days = 2; // Always extend by 2 days per user request
        const date = new Date();
        date.setDate(date.getDate() + days);
        const newDeadline = date.toISOString();

        db.transaction(() => {
            const result = db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0, deadline = ?
                WHERE user_id = ? AND course_id = ?
            `).run(newDeadline, userId, courseId);

            if (result.changes === 0) {
                throw new Error('Enrollment not found');
            }

            // Log the extension to the archive
            db.prepare(`
                INSERT INTO extension_archive (user_id, course_id, extended_by, days_added)
                VALUES (?, ?, ?, ?)
            `).run(userId, courseId, req.user.id, days);
        })();

        res.json({ success: true, message: 'Course unlocked successfully', newDeadline });
    } catch (e) {
        console.error('[UNLOCK_COURSE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to unlock course' });
    }
});

// ============================================================================
// Favorites (Owner Only)
// ============================================================================
router.get('/:id/favorites', authenticateToken, requireOwnerOrAdmin, (req, res) => {
    const { id } = req.params;
    try {
        const favorites = db.prepare('SELECT * FROM favorites WHERE userId = ?').all(id);
        res.json(favorites);
    } catch (e) {
        console.error('[FAVORITES_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

router.post('/:id/favorites/toggle', authenticateToken, requireOwnerOrAdmin, (req, res) => {
    const { id: userId } = req.params;
    const { targetId, type } = req.body;

    if (!targetId || !type) {
        return res.status(400).json({ error: 'Missing targetId or type' });
    }

    try {
        const existing = db.prepare('SELECT * FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')
            .get(userId, targetId, type);

        if (existing) {
            db.prepare('DELETE FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')
                .run(userId, targetId, type);
            res.json({ action: 'removed', success: true });
        } else {
            db.prepare('INSERT INTO favorites (userId, targetId, type) VALUES (?, ?, ?)')
                .run(userId, String(targetId), type);
            res.json({ action: 'added', success: true });
        }
    } catch (e) {
        console.error('[FAVORITES_TOGGLE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

module.exports = router;
