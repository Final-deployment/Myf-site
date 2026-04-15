const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database.cjs');
const { generateDownloadUrl } = require('../r2.cjs');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware.cjs');

// ============================================================================
// SHARED: Check if a user has "passed" a specific course
// ============================================================================
function isCoursePassed(userId, courseId) {
    // 1) Passed the quiz for this course
    const passedQuiz = db.prepare(`
        SELECT 1 FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
    `).get(userId, courseId);
    if (passedQuiz) return true;

    // 2) No quizzes exist for this course, but 100% complete
    const hasQuiz = db.prepare('SELECT 1 FROM quizzes WHERE courseId = ?').get(courseId);
    if (!hasQuiz) {
        const completed = db.prepare(
            'SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND progress >= 100'
        ).get(userId, courseId);
        if (completed) return true;
    }
    return false;
}

// ============================================================================
// SHARED: Check prerequisite status for a course
// Returns { unlocked: boolean, prerequisiteName?: string }
// ============================================================================
function checkCoursePrerequisite(userId, courseId) {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) return { unlocked: false, prerequisiteName: null };

    const currentFolderId = String(course.folder_id || '').toLowerCase().trim();
    const folderCourses = db.prepare(
        'SELECT * FROM courses WHERE LOWER(TRIM(folder_id)) = ? ORDER BY order_index ASC'
    ).all(currentFolderId);
    const courseIndex = folderCourses.findIndex(c => String(c.id) === String(courseId));

    // First course or only course — always unlocked
    if (folderCourses.length <= 1 || courseIndex <= 0) return { unlocked: true };

    const prevCourse = folderCourses[courseIndex - 1];
    const passed = isCoursePassed(userId, prevCourse.id);
    return { unlocked: passed, prerequisiteName: prevCourse.title };
}

