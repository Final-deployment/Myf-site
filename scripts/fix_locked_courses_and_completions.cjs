const { db } = require('../server/database.cjs');

console.log('--- STARTING DATABASE FIX FOR LOCKED COURSES ---');

try {
    const enrollments = db.prepare('SELECT * FROM enrollments').all();
    let fixedCompletionsCount = 0;
    let unlockedCoursesCount = 0;

    for (const e of enrollments) {
        let needsFix = false;
        let isFullyPassed = false;

        // 1. Check if the course is fully passed
        const quizzes = db.prepare('SELECT id, passing_score FROM quizzes WHERE courseId = ?').all(e.course_id);
        
        if (quizzes.length === 0) {
            // No quizzes -> if progress is 100, they passed
            if (e.progress >= 100) {
                isFullyPassed = true;
            }
        } else {
            // Has quizzes -> Did they pass all of them?
            const passedInfo = db.prepare(`
                SELECT COUNT(DISTINCT q.id) as passedCount
                FROM quizzes q
                JOIN quiz_results qr ON q.id = qr.quizId
                WHERE q.courseId = ? AND qr.userId = ? AND qr.percentage >= q.passing_score
            `).get(e.course_id, e.user_id);
            
            if (passedInfo && passedInfo.passedCount >= quizzes.length) {
                isFullyPassed = true;
            }
        }

        // 2. Apply fixes if they fully passed but the DB didn't mark them properly
        if (isFullyPassed) {
            if (e.completed !== 1 || e.progress < 100 || e.is_locked === 1) {
                db.prepare(`
                    UPDATE enrollments 
                    SET completed = 1, progress = 100, is_locked = 0 
                    WHERE user_id = ? AND course_id = ?
                `).run(e.user_id, e.course_id);
                fixedCompletionsCount++;
                needsFix = true;
            }
        }

        // 3. Just in case, if completed = 1 is already true but is_locked = 1 (another edge case)
        if (!needsFix && e.completed === 1 && e.is_locked === 1) {
             db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0 
                WHERE user_id = ? AND course_id = ?
            `).run(e.user_id, e.course_id);
            unlockedCoursesCount++;
        }
    }

    console.log(`✅ Completed database sweep.`);
    console.log(`🔧 Fixed ${fixedCompletionsCount} enrollments (Set to completed=1, progress=100, unlocked)`);
    console.log(`🔓 Unlocked ${unlockedCoursesCount} additional enrollments that were completed but locked.`);
    
} catch (error) {
    console.error('Error during database fix:', error);
}

console.log('--- DONE ---');
