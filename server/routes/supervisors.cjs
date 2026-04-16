const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// The protected support manager account — cannot be promoted/demoted
const PROTECTED_MANAGER_ID = 'admin_manager';
const { authenticateToken } = require('../middleware.cjs');

// Apply authentication middleware to all routes
router.use(authenticateToken);
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
}

// Get all supervisors
router.get('/', isAdmin, (req, res) => {
    try {
        const supervisors = db.prepare(`
            SELECT id, email, name, role, 
                   supervisor_capacity as supervisorCapacity, 
                   supervisor_priority as supervisorPriority 
            FROM users 
            WHERE role = 'supervisor' 
            ORDER BY supervisor_priority ASC
        `).all();

        const supervisorsWithStats = supervisors.map(sv => {
            const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;
            return {
                ...sv,
                studentCount
            };
        });

        res.json(supervisorsWithStats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Promote a user to supervisor
router.post('/promote', isAdmin, (req, res) => {
    const { userId, capacity, priority } = req.body;
    // PROTECTION: Block role change on the protected manager account
    if (userId === PROTECTED_MANAGER_ID) {
        return res.status(403).json({ error: 'لا يمكن تغيير رتبة حساب مدير الدعم الفني' });
    }
    try {
        const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        db.prepare(`
            UPDATE users 
            SET role = 'supervisor', 
                supervisor_capacity = ?, 
                supervisor_priority = ? 
            WHERE id = ?
        `).run(capacity || 10, priority || 0, userId);
        res.json({ success: true, message: 'User promoted to supervisor' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update supervisor settings
router.post('/settings', isAdmin, (req, res) => {
    const { supervisorId, capacity, priority } = req.body;
    console.log('[SV_SETTINGS] Request:', { supervisorId, capacity, priority });
    try {
        const info = db.prepare(`
            UPDATE users 
            SET supervisor_capacity = ?, 
                supervisor_priority = ? 
            WHERE id = ? AND role = 'supervisor'
        `).run(capacity, priority, supervisorId);

        if (process.env.NODE_ENV !== 'production') {
            console.log('[SV_SETTINGS] Update Result:', info);
        }

        if (info.changes === 0) {
            console.warn('[SV_SETTINGS] Warning: No rows updated. Check ID or Role.');
        }

        res.json({ success: true, message: 'Supervisor settings updated' });
    } catch (e) {
        console.error('[SV_SETTINGS] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Assign student to supervisor
router.post('/assign', isAdmin, (req, res) => {
    const { studentId, supervisorId } = req.body;
    if (process.env.NODE_ENV !== 'production') {
        console.log('[SV_ASSIGN] Request:', { studentId, supervisorId });
    }
    try {
        const student = db.prepare('SELECT role FROM users WHERE id = ?').get(studentId);
        if(!student || student.role !== 'student') {
            return res.status(400).json({ error: 'يمكن ربط حسابات الطلاب فقط بالمشرفين' });
        }
        
        // supervisorId can be null to assign to Admin
        const info = db.prepare("UPDATE users SET supervisor_id = ? WHERE id = ? AND role = 'student'").run(supervisorId || null, studentId);
        if (process.env.NODE_ENV !== 'production') {
            console.log('[SV_ASSIGN] Result:', info);
        }
        res.json({ success: true, message: 'Student assigned successfully' });
    } catch (e) {
        console.error('[SV_ASSIGN] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Demote supervisor and reassign students
router.post('/demote', isAdmin, (req, res) => {
    const { supervisorId, targetSupervisorId } = req.body;
    // PROTECTION: Block role change on the protected manager account
    if (supervisorId === PROTECTED_MANAGER_ID) {
        return res.status(403).json({ error: 'لا يمكن تغيير رتبة حساب مدير الدعم الفني' });
    }
    try {
        db.transaction(() => {
            // Reassign students
            db.prepare('UPDATE users SET supervisor_id = ? WHERE supervisor_id = ?')
                .run(targetSupervisorId || null, supervisorId);

            // Demote supervisor
            db.prepare(`
                UPDATE users 
                SET role = 'student', 
                    supervisor_capacity = 0, 
                    supervisor_priority = 0,
                    supervisor_id = NULL
                WHERE id = ?
            `).run(supervisorId);
        })();
        res.json({ success: true, message: 'Supervisor demoted and students reassigned' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get students assigned to the current supervisor
router.get('/my-students', (req, res) => {
    try {
        const supervisorId = req.user.id;
        if (process.env.NODE_ENV !== 'production') {
            console.log('[MY_STUDENTS] Fetching for supervisor:', supervisorId);
        }

        const students = db.prepare(`
            SELECT u.id, u.name, u.email, u.role, u.points, u.level, u.joinDate, u.status,
            (SELECT COUNT(*) FROM episode_progress ep WHERE ep.user_id = u.id AND ep.completed = 1) as completedLessons,
            (SELECT GROUP_CONCAT(c.title, ', ') FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = u.id) as activeCourses
            FROM users u
            WHERE u.supervisor_id = ?
        `).all(supervisorId);

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[MY_STUDENTS] Found ${students.length} students`);
        }
        res.json(students);
    } catch (e) {
        console.error('[MY_STUDENTS] ERROR:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get detailed progress for supervisor's students
router.get('/students-progress', (req, res) => {
    try {
        const supervisorId = req.user.role === 'admin' ? null : req.user.id;

        let studentsQuery = `
            SELECT u.id, u.name, u.email 
            FROM users u
            WHERE u.role = 'student'
        `;
        const params = [];

        if (supervisorId) {
            studentsQuery += ` AND u.supervisor_id = ?`;
            params.push(supervisorId);
        } else if (req.user.role === 'admin' && req.query.supervisorId) {
            // SECURITY: Only admins can filter by arbitrary supervisorId
            studentsQuery += ` AND u.supervisor_id = ?`;
            params.push(req.query.supervisorId);
        }

        const students = db.prepare(studentsQuery).all(...params);

        const progressData = students.map(student => {
            const enrollments = db.prepare(`
                SELECT e.course_id, c.title, e.progress, e.deadline, e.is_locked, c.days_available
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.user_id = ?
            `).all(student.id);

            return {
                ...student,
                courses: enrollments.map(en => {
                    let daysRemaining = 0;
                    if (en.deadline) {
                        const diff = new Date(en.deadline).getTime() - Date.now();
                        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
                    }
                    return {
                        courseId: en.course_id,
                        title: en.title,
                        progress: en.progress,
                        deadline: en.deadline,
                        isLocked: !!en.is_locked,
                        daysAvailable: en.days_available,
                        daysRemaining
                    };
                })
            };
        });

        res.json(progressData);
    } catch (e) {
        console.error('[STUDENTS_PROGRESS_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Unlock course
router.post('/students/:userId/courses/:courseId/unlock', (req, res) => {
    const { userId, courseId } = req.params;
    const { extraDays } = req.body;

    try {
        if (req.user.role !== 'admin') {
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(userId);
            if (!student || student.supervisor_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to unlock for this student' });
            }
        }

        const days = parseInt(extraDays) || 2; // Default 2 extra days (aligned with users.cjs)
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + days);

        db.transaction(() => {
            db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0, deadline = ? 
                WHERE user_id = ? AND course_id = ?
            `).run(newDeadline.toISOString(), userId, courseId);

            // Log the extension to the archive
            db.prepare(`
                INSERT INTO extension_archive (user_id, course_id, extended_by, days_added)
                VALUES (?, ?, ?, ?)
            `).run(userId, courseId, req.user.id, days);
        })();

        res.json({ success: true, newDeadline: newDeadline.toISOString() });
    } catch (e) {
        console.error('[COURSE_UNLOCK_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
