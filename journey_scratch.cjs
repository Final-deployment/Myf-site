// ============================================================================
// Get Student Journey (Roadmap)
// ============================================================================
router.get('/:id/journey', authenticateToken, (req, res) => {
    let targetId = req.params.id;
    
    // Support for 'me' alias
    if (targetId === 'me') {
        targetId = req.user.id;
    }

    // Access control: only owner, admin, or assigned supervisor
    if (req.user.id !== targetId && req.user.role !== 'admin') {
        if (req.user.role === 'supervisor') {
            const student = db.prepare('SELECT supervisor_id FROM users WHERE id = ?').get(targetId);
            if (!student || student.supervisor_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You do not supervise this student.' });
            }
        } else {
            return res.status(403).json({ error: 'Access denied.' });
        }
    }

    try {
        const user = db.prepare('SELECT id, name, joinDate FROM users WHERE id = ?').get(targetId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 1. Fetch all courses ordered correctly
        // (Assuming you have order_index, fallback to folder sort and course title if not)
        const allCourses = db.prepare(\`
            SELECT c.id, c.title, c.folder_id, f.title as folder_title, c.order_index, c.days_available
            FROM courses c
            LEFT JOIN course_folders f ON c.folder_id = f.id
            ORDER BY f.order_index ASC, c.order_index ASC
        \`).all();

        // 2. Fetch Enrollments
        const enrollments = db.prepare(\`
            SELECT course_id, enrolled_at, deadline, progress, completed, is_locked
            FROM enrollments
            WHERE user_id = ?
        \`).all(targetId);

        // 3. Fetch Quiz Results
        const quizResults = db.prepare(\`
            SELECT q.courseId, qr.score, qr.passed, qr.attemptNumber, qr.created_at
            FROM quiz_results qr
            JOIN quizzes q ON qr.quiz_id = q.id
            WHERE qr.user_id = ?
        \`).all(targetId);

        // 4. Fetch Extension counts
        const extensions = db.prepare(\`
            SELECT course_id, COUNT(*) as count, SUM(days_added) as total_days
            FROM extension_archive
            WHERE user_id = ?
            GROUP BY course_id
        \`).all(targetId);

        // 5. Fetch Episode Progress for active lesson info
        const episodeProgress = db.prepare(\`
            SELECT course_id, episode_id, updated_at
            FROM episode_progress
            WHERE user_id = ? AND completed = 0
            ORDER BY updated_at DESC
        \`).all(targetId);
        
        const episodes = db.prepare('SELECT id, title, orderIndex, courseId FROM episodes').all();

        // Aggregate Data into Journey Nodes
        const nodes = allCourses.map(course => {
            const enrollment = enrollments.find(e => e.course_id === course.id);
            const courseQuizzes = quizResults.filter(q => q.courseId === course.id);
            const courseExtensions = extensions.find(e => e.course_id === course.id) || { count: 0, total_days: 0 };
            
            let status = 'locked'; // default gray
            if (enrollment) {
                if (enrollment.completed) status = 'completed'; // green
                else if (enrollment.is_locked) status = 'locked_failed'; // gray/red
                else status = 'active'; // blue
            }

            // Calculate days taken
            let daysTaken = null;
            let daysSpentSoFar = null;
            if (enrollment) {
                const start = new Date(enrollment.enrolled_at);
                if (status === 'completed') {
                    // Find when they passed the last quiz or just use today as approximation if not available
                    const passedQuiz = courseQuizzes.slice().reverse().find(q => q.passed);
                    if (passedQuiz) {
                        const end = new Date(passedQuiz.created_at);
                        daysTaken = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    }
                } else if (status === 'active') {
                    daysSpentSoFar = Math.ceil((new Date() - start) / (1000 * 60 * 60 * 24));
                }
            }

            // Find current episode if active
            let currentEpisodeTitle = null;
            if (status === 'active') {
                const epProg = episodeProgress.find(ep => ep.course_id === course.id);
                if (epProg) {
                    const epInfo = episodes.find(e => e.id === epProg.episode_id);
                    if (epInfo) currentEpisodeTitle = epInfo.title;
                }
            }

            return {
                courseId: course.id,
                title: course.title,
                folderTitle: course.folder_title,
                status: status,
                progress: enrollment ? enrollment.progress : 0,
                enrolledAt: enrollment ? enrollment.enrolled_at : null,
                deadline: enrollment ? enrollment.deadline : null,
                extensions: courseExtensions.count,
                daysTaken: daysTaken,
                daysSpentSoFar: daysSpentSoFar,
                quizAttempts: courseQuizzes.length,
                finalScore: courseQuizzes.length > 0 ? courseQuizzes[courseQuizzes.length - 1].score : null,
                currentEpisode: currentEpisodeTitle
            };
        });

        res.json({
            student: user,
            journey: nodes
        });
    } catch (e) {
        console.error('[STUDENT_JOURNEY_ERROR]:', e.message);
        res.status(500).json({ error: 'Failed to fetch student journey' });
    }
});
