/**
 * Certificates Routes Module
 * 
 * Handles certificate generation and retrieval.
 * Uses proper middleware for authentication.
 * 
 * @module server/routes/certificates
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

/**
 * Maps a database certificate record to the camelCase format expected by the frontend.
 */
function mapCertificate(cert) {
    if (!cert) return null;
    return {
        id: cert.id,
        userId: cert.user_id,
        courseId: cert.course_id,
        courseTitle: cert.course_title || cert.courseTitle || 'Unknown Course',
        studentId: cert.student_id || cert.user_id,
        userName: cert.user_name || cert.userName || 'Unknown Student',
        issueDate: cert.issue_date,
        grade: cert.grade,
        code: cert.certificate_code
    };
}

// ============================================================================
// Get user's own certificates (Authenticated)
// ============================================================================
router.get('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const certs = db.prepare('SELECT * FROM certificates WHERE user_id = ?').all(userId);
        res.json(certs.map(mapCertificate));
    } catch (e) {
        console.error('[CERTIFICATES_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
});

// ============================================================================
// Admin: Get ALL certificates
// ============================================================================
router.get('/all', authenticateToken, requireAdmin, (req, res) => {
    try {
        const certs = db.prepare('SELECT * FROM certificates ORDER BY issue_date DESC').all();
        console.log(`[CERTIFICATES_ALL] Admin ${req.user.id} fetched all certificates`);
        res.json(certs.map(mapCertificate));
    } catch (e) {
        console.error('[CERTIFICATES_ALL_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch all certificates' });
    }
});

// ============================================================================
// Admin: Issue Manual Certificate
// ============================================================================
router.post('/issue', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { studentName, courseTitle, grade, userId, courseId } = req.body;

        if (!studentName || !courseTitle) {
            return res.status(400).json({ error: 'Missing required fields: studentName, courseTitle' });
        }

        // Fix: Use a real user ID for manual certificates to satisfy Foreign Key constraint
        const isManual = userId && userId.startsWith('manual');
        const dbUserId = isManual ? 'manual_recipient' : userId;

        const cert = {
            id: crypto.randomUUID(),
            user_id: dbUserId,
            course_id: courseId || 'manual',
            course_title: courseTitle,
            student_id: userId || 'manual', // Keep original ID for records
            user_name: studentName,
            issue_date: new Date().toISOString().split('T')[0],
            grade: grade || 'Excellent',
            certificate_code: `MANUAL-${crypto.randomUUID().slice(0, 8)}`
        };


        db.prepare(`
            INSERT INTO certificates (id, user_id, course_id, course_title, student_id, user_name, issue_date, grade, certificate_code) 
            VALUES (@id, @user_id, @course_id, @course_title, @student_id, @user_name, @issue_date, @grade, @certificate_code)
        `).run(cert);

        console.log(`[CERTIFICATE_ISSUED] Admin ${req.user.id} issued manual certificate: ${cert.certificate_code}`);
        res.status(201).json(mapCertificate(cert));
    } catch (e) {
        console.error('[CERTIFICATE_ISSUE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
});

// ============================================================================
// Generate Course Certificate (Authenticated User)
// ============================================================================
router.post('/', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ error: 'courseId is required' });
        }

        // Check if certificate already exists
        const existing = db.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').get(user.id, courseId);
        if (existing) {
            return res.status(400).json({ error: 'Certificate already exists for this course' });
        }

        // Lookup course title
        const course = db.prepare('SELECT title FROM courses WHERE id = ?').get(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Get user name from DB for accuracy
        const userRecord = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id);

        const cert = {
            id: crypto.randomUUID(),
            user_id: user.id,
            course_id: courseId,
            course_title: course.title,
            student_id: user.id,
            user_name: userRecord?.name || user.name || user.email,
            issue_date: new Date().toISOString().split('T')[0],
            grade: 'Excellent',
            certificate_code: `CERT-${crypto.randomUUID().slice(0, 8)}`
        };

        db.prepare(`
            INSERT INTO certificates (id, user_id, course_id, course_title, student_id, user_name, issue_date, grade, certificate_code) 
            VALUES (@id, @user_id, @course_id, @course_title, @student_id, @user_name, @issue_date, @grade, @certificate_code)
        `).run(cert);

        console.log(`[CERTIFICATE_GENERATED] User ${user.id} earned certificate for course ${courseId}`);
        res.status(201).json(mapCertificate(cert));
    } catch (e) {
        console.error('[CERTIFICATE_GENERATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});

// ============================================================================
// Generate Master Certificate (Authenticated User)
// ============================================================================
router.post('/master', authenticateToken, (req, res) => {
    try {
        const user = req.user;

        // Check if master certificate already exists
        const existing = db.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').get(user.id, 'MASTER_CERT');
        if (existing) {
            return res.status(400).json({ error: 'Master certificate already exists' });
        }

        // Validate all courses are completed (check quiz results)
        const courses = db.prepare('SELECT id FROM courses').all();
        const passedQuizzes = db.prepare(`
            SELECT DISTINCT q.courseId 
            FROM quiz_results qr
            JOIN quizzes q ON qr.quizId = q.id
            WHERE qr.userId = ? AND qr.percentage >= q.passing_score
        `).all(user.id);

        const passedCourseIds = new Set(passedQuizzes.map(p => String(p.courseId)));
        const allPassed = courses.every(c => passedCourseIds.has(String(c.id)));

        if (!allPassed) {
            return res.status(400).json({
                error: 'Not all courses completed',
                completed: passedCourseIds.size,
                total: courses.length
            });
        }

        // Get user name from DB
        const userRecord = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id);

        const cert = {
            id: crypto.randomUUID(),
            user_id: user.id,
            course_id: 'MASTER_CERT',
            course_title: 'الشهادة الجامعية الشاملة',
            student_id: user.id,
            user_name: userRecord?.name || user.name || user.email,
            issue_date: new Date().toISOString().split('T')[0],
            grade: 'Distinction',
            certificate_code: `MASTER-${crypto.randomUUID().slice(0, 8)}`
        };

        db.prepare(`
            INSERT INTO certificates (id, user_id, course_id, course_title, student_id, user_name, issue_date, grade, certificate_code) 
            VALUES (@id, @user_id, @course_id, @course_title, @student_id, @user_name, @issue_date, @grade, @certificate_code)
        `).run(cert);

        console.log(`[MASTER_CERTIFICATE_GENERATED] User ${user.id} earned master certificate!`);
        res.status(201).json(mapCertificate(cert));
    } catch (e) {
        console.error('[MASTER_CERTIFICATE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to generate master certificate' });
    }
});

// ============================================================================
// Delete Certificate (Admin Only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare('DELETE FROM certificates WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        console.log(`[CERTIFICATE_DELETED] Admin ${req.user.id} deleted certificate: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[CERTIFICATE_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to delete certificate' });
    }
});

module.exports = router;
