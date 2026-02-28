const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

const courseId = 'course_madkhal';
const newTitle = 'المدخل إلى الفقه';
const R2_DOMAIN = 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev';

const newEpisodes = [
    {
        id: 'ep_madkhal_1_new',
        title: 'الدرس 1',
        videoUrl: `${R2_DOMAIN}/مقدمة لطالب العلم/1771531243352-WhatsApp-Video-2026-02-19-at-9.53.40-PM.mp4`,
        orderIndex: 1
    },
    {
        id: 'ep_madkhal_2_new',
        title: 'الدرس 2',
        videoUrl: `${R2_DOMAIN}/مقدمة لطالب العلم/1771531262442-IMG_6799.MOV`,
        orderIndex: 2
    },
    {
        id: 'ep_madkhal_3_new',
        title: 'الدرس 3',
        videoUrl: `${R2_DOMAIN}/مقدمة لطالب العلم/1771531280457-IMG_6795.MOV`,
        orderIndex: 3
    }
];

try {
    db.transaction(() => {
        // 1. Update course metadata
        console.log(`Updating course ${courseId} title to: ${newTitle}`);
        db.prepare('UPDATE courses SET title = ?, lessons_count = ? WHERE id = ?')
            .run(newTitle, newEpisodes.length, courseId);

        // 2. Delete old episodes
        console.log(`Deleting old episodes for ${courseId}`);
        db.prepare('DELETE FROM episodes WHERE courseId = ?').run(courseId);

        // 3. Insert new episodes
        console.log(`Inserting ${newEpisodes.length} new episodes`);
        const insertEp = db.prepare(`
            INSERT INTO episodes (id, courseId, title, videoUrl, orderIndex, isLocked)
            VALUES (?, ?, ?, ?, ?, 0)
        `);
        for (const ep of newEpisodes) {
            insertEp.run(ep.id, courseId, ep.title, ep.videoUrl, ep.orderIndex);
        }

        // 4. Reset student progress for this course
        // Check if user_progress table exists and clear it for this course
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_progress'").get();
        if (tableCheck) {
            console.log(`Clearing progress for ${courseId} from user_progress`);
            db.prepare('DELETE FROM user_progress WHERE courseId = ?').run(courseId);
        }

        // Also check enrollments or user_courses for progress fields
        const enrollmentCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='enrollments'").get();
        if (enrollmentCheck) {
            console.log(`Resetting progress in enrollments for ${courseId}`);
            // Check columns in enrollments
            const columns = db.prepare("PRAGMA table_info(enrollments)").all();
            const hasProgress = columns.some(c => c.name === 'progress');
            const hasCompletedCount = columns.some(c => c.name === 'completed_count');

            if (hasProgress && hasCompletedCount) {
                db.prepare('UPDATE enrollments SET progress = 0, completed_count = 0 WHERE course_id = ?').run(courseId);
            } else if (hasProgress) {
                db.prepare('UPDATE enrollments SET progress = 0 WHERE course_id = ?').run(courseId);
            }
        }

        console.log('Sync completed successfully.');
    })();
} catch (err) {
    console.error('Sync failed:', err);
} finally {
    db.close();
}
