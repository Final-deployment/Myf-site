/**
 * Quizzes Routes Module
 * 
 * Handles quiz CRUD and results.
 * - GET quizzes: Optionally authenticated (strips answers for non-admins)
 * - POST/PUT/DELETE quizzes: Admin only
 * - POST results: Server-side scoring with enrollment checks
 * 
 * @module server/routes/quizzes
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware.cjs');

// ============================================================================
// Get all quizzes (S1: Strip correctAnswer for non-admins)
// ============================================================================
router.get('/', optionalAuth, (req, res) => {
    try {
        const quizzes = db.prepare('SELECT * FROM quizzes').all();
        const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'supervisor');
        
        res.json(quizzes.map(q => {
            const questions = JSON.parse(q.questions || '[]');
            return {
                ...q,
                questions: isPrivileged 
                    ? questions 
                    : questions.map(({ correctAnswer, ...rest }) => rest),
                passingScore: q.passing_score || 70,
                titleEn: q.title_en || q.title
            };
        }));
    } catch (e) {
        console.error('[QUIZZES_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل الاختبارات' });
    }
});

// ============================================================================
// Create Quiz (Admin Only)
// ============================================================================
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { id, title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;

    if (!id || !title || !courseId) {
        return res.status(400).json({ error: 'Missing required fields: id, title, courseId' });
    }

    try {
        db.prepare(`
            INSERT INTO quizzes (id, title, title_en, courseId, questions, passing_score, afterEpisodeIndex, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, titleEn || title, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex || 0, description || '');

        console.log(`[QUIZ_CREATED] Admin ${req.user.id} created quiz: ${id}`);
        res.status(201).json({ success: true, id });
    } catch (e) {
        console.error('[QUIZ_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الاختبار' });
    }
});

// ============================================================================
// Update Quiz (Admin Only)
// ============================================================================
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, titleEn, courseId, questions, passingScore, afterEpisodeIndex, description } = req.body;

    try {
        const existing = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        db.prepare(`
            UPDATE quizzes 
            SET title = ?, title_en = ?, courseId = ?, questions = ?, passing_score = ?, afterEpisodeIndex = ?, description = ?
            WHERE id = ?
        `).run(title, titleEn || title, courseId, JSON.stringify(questions || []), passingScore || 70, afterEpisodeIndex || 0, description || '', id);

        console.log(`[QUIZ_UPDATED] Admin ${req.user.id} updated quiz: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[QUIZ_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث الاختبار' });
    }
});

// ============================================================================
// Delete Quiz (Admin Only) — quiz_results kept for admin archive
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // NOTE: quiz_results intentionally KEPT for admin archive (same policy as certificates)
        console.log(`[QUIZ_DELETED] Admin ${req.user.id} deleted quiz: ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[QUIZ_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف الاختبار' });
    }
});

// ============================================================================
// Submit quiz answers — S2: Server-side scoring (no client-supplied scores)
// ============================================================================
router.post('/results', authenticateToken, (req, res) => {
    const { quizId, answers } = req.body;
    const userId = req.user.id;

    if (!quizId || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Missing required fields: quizId, answers' });
    }

    try {
        // Fetch the quiz with its questions
        const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'الاختبار غير موجود' });
        }

        const questions = JSON.parse(quiz.questions || '[]');
        if (questions.length === 0) {
            return res.status(400).json({ error: 'الاختبار لا يحتوي على أسئلة' });
        }

        // S3: Verify enrollment and prerequisites for students
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            // Check user account is active
            const userRecord = db.prepare('SELECT status FROM users WHERE id = ?').get(userId);
            if (!userRecord || userRecord.status !== 'active') {
                return res.status(403).json({ error: 'حسابك غير مفعّل. يرجى التواصل مع الإدارة.' });
            }

            // Check enrollment in the course
            const enrollment = db.prepare(
                'SELECT progress, completed, deadline, is_locked FROM enrollments WHERE user_id = ? AND course_id = ?'
            ).get(userId, quiz.courseId);
            if (!enrollment) {
                return res.status(403).json({ error: 'لست مسجلاً في هذا المساق' });
            }

            // Check deadline lock
            let locked = enrollment.is_locked;
            if (!locked && enrollment.deadline && new Date() > new Date(enrollment.deadline) && enrollment.progress < 100 && !enrollment.completed) {
                db.prepare('UPDATE enrollments SET is_locked = 1 WHERE user_id = ? AND course_id = ?').run(userId, quiz.courseId);
                locked = 1;
            }
            if (locked) {
                return res.status(403).json({ error: 'انتهت الفترة المتاحة لدراسة المساق، يرجى مراجعة المشرف', isLockedOut: true });
            }

            // Check episode progress (student must have completed enough episodes)
            if (quiz.afterEpisodeIndex > 0) {
                const completedEpisodes = db.prepare(
                    'SELECT COUNT(*) as count FROM episode_progress WHERE user_id = ? AND course_id = ? AND completed = 1'
                ).get(userId, quiz.courseId);
                if (completedEpisodes.count < quiz.afterEpisodeIndex) {
                    return res.status(403).json({ error: 'لم تكمل الدروس المطلوبة للوصول لهذا الاختبار' });
                }
            }
        }

        // S2: Server-side scoring — calculate from actual answers
        let score = 0;
        const corrections = [];
        questions.forEach((q, idx) => {
            const userAnswer = (idx < answers.length && answers[idx] !== undefined && answers[idx] !== null) ? answers[idx] : -1;
            if (userAnswer === q.correctAnswer) {
                score++;
            } else {
                corrections.push({
                    questionIndex: idx,
                    questionText: q.text,
                    userAnswerText: (userAnswer >= 0 && q.options[userAnswer]) ? q.options[userAnswer] : 'لم يُجب',
                    correctAnswerText: q.options[q.correctAnswer] || ''
                });
            }
        });

        const total = questions.length;
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= (quiz.passing_score || 70);

        // Save result to DB
        db.prepare(`
            INSERT INTO quiz_results (id, userId, quizId, score, total, percentage, completedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('res_' + crypto.randomUUID(), userId, quizId, score, total, percentage, new Date().toISOString());

        console.log(`[QUIZ_SUBMITTED] User ${userId} scored ${score}/${total} (${percentage}%) on quiz ${quizId} — ${passed ? 'PASSED' : 'FAILED'}`);

        // DEEP ROOT CAUSE FIX: Auto-complete the course on the server if ALL quizzes for this course are passed!
        // This prevents the race condition where the frontend fails to send episodeId='FULL_COURSE' after passing,
        // which leaves progress < 100 and completely locks the student out of their passed course when the deadline hits.
        if (passed) {
            try {
                const quizCountRow = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(quiz.courseId);
                const totalQuizzes = quizCountRow ? quizCountRow.c : 0;
                
                const passedCountRow = db.prepare(`
                    SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
                    JOIN quizzes q ON qr.quizId = q.id
                    WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
                `).get(userId, quiz.courseId);
                const passedQuizzes = passedCountRow ? passedCountRow.c : 0;
                
                if (passedQuizzes >= totalQuizzes && totalQuizzes > 0) {
                    db.prepare('UPDATE enrollments SET progress = 100, completed = 1, last_accessed = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?').run(userId, quiz.courseId);
                    console.log(`[COURSE_AUTO_COMPLETED] System safely marked course ${quiz.courseId} as completed for user ${userId} upon passing final quiz.`);
                }
            } catch (completionErr) {
                console.error('[QUIZ_AUTO_COMPLETION_ERROR]:', completionErr.message);
            }
        }

        res.status(201).json({ 
            success: true, 
            score, 
            total, 
            percentage, 
            passed,
            corrections: passed ? [] : corrections
        });
    } catch (e) {
        console.error('[QUIZ_RESULT_SAVE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء حفظ نتيجة الاختبار' });
    }
});

// ============================================================================
// Get current user's quiz results (Authenticated Users)
// ============================================================================
router.get('/results', authenticateToken, (req, res) => {
    try {
        const results = db.prepare(`
            SELECT qr.*, q.title as quizTitle 
            FROM quiz_results qr 
            LEFT JOIN quizzes q ON qr.quizId = q.id 
            WHERE qr.userId = ?
            ORDER BY qr.completedAt DESC
        `).all(req.user.id);

        res.json(results);
    } catch (e) {
        console.error('[QUIZ_RESULTS_GET_OWN_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل نتائجك' });
    }
});

// ============================================================================
// Get specific user's quiz results (Admin, assigned Supervisor, or Self)
// ============================================================================
router.get('/results/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;

    // L1: Allow admin, self, or assigned supervisor
    if (req.user.id !== userId && req.user.role !== 'admin') {
        if (req.user.role === 'supervisor') {
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(userId);
            if (!student || student.supervisor_id !== req.user.id) {
                return res.status(403).json({ error: 'هذا الأمر من صلاحيات مشرف آخر أو من صلاحيات الإدارة وليس من صلاحياتك' });
            }
        } else {
            return res.status(403).json({ error: 'ليس لديك صلاحية الوصول' });
        }
    }

    try {
        const results = db.prepare(`
            SELECT qr.*, q.title as quizTitle 
            FROM quiz_results qr 
            LEFT JOIN quizzes q ON qr.quizId = q.id 
            WHERE qr.userId = ?
            ORDER BY qr.completedAt DESC
        `).all(userId);

        res.json(results);
    } catch (e) {
        console.error('[QUIZ_RESULTS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل النتائج' });
    }
});

// ============================================================================
// Fix/correct quiz result (Admin Only)
// ============================================================================
router.patch('/results/:resultId', authenticateToken, requireAdmin, (req, res) => {
    const { resultId } = req.params;
    const { score, total, percentage } = req.body;

    if (score === undefined || total === undefined || percentage === undefined) {
        return res.status(400).json({ error: 'Missing required fields: score, total, percentage' });
    }

    if (score > total || score < 0 || total < 1) {
        return res.status(400).json({ error: 'Invalid values: score must be between 0 and total' });
    }

    try {
        const existing = db.prepare('SELECT id FROM quiz_results WHERE id = ?').get(resultId);
        if (!existing) {
            return res.status(404).json({ error: 'Quiz result not found' });
        }

        db.prepare(`
            UPDATE quiz_results SET score = ?, total = ?, percentage = ? WHERE id = ?
        `).run(score, total, percentage, resultId);

        console.log(`[QUIZ_RESULT_FIXED] Admin ${req.user.id} corrected result ${resultId}: ${score}/${total} (${percentage}%)`);
        res.json({ success: true, message: `Result corrected to ${score}/${total} (${percentage}%)` });
    } catch (e) {
        console.error('[QUIZ_RESULT_FIX_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تصحيح النتيجة' });
    }
});

module.exports = router;