// Get all courses (Optionally authenticated to get progress)
router.get('/', async (req, res) => {
    try {
        // Optional Auth check
        let userId = null;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const jwt = require('jsonwebtoken');
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY);
                userId = decoded.id;
            } catch (err) {
                // Ignore invalid token for public listing
            }
        }

        const courses = db.prepare(`
            SELECT c.*, b.path as book_path 
            FROM courses c 
            LEFT JOIN (SELECT courseId, MIN(path) as path FROM books GROUP BY courseId) b ON c.id = b.courseId 
            ORDER BY c.order_index ASC, c.created_at DESC
        `).all();

        // Fetch all passed quizzes for this user to determine locking
        let passedCourseIds = new Set();
        if (userId) {
            // 1) Courses where the student passed the quiz
            const passedResults = db.prepare(`
                SELECT DISTINCT q.courseId 
                FROM quiz_results qr
                JOIN quizzes q ON qr.quizId = q.id
                WHERE qr.userId = ? AND qr.percentage >= q.passing_score
            `).all(userId);
            passedResults.forEach(r => passedCourseIds.add(String(r.courseId)));

            // 2) Courses that have NO quizzes but are completed (progress = 100%)
            //    These are considered "passed" automatically
            const completedNoQuiz = db.prepare(`
                SELECT e.course_id 
                FROM enrollments e
                WHERE e.user_id = ? AND e.progress >= 100
                AND NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.courseId = e.course_id)
            `).all(userId);
            completedNoQuiz.forEach(r => passedCourseIds.add(String(r.course_id)));
        }

        // --- PERFORMANCE: Batch-load all related data upfront to avoid N+1 queries ---

        // 1. Batch-load ALL episodes (grouped by courseId)
        const allEpisodes = db.prepare('SELECT * FROM episodes ORDER BY orderIndex ASC').all();
        const episodesByCourse = new Map();
        for (const ep of allEpisodes) {
            const key = String(ep.courseId);
            if (!episodesByCourse.has(key)) episodesByCourse.set(key, []);
            episodesByCourse.get(key).push(ep);
        }

        // 2. Batch-load ALL enrollments for this user (if authenticated)
        const enrollmentMap = new Map();
        if (userId) {
            const allEnrollments = db.prepare('SELECT * FROM enrollments WHERE user_id = ?').all(userId);
            for (const en of allEnrollments) {
                enrollmentMap.set(String(en.course_id), en);
            }
        }

        // 3. Batch-load ALL episode progress for this user (if authenticated)
        const progressMap = new Map();
        if (userId) {
            const allProgress = db.prepare('SELECT * FROM episode_progress WHERE user_id = ?').all(userId);
            for (const p of allProgress) {
                progressMap.set(String(p.episode_id), p);
            }
        }

        // 4. Batch-sign ALL book URLs upfront (avoid N+1 async calls in the loop)
        const bookUrlMap = new Map();
        const coursesWithBooks = courses.filter(c => c.book_path);
        if (coursesWithBooks.length > 0) {
            const bookResults = await Promise.all(coursesWithBooks.map(async (c) => {
                try {
                    const url = await generateDownloadUrl(`Books/${c.book_path}`);
                    return { id: c.id, url };
                } catch (e) {
                    console.error(`Failed to sign book URL for course ${c.id}:`, e);
                    return { id: c.id, url: null };
                }
            }));
            for (const result of bookResults) {
                bookUrlMap.set(String(result.id), result.url);
            }
        }

        const coursesWithExtra = courses.map((c, index) => {
            const episodes = episodesByCourse.get(String(c.id)) || [];

            // Fetch signed book URL from pre-signed map
            const bookUrl = bookUrlMap.get(String(c.id)) || null;
            // Get progress if userId is known
            let progress = 0;
            let isLocked = false;
            let prerequisiteName = null;

            // Per-folder locking logic: isolated to within the same folder
            const currentFolderId = String(c.folder_id || '').toLowerCase().trim();
            const folderCourses = courses.filter(course =>
                String(course.folder_id || '').toLowerCase().trim() === currentFolderId
            );

            // Robust index check: find position within current folder program
            const indexInFolder = folderCourses.findIndex(course => String(course.id) === String(c.id));

            if (!req.user || req.user.role === 'admin' || req.user.role === 'supervisor') {
                isLocked = false;
            } else if (indexInFolder === 0 || indexInFolder === -1) {
                isLocked = false; // First course in each folder is always unlocked
            } else {
                // Subsequent courses are locked if the PREVIOUS one in the order isn't "passed"
                const prevCourse = folderCourses[indexInFolder - 1];
                const passedPrev = passedCourseIds.has(String(prevCourse.id));
                isLocked = !passedPrev;
                if (isLocked) {
                    prerequisiteName = prevCourse.title; // Proper local scope
                }
            }

            // Emergency override: if it's the ONLY course in its folder, it's never locked
            if (folderCourses.length <= 1) {
                isLocked = false;
                prerequisiteName = null;
            }

            // Progress check (from batch-loaded enrollment data)
            let deadline = null;
            let isLockedByDeadline = false;
            const enrollment = userId ? enrollmentMap.get(String(c.id)) : null;
            if (enrollment) {
                progress = enrollment.progress;
                deadline = enrollment.deadline;
                isLockedByDeadline = !!enrollment.is_locked;

                // Compute deadline lock status at read-time only (no DB write in GET — L1 fix)
                if (!isLockedByDeadline && deadline && new Date() > new Date(deadline) && progress < 100) {
                    isLockedByDeadline = true;
                }

                if (req.user?.role === 'admin' || req.user?.role === 'supervisor') {
                    isLockedByDeadline = false;
                    isLocked = false;
                } else if (isLockedByDeadline) {
                    isLocked = true;
                }
            }

            return {
                id: String(c.id),
                title: c.title,
                titleEn: c.title_en,
                instructor: c.instructor,
                instructorEn: c.instructor_en,
                category: c.category,
                categoryEn: c.category_en,
                duration: c.duration,
                durationEn: c.duration_en,
                thumbnail: c.thumbnail,
                description: c.description,
                descriptionEn: c.description_en,
                lessonsCount: c.lessons_count,
                studentsCount: c.students_count,
                videoUrl: c.video_url,
                status: c.status,
                passingScore: c.passing_score,
                quizFrequency: c.quiz_frequency,
                folderId: c.folder_id,
                orderIndex: c.order_index,
                daysAvailable: c.days_available,
                bookPath: bookUrl,
                progress: progress,
                deadline: deadline,
                isLockedByDeadline: isLockedByDeadline,
                isLocked: isLocked,
                lockedByPrerequisiteName: prerequisiteName,
                isEnrolled: userId ? !!enrollment : false,
                episodes: episodes.map(ep => {
                    let epProgress = { completed: false, lastPosition: 0, watchedDuration: 0 };
                    if (userId) {
                        const prog = progressMap.get(String(ep.id));
                        if (prog) {
                            epProgress = {
                                completed: !!prog.completed,
                                lastPosition: prog.last_position || 0,
                                watchedDuration: prog.watched_duration || 0
                            };
                        }
                    }
                    return {
                        id: String(ep.id),
                        courseId: String(ep.courseId),
                        title: ep.title,
                        titleEn: ep.title_en,
                        videoUrl: ep.videoUrl,
                        orderIndex: ep.orderIndex,
                        duration: ep.duration,
                        isLocked: !!ep.isLocked,
                        ...epProgress
                    };
                })
            };
        });
        res.json(coursesWithExtra);
    } catch (e) {
        console.error('[COURSES_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل المساقات' });
    }
});

