const db = require('better-sqlite3')('data/db.sqlite');

try {
    console.log("=== بدء سكريبت استرجاع تقدم الطالبة صابرين ===");

    // 1. البحث عن الطالبة
    const user = db.prepare("SELECT id, name FROM users WHERE name LIKE '%صابرين%'").get();
    if (!user) {
        throw new Error("لم يتم العثور على الطالبة صابرين في قاعدة البيانات.");
    }
    console.log(`تم العثور على الطالبة: ${user.name} (ID: ${user.id})`);

    // 2. البحث عن المساق
    const course = db.prepare("SELECT id, title FROM courses WHERE title LIKE '%الحيض%' OR title LIKE '%النفاس%'").get();
    if (!course) {
        throw new Error("لم يتم العثور على مساق الحيض والنفاس.");
    }
    console.log(`تم العثور على المساق: ${course.title} (ID: ${course.id})`);

    // 3. مسح أي سجلات امتحانات سابقة لها في هذا المساق (لتتمكن من الفتح والتقديم من الصفر)
    // Check schema for quiz_results
    const quizzes = db.prepare("SELECT id FROM quizzes WHERE courseId = ? OR id IN (SELECT id FROM quizzes WHERE course_id = ?)").all(course.id, course.id);
    for (const quiz of quizzes) {
        try {
            db.prepare("DELETE FROM quiz_results WHERE user_id = ? AND quiz_id = ?").run(user.id, quiz.id);
        } catch(e) {
            db.prepare("DELETE FROM quiz_results WHERE userId = ? AND quizId = ?").run(user.id, quiz.id);
        }
        console.log(`تم مسح النتيجة القديمة للاختبار (Quiz ID: ${quiz.id}) لتتمكن من إعادته.`);
    }

    // 4. استرجاع المشاهدات واستكمال الدروس بنسبة 100%
    const episodes = db.prepare("SELECT id, title FROM episodes WHERE courseId = ? OR course_id = ?").all(course.id, course.id);
    console.log(`جاري تحديث تقدم الدروس (${episodes.length} درس)...`);

    for (const ep of episodes) {
        try {
            db.prepare(`DELETE FROM episode_progress WHERE user_id = ? AND course_id = ? AND episode_id = ?`).run(user.id, course.id, ep.id);
            db.prepare(`INSERT INTO episode_progress (user_id, course_id, episode_id, completed, updated_at) VALUES (?, ?, ?, 1, datetime('now'))`).run(user.id, course.id, ep.id);
        } catch(e) {
            db.prepare(`DELETE FROM episode_progress WHERE userId = ? AND courseId = ? AND episodeId = ?`).run(user.id, course.id, ep.id);
            db.prepare(`INSERT INTO episode_progress (userId, courseId, episodeId, completed, completedAt) VALUES (?, ?, ?, 1, datetime('now'))`).run(user.id, course.id, ep.id);
        }
    }

    // 5. تحديث التقدم العام في المساق ليصبح 100%
    try {
        db.prepare(`DELETE FROM enrollments WHERE user_id = ? AND course_id = ?`).run(user.id, course.id);
        db.prepare(`INSERT INTO enrollments (user_id, course_id, progress, last_accessed) VALUES (?, ?, 100, datetime('now'))`).run(user.id, course.id);
    } catch(e) {
        db.prepare(`DELETE FROM enrollments WHERE userId = ? AND courseId = ?`).run(user.id, course.id);
        db.prepare(`INSERT INTO enrollments (userId, courseId, progress, lastAccess) VALUES (?, ?, 100, datetime('now'))`).run(user.id, course.id);
    }

    console.log("=== اكتمل العمل بنجاح! ===");
    console.log(`تم إعادة فتح مساق "${course.title}" للطالبة "${user.name}" بنسبة 100% وتمت تصفية سجلات الاختبار لتبدأه الآن.`);

} catch (e) {
    console.error("حدث خطأ رئيسي:", e.message);
}
