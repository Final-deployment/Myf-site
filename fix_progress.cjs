const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

try {
    db.transaction(() => {
        // 1. Delete stale episode_progress entries where the episode no longer exists
        const staleResult = db.prepare(`
            DELETE FROM episode_progress 
            WHERE episode_id NOT IN (SELECT id FROM episodes)
        `).run();
        console.log(`Cleaned up ${staleResult.changes} stale episode_progress entries (including FULL_COURSE and deleted episodes).`);

        // 2. Recalculate progress for ALL enrollments
        const enrollments = db.prepare('SELECT user_id, course_id FROM enrollments').all();
        let updated = 0;

        for (const enrollment of enrollments) {
            const episodeCount = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE courseId = ?').get(enrollment.course_id).count;
            
            if (episodeCount === 0) {
                // No episodes in this course, set progress to 0
                db.prepare('UPDATE enrollments SET progress = 0 WHERE user_id = ? AND course_id = ?').run(enrollment.user_id, enrollment.course_id);
                continue;
            }

            const completedCount = db.prepare(`
                SELECT COUNT(*) as count 
                FROM episode_progress ep
                INNER JOIN episodes e ON ep.episode_id = e.id AND e.courseId = ep.course_id
                WHERE ep.user_id = ? AND ep.course_id = ? AND ep.completed = 1
            `).get(enrollment.user_id, enrollment.course_id).count;

            const progress = Math.round((completedCount / episodeCount) * 100);
            db.prepare('UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?').run(progress, enrollment.user_id, enrollment.course_id);
            updated++;
        }

        console.log(`Recalculated progress for ${updated} enrollments.`);

        // 3. Verify the fix for course_madkhal
        console.log('\n=== VERIFICATION: course_madkhal ===');
        const course = db.prepare("SELECT id, title, lessons_count FROM courses WHERE id = 'course_madkhal'").get();
        console.log('Course:', course);
        
        const episodes = db.prepare("SELECT id, title FROM episodes WHERE courseId = 'course_madkhal'").all();
        console.log('Episodes:', episodes.length, episodes);
        
        const progressEntries = db.prepare("SELECT * FROM episode_progress WHERE course_id = 'course_madkhal'").all();
        console.log('Progress entries:', progressEntries.length, progressEntries);
        
        const enrollmentCheck = db.prepare("SELECT user_id, progress FROM enrollments WHERE course_id = 'course_madkhal'").all();
        console.log('Enrollments progress:', enrollmentCheck);
    })();

    console.log('\nDone! All progress values have been recalculated.');
} catch (err) {
    console.error('Error:', err);
} finally {
    db.close();
}