// Enroll in a course
router.post('/enroll', authenticateToken, (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[COURSES] POST /enroll reached for user ${req.user.id}`);
    }
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
        return res.status(400).json({ error: 'Missing courseId' });
    }

    try {
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        // SECURITY: Verify user account is active (S5)
        const userRecord = db.prepare('SELECT status FROM users WHERE id = ?').get(userId);
        if (!userRecord || userRecord.status !== 'active') {
            return res.status(403).json({ error: 'حسابك غير مفعّل. يرجى التواصل مع الإدارة.' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            // Unified prerequisite check (S1)
            const prereq = checkCoursePrerequisite(userId, courseId);
            if (!prereq.unlocked) {
                return res.status(403).json({ error: `هذا المساق مغلق. يجب اجتياز مساق "${prereq.prerequisiteName || 'السابق'}" أولاً` });
            }
        }

        // Check if already enrolled
        const existing = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(userId, courseId);
        if (existing) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        let deadline = null;
        if (course.days_available) {
            const date = new Date();
            date.setDate(date.getDate() + course.days_available);
            deadline = date.toISOString();
        }

        // Insert enrollment
        db.prepare(`
            INSERT INTO enrollments (user_id, course_id, enrolled_at, progress, completed, deadline, is_locked)
            VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0, ?, 0)
        `).run(userId, courseId, deadline);

        // Update students_count in courses table
        db.prepare('UPDATE courses SET students_count = students_count + 1 WHERE id = ?').run(courseId);

        res.json({ success: true, message: 'Enrolled successfully' });
    } catch (e) {
        console.error('[ENROLLMENT_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل في المساق' });
    }
});

// Update progress
router.post('/episode-progress', authenticateToken, (req, res) => {
    const { courseId, episodeId, completed, lastPosition, watchedDuration } = req.body;

    // SECURITY: Unified prerequisite + deadline check (S1)
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        const prereq = checkCoursePrerequisite(req.user.id, courseId);
        if (!prereq.unlocked) {
            return res.status(403).json({ error: 'المساق مغلق' });
        }

        // Check enrollment deadline
        const enrollment = db.prepare('SELECT progress, completed, deadline, is_locked FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, courseId);
        if (enrollment) {
            let locked = enrollment.is_locked;
            if (!locked && enrollment.deadline && new Date() > new Date(enrollment.deadline) && enrollment.progress < 100 && !enrollment.completed) {
                db.prepare('UPDATE enrollments SET is_locked = 1 WHERE user_id = ? AND course_id = ?').run(req.user.id, courseId);
                locked = 1;
            }
            if (locked) {
                return res.status(403).json({ error: 'انتهت الفترة المتاحة لدراسة المساق، يرجى مراجعة المشرف', isLockedOut: true });
            }
        }
    }

    // S2: Backend validation — require meaningful watch time before marking complete
    if (completed && episodeId !== 'FULL_COURSE' && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        if (!watchedDuration || watchedDuration < 30) {
            return res.status(400).json({ error: 'لا يمكن إكمال الدرس بدون مشاهدة فعلية كافية' });
        }
    }

    try {
        db.prepare(`
            INSERT INTO episode_progress (user_id, course_id, episode_id, completed, last_position, watched_duration, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, episode_id) DO UPDATE SET 
                completed = COALESCE(excluded.completed, completed),
                last_position = COALESCE(excluded.last_position, last_position),
                watched_duration = MAX(COALESCE(excluded.watched_duration, 0), watched_duration),
                updated_at = CURRENT_TIMESTAMP
        `).run(
            req.user.id,
            courseId,
            episodeId,
            completed !== undefined ? (completed ? 1 : 0) : null,
            lastPosition !== undefined ? lastPosition : null,
            watchedDuration !== undefined ? watchedDuration : null
        );

        // Recalculate overall course progress
        if (courseId && courseId !== 'default') {
            if (episodeId === 'FULL_COURSE' && completed) {
                db.prepare('UPDATE enrollments SET progress = 100, completed = 1, last_accessed = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?').run(req.user.id, courseId);
            } else if (episodeId !== 'FULL_COURSE') {
                const episodes = db.prepare('SELECT id FROM episodes WHERE courseId = ?').all(courseId);
                if (episodes.length > 0) {
                    const epIds = episodes.map(e => e.id);
                    // Simple placeholder logic for SQLite
                    const completedCount = db.prepare(`
                        SELECT COUNT(*) as count 
                        FROM episode_progress ep
                        INNER JOIN episodes e ON ep.episode_id = e.id AND e.courseId = ep.course_id
                        WHERE ep.user_id = ? AND ep.course_id = ? AND ep.completed = 1
                    `).get(req.user.id, courseId).count;

                    const progress = Math.round((completedCount / episodes.length) * 100);
                    db.prepare('UPDATE enrollments SET progress = ?, last_accessed = CURRENT_TIMESTAMP WHERE user_id = ? AND course_id = ?').run(progress, req.user.id, courseId);
                }
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error('[EPISODE_PROGRESS_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث التقدم' });
    }
});

// Create Course
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const course = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO courses(id, title, title_en, instructor, instructor_en, category, category_en, duration, duration_en, thumbnail, description, description_en, lessons_count, students_count, video_url, status, passing_score, quiz_frequency, folder_id)
            VALUES(@id, @title, @title_en, @instructor, @instructor_en, @category, @category_en, @duration, @duration_en, @thumbnail, @description, @description_en, @lessons_count, @students_count, @video_url, @status, @passing_score, @quiz_frequency, @folder_id)
                `);

        stmt.run({
            id: String(course.id),
            title: course.title,
            title_en: course.titleEn || course.title,
            instructor: course.instructor,
            instructor_en: course.instructorEn || course.instructor,
            category: course.category,
            category_en: course.categoryEn || course.category,
            duration: course.duration,
            duration_en: course.durationEn || course.duration,
            thumbnail: course.thumbnail,
            description: course.description || '',
            description_en: course.descriptionEn || course.description || '',
            lessons_count: course.lessonsCount || (course.episodes ? course.episodes.length : 0),
            students_count: course.studentsCount || 0,
            video_url: course.videoUrl || '',
            status: course.status || 'published',
            passing_score: course.passingScore || 80,
            quiz_frequency: course.quizFrequency || 0,
            folder_id: course.folderId || null
        });

        // Insert Episodes if any
        if (course.episodes && Array.isArray(course.episodes)) {
            const epStmt = db.prepare(`
                INSERT INTO episodes(id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
        VALUES(@id, @courseId, @title, @title_en, @duration, @videoUrl, @orderIndex, @isLocked)
                `);
            for (const ep of course.episodes) {
                epStmt.run({
                    id: ep.id ? String(ep.id) : ('ep_' + crypto.randomUUID()),
                    courseId: String(course.id),
                    title: ep.title,
                    title_en: ep.titleEn || ep.title,
                    duration: ep.duration || '',
                    videoUrl: ep.videoUrl || '',
                    orderIndex: ep.orderIndex || 0,
                    isLocked: ep.isLocked ? 1 : 0
                });
            }
        }

        res.status(201).json({ success: true, id: course.id });
    } catch (e) {
        console.error('[COURSE_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المساق' });
    }
});

