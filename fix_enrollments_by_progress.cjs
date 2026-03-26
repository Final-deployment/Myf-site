const Database = require('better-sqlite3');
const path = require('path');

console.log('--- بدء عملية إنشاء التحاقات مفقودة بناءً على مشاهدات الدروس ---');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

try {
    // 1. Get all courses to know days_available
    const courses = db.prepare('SELECT id, days_available FROM courses').all();
    const courseRules = {};
    courses.forEach(c => {
        courseRules[c.id] = c.days_available || 30;
    });

    // 2. Find users who have progress in episodes but no corresponding enrollment
    // We group by userId and courseId in episode_progress. 
    // episode_progress table has: user_id, course_id, episode_id
    const userActivity = db.prepare(`
        SELECT p.user_id, p.course_id, COUNT(*) as watched_episodes
        FROM episode_progress p
        LEFT JOIN enrollments e ON p.user_id = e.user_id AND p.course_id = e.course_id
        WHERE e.user_id IS NULL
        GROUP BY p.user_id, p.course_id
    `).all();

    console.log(`تم العثور على ${userActivity.length} حالة لطلاب شاهدوا دروساً بدون وجود سجل التحاق.`);

    let createdCount = 0;

    const insertEnrollment = db.prepare(`
        INSERT INTO enrollments (user_id, course_id, progress, enrolled_at, deadline) 
        VALUES (?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        for (const record of userActivity) {
            const { user_id, course_id, watched_episodes } = record;

            // Assume minimal progress for now. We can't perfectly reconstruct exact % 
            // without knowing total episodes, but having the record unlocks the course for them.
            // When they load the player next, the frontend/backend syncs exact progress.
            const progress = 10;

            const now = new Date().toISOString();
            const daysAvailable = courseRules[course_id] || 30;
            const deadline = new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000).toISOString();

            insertEnrollment.run(user_id, course_id, progress, now, deadline);
            createdCount++;
            console.log(`[إنشاء] تمت إضافة التحاق مفقود للطالب ${user_id} في مساق ${course_id} لأنه شاهد ${watched_episodes} درس`);
        }
    })();

    console.log(`تم إضافة ${createdCount} التحاق جديد بنجاح.`);
    console.log('--------------------------------------------------------------\n');

} catch (err) {
    console.error('حدث خطأ أثناء تصحيح بيانات المشاهدات:', err);
} finally {
    db.close();
}
