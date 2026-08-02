const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { createNotification } = require('./notifications_internal.cjs');

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
        const supervisorsWithStats = db.prepare(`
            SELECT s.id, s.email, s.name, s.role, 
                   s.supervisor_capacity as supervisorCapacity, 
                   s.supervisor_priority as supervisorPriority,
                   COUNT(u.id) as studentCount
            FROM users s
            LEFT JOIN users u ON u.supervisor_id = s.id
            WHERE s.role = 'supervisor' 
            GROUP BY s.id
            ORDER BY s.supervisor_priority ASC
        `).all();

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
        const parsedCapacity = Math.max(1, parseInt(capacity) || 10);
        const parsedPriority = Math.max(0, parseInt(priority) || 0);

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
        `).run(parsedCapacity, parsedPriority, userId);
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
        const parsedCapacity = Math.max(1, parseInt(capacity) || 10);
        const parsedPriority = Math.max(0, parseInt(priority) || 0);

        const info = db.prepare(`
            UPDATE users 
            SET supervisor_capacity = ?, 
                supervisor_priority = ? 
            WHERE id = ? AND role = 'supervisor'
        `).run(parsedCapacity, parsedPriority, supervisorId);

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
            (SELECT COUNT(*) FROM episode_progress ep INNER JOIN episodes e ON ep.episode_id = e.id AND e.courseId = ep.course_id WHERE ep.user_id = u.id AND ep.completed = 1) as completedLessons,
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
            SELECT u.id, u.name, u.email,
                   e.course_id, c.title, e.progress, e.completed, e.deadline, e.is_locked, c.days_available
            FROM users u
            LEFT JOIN enrollments e ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE u.role = 'student'
        `;
        const params = [];

        if (supervisorId) {
            studentsQuery += ` AND u.supervisor_id = ?`;
            params.push(supervisorId);
        } else if (req.user.role === 'admin' && req.query.supervisorId) {
            studentsQuery += ` AND u.supervisor_id = ?`;
            params.push(req.query.supervisorId);
        }

        const rows = db.prepare(studentsQuery).all(...params);

        const studentsMap = new Map();
        for (const row of rows) {
            if (!studentsMap.has(row.id)) {
                studentsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    courses: []
                });
            }
            if (row.course_id) {
                let daysRemaining = 0;
                if (row.deadline) {
                    const diff = new Date(row.deadline).getTime() - Date.now();
                    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
                }
                let isLocked = !!row.is_locked;
                if (!isLocked && row.deadline && new Date() > new Date(row.deadline) && row.progress < 100 && !row.completed) {
                    isLocked = true;
                }
                studentsMap.get(row.id).courses.push({
                    courseId: row.course_id,
                    title: row.title,
                    progress: row.progress,
                    deadline: row.deadline,
                    isLocked,
                    daysAvailable: row.days_available,
                    daysRemaining
                });
            }
        }

        const progressData = Array.from(studentsMap.values());

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

        const days = parseInt(extraDays) || 2; // Default 2 extra days
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + days);

        db.transaction(() => {
            const result = db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0, deadline = ? 
                WHERE user_id = ? AND course_id = ?
            `).run(newDeadline.toISOString(), userId, courseId);

            if (result.changes === 0) {
                throw new Error('Enrollment not found');
            }

            // Log the extension to the archive
            db.prepare(`
                INSERT INTO extension_archive (user_id, course_id, extended_by, days_added)
                VALUES (?, ?, ?, ?)
            `).run(userId, courseId, req.user.id, days);
        })();

        res.json({ success: true, newDeadline: newDeadline.toISOString() });
    } catch (e) {
        if (e.message === 'Enrollment not found') {
            return res.status(404).json({ error: 'لم يتم العثور على تسجيل لهذا الطالب في المساق' });
        }
        console.error('[COURSE_UNLOCK_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Reset Exams / Reopen Course
router.post('/students/:userId/courses/:courseId/reset-exams', (req, res) => {
    const { userId, courseId } = req.params;
    const { extraDays } = req.body;

    try {
        if (req.user.role !== 'admin') {
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(userId);
            if (!student || student.supervisor_id !== req.user.id) {
                return res.status(403).json({ error: 'Not authorized to reset exams for this student' });
            }
        }

        const days = parseInt(extraDays) || 2;
        const newDeadline = new Date();
        newDeadline.setDate(newDeadline.getDate() + days);

        db.transaction(() => {
            // 1. Reset Quiz Results
            db.prepare(`
                DELETE FROM quiz_results 
                WHERE userId = ? 
                  AND quizId IN (SELECT id FROM quizzes WHERE courseId = ?)
            `).run(userId, courseId);

            // 2. Reset Enrollment
            const result = db.prepare(`
                UPDATE enrollments 
                SET progress = 0, completed = 0, is_locked = 0, deadline = ?, last_accessed = NULL 
                WHERE user_id = ? AND course_id = ?
            `).run(newDeadline.toISOString(), userId, courseId);

            if (result.changes === 0) {
                throw new Error('Enrollment not found');
            }

            // 3. Reset Episode Progress
            db.prepare(`
                UPDATE episode_progress
                SET completed = 0, watched_duration = 0, last_position = 0
                WHERE user_id = ? AND course_id = ?
            `).run(userId, courseId);

            // Log the extension to the archive
            db.prepare(`
                INSERT INTO extension_archive (user_id, course_id, extended_by, days_added)
                VALUES (?, ?, ?, ?)
            `).run(userId, courseId, req.user.id, days);
        })();

        // Send Notification to student
        const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId);
        createNotification(userId, 'info', 'إعادة تفعيل المساق', `تم إعادة تفعيل مساق "${course?.title || 'المساق'}" ومسح نتائج الاختبارات السابقة. أمامك ${days} أيام لإنجاز المساق.`);

        res.json({ success: true, message: 'تم إعادة فتح المساق ومسح نتائج الامتحانات بنجاح', newDeadline: newDeadline.toISOString() });
    } catch (e) {
        if (e.message === 'Enrollment not found') {
            return res.status(404).json({ error: 'لم يتم العثور على تسجيل لهذا الطالب في المساق' });
        }
        console.error('[COURSE_RESET_ERROR]:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// SECTIONS CRUD
// ============================================================================

// Get all sections with stats
router.get('/sections', isAdmin, (req, res) => {
    try {
        const sections = db.prepare(`
            SELECT s.id, s.name, s.supervisor_id, s.created_at,
                   u.name as supervisorName, u.email as supervisorEmail,
                   (SELECT COUNT(*) FROM users WHERE section_id = s.id AND role = 'student') as studentCount
            FROM sections s
            LEFT JOIN users u ON s.supervisor_id = u.id
            ORDER BY s.created_at DESC
        `).all();

        // Compute aggregate progress per section
        for (const section of sections) {
            const progress = db.prepare(`
                SELECT AVG(e.progress) as avgProgress,
                       SUM(CASE WHEN e.completed = 1 THEN 1 ELSE 0 END) as completedCount,
                       COUNT(e.user_id) as totalEnrollments
                FROM enrollments e
                JOIN users u ON e.user_id = u.id
                WHERE u.section_id = ?
            `).get(section.id);
            section.avgProgress = Math.round(progress.avgProgress || 0);
            section.completedCount = progress.completedCount || 0;
            section.totalEnrollments = progress.totalEnrollments || 0;
        }

        res.json(sections);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create a new section
router.post('/sections', isAdmin, (req, res) => {
    const { name, supervisorId } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'اسم الشعبة مطلوب' });
    }
    try {
        const id = 'sec_' + crypto.randomUUID();
        db.prepare('INSERT INTO sections (id, name, supervisor_id) VALUES (?, ?, ?)').run(id, name.trim(), supervisorId || null);
        res.status(201).json({ success: true, id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update a section
router.put('/sections/:id', isAdmin, (req, res) => {
    const { name, supervisorId } = req.body;
    try {
        db.prepare('UPDATE sections SET name = COALESCE(?, name), supervisor_id = ? WHERE id = ?').run(
            name ? name.trim() : null, supervisorId ?? null, req.params.id
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete a section
router.delete('/sections/:id', isAdmin, (req, res) => {
    try {
        db.transaction(() => {
            // Unlink students from the section
            db.prepare('UPDATE users SET section_id = NULL WHERE section_id = ?').run(req.params.id);
            // Delete group messages
            db.prepare('DELETE FROM group_messages WHERE section_id = ?').run(req.params.id);
            // Delete the section
            db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
        })();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Add students to a section (Admin or assigned Supervisor)
router.post('/sections/:id/students', (req, res) => {
    const { studentIds } = req.body; // Array of user IDs
    const sectionId = req.params.id;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'يجب تحديد طالب واحد على الأقل' });
    }

    try {
        const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(sectionId);
        if (!section) return res.status(404).json({ error: 'الشعبة غير موجودة' });

        // Auth: Admin can always do it; Supervisor must be the assigned one
        if (req.user.role !== 'admin' && req.user.id !== section.supervisor_id) {
            return res.status(403).json({ error: 'ليس لديك صلاحية لإضافة طلاب لهذه الشعبة' });
        }

        const update = db.prepare('UPDATE users SET section_id = ?, supervisor_id = ? WHERE id = ? AND role = ?');
        const batchTx = db.transaction((ids) => {
            for (const sid of ids) {
                update.run(sectionId, section.supervisor_id, sid, 'student');
            }
        });
        batchTx(studentIds);

        res.json({ success: true, count: studentIds.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Remove a student from a section
router.delete('/sections/:id/students/:userId', (req, res) => {
    try {
        const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
        if (!section) return res.status(404).json({ error: 'الشعبة غير موجودة' });

        if (req.user.role !== 'admin' && req.user.id !== section.supervisor_id) {
            return res.status(403).json({ error: 'ليس لديك صلاحية' });
        }

        db.prepare('UPDATE users SET section_id = NULL WHERE id = ? AND section_id = ?').run(req.params.userId, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get section progress (aggregate stats)
router.get('/sections/:id/progress', (req, res) => {
    const sectionId = req.params.id;
    try {
        const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(sectionId);
        if (!section) return res.status(404).json({ error: 'الشعبة غير موجودة' });

        // Auth check
        if (req.user.role !== 'admin' && req.user.id !== section.supervisor_id) {
            return res.status(403).json({ error: 'ليس لديك صلاحية' });
        }

        const students = db.prepare(`
            SELECT u.id, u.name, u.email,
                   e.course_id, c.title, e.progress, e.completed, e.deadline, e.is_locked
            FROM users u
            LEFT JOIN enrollments e ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE u.section_id = ? AND u.role = 'student'
        `).all(sectionId);

        // Group by student
        const studentsMap = new Map();
        for (const row of students) {
            if (!studentsMap.has(row.id)) {
                studentsMap.set(row.id, { id: row.id, name: row.name, email: row.email, courses: [] });
            }
            if (row.course_id) {
                studentsMap.get(row.id).courses.push({
                    courseId: row.course_id, title: row.title,
                    progress: row.progress, completed: !!row.completed,
                    deadline: row.deadline, isLocked: !!row.is_locked
                });
            }
        }

        res.json({
            section: { id: section.id, name: section.name },
            students: Array.from(studentsMap.values())
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