// Update Course
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        // Update basic course info
        const allowedFields = ['title', 'title_en', 'instructor', 'instructor_en', 'category', 'category_en', 'duration', 'duration_en', 'thumbnail', 'description', 'description_en', 'lessons_count', 'students_count', 'video_url', 'status', 'passing_score', 'quiz_frequency', 'folder_id'];
        const fieldsToUpdate = Object.keys(updates).filter(k => allowedFields.includes(k) || k === 'titleEn' || k === 'instructorEn' || k === 'quizFrequency' || k === 'folderId');

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(k => {
                const dbKey = k === 'titleEn' ? 'title_en' : k === 'instructorEn' ? 'instructor_en' : k === 'quizFrequency' ? 'quiz_frequency' : k === 'folderId' ? 'folder_id' : k;
                return `${dbKey} = ?`;
            }).join(', ');
            const values = fieldsToUpdate.map(k => updates[k]);
            db.prepare(`UPDATE courses SET ${setClause} WHERE id = ? `).run(...values, id);
        }

        // Sync Episodes
        if (updates.episodes && Array.isArray(updates.episodes)) {
            // Delete old ones
            db.prepare('DELETE FROM episodes WHERE courseId = ?').run(id);
            // Insert new ones
            const epStmt = db.prepare(`
                INSERT INTO episodes(id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
        VALUES(@id, @courseId, @title, @title_en, @duration, @videoUrl, @orderIndex, @isLocked)
            `);
            for (const ep of updates.episodes) {
                epStmt.run({
                    id: ep.id || ('ep_' + crypto.randomUUID()),
                    courseId: id,
                    title: ep.title,
                    title_en: ep.titleEn || ep.title,
                    duration: ep.duration || '',
                    videoUrl: ep.videoUrl || '',
                    orderIndex: ep.orderIndex || 0,
                    isLocked: ep.isLocked ? 1 : 0
                });
            }
        }

        res.json({ success: true });
    } catch (e) {
        console.error('[COURSE_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث المساق' });
    }
});

// Delete Course (S3: proper cleanup, preserving cert/quiz archive)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    try {
        db.transaction(() => {
            // Clean related data
            db.prepare('DELETE FROM episodes WHERE courseId = ?').run(id);
            db.prepare('DELETE FROM episode_progress WHERE course_id = ?').run(id);
            db.prepare('DELETE FROM enrollments WHERE course_id = ?').run(id);
            // NOTE: certificates and quiz_results intentionally KEPT for admin archive
            // Decrement is not needed since we're deleting the course row
            db.prepare('DELETE FROM courses WHERE id = ?').run(id);
        })();

        console.log(`[COURSE_DELETED] Admin ${req.user.id} deleted course ${id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[COURSE_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف المساق' });
    }
});

module.exports = router;
