const Database = require('better-sqlite3');
const path = require('path');

console.log('--- بدء عملية تصحيح بيانات الالتحاق لجميع الطلاب الرجعية ---');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

try {
    // 1. Get ALL courses to know their days_available
    const courses = db.prepare('SELECT id, days_available FROM courses').all();
    const courseRules = {};
    courses.forEach(c => {
        courseRules[c.id] = c.days_available || 30; // Default to 30 if null
    });

    // 2. Get ALL quiz results across the entire platform
    const allQuizResults = db.prepare(`
        SELECT qr.userId, q.courseId, MAX(qr.percentage) as best_score, q.passing_score
        FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        GROUP BY qr.userId, q.courseId
    `).all();

    console.log(`تم العثور على ${allQuizResults.length} نتيجة امتحان لجميع الطلاب.`);

    let createdCount = 0;
    let updatedCount = 0;

    const insertEnrollment = db.prepare(`
        INSERT INTO enrollments (user_id, course_id, progress, enrolled_at, deadline) 
        VALUES (?, ?, ?, ?, ?)
    `);

    const updateProgress = db.prepare(`
        UPDATE enrollments 
        SET progress = ? 
        WHERE user_id = ? AND course_id = ?
    `);

    // 3. Process each quiz result
    db.transaction(() => {
        for (const result of allQuizResults) {
            const { userId, courseId, best_score, passing_score } = result;
            const progress = best_score >= passing_score ? 100 : 50; // Arbitrary 50% if failed, 100% if passed

            // Check if enrollment exists
            const existingEnrollment = db.prepare(
                `SELECT progress FROM enrollments WHERE user_id = ? AND course_id = ?`
            ).get(userId, courseId);

            if (!existingEnrollment) {
                // Missing enrollment entirely! Create it.
                const now = new Date().toISOString();
                const daysAvailable = courseRules[courseId] || 30;
                const deadline = new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000).toISOString();

                insertEnrollment.run(userId, courseId, progress, now, deadline);
                createdCount++;
                console.log(`[إنشاء] تمت إضافة التحاق مفقود للطالب ${userId} في مساق ${courseId} بنسبة ${progress}%`);
            } else if (existingEnrollment.progress < progress && progress === 100) {
                // Enrollment exists but progress is not updated to 100% despite passing the quiz
                updateProgress.run(progress, userId, courseId);
                updatedCount++;
                console.log(`[تحديث] تم تحديث الانجاز لـ 100% للطالب ${userId} في مساق ${courseId}`);
            }
        }
    })();

    console.log('\n--- ملخص العملية ---');
    console.log(`تم إنشاء التحاقات جديدة مفقودة: ${createdCount}`);
    console.log(`تم تحديث نسب الإنجاز إلى 100%: ${updatedCount}`);
    console.log('-------------------\n');

} catch (err) {
    console.error('حدث خطأ أثناء تنفيذ عملية التصحيح:', err);
} finally {
    db.close();
}
