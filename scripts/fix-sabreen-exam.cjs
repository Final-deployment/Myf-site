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

    // 3. مسح نتائج الاختبار لتلك الطالبة فقط
    // Schema -> quizzes: courseId | quiz_results: userId, quizId
    const quizzes = db.prepare("SELECT id FROM quizzes WHERE courseId = ?").all(course.id);
    for (const quiz of quizzes) {
        db.prepare("DELETE FROM quiz_results WHERE userId = ? AND quizId = ?").run(user.id, quiz.id);
        console.log(`تم مسح النتيجة القديمة للاختبار (Quiz ID: ${quiz.id}) إن وجدت.`);
    }

    // 4. استكمال الدروس
    // Schema -> episodes: courseId | episode_progress: user_id, course_id, episode_id
    const episodes = db.prepare("SELECT id, title FROM episodes WHERE courseId = ?").all(course.id);
    console.log(`جاري تحديث تقدم الدروس (${episodes.length} درس)...`);

    for (const ep of episodes) {
        db.prepare(`DELETE FROM episode_progress WHERE user_id = ? AND course_id = ? AND episode_id = ?`).run(user.id, course.id, ep.id);
        db.prepare(`INSERT INTO episode_progress (user_id, course_id, episode_id, completed, updated_at) VALUES (?, ?, ?, 1, datetime('now'))`).run(user.id, course.id, ep.id);
    }

    // 5. استكمال التقدم
    // Schema -> enrollments: user_id, course_id
    db.prepare(`DELETE FROM enrollments WHERE user_id = ? AND course_id = ?`).run(user.id, course.id);
    db.prepare(`INSERT INTO enrollments (user_id, course_id, progress, last_accessed) VALUES (?, ?, 100, datetime('now'))`).run(user.id, course.id);

    console.log("=== اكتمل العمل بنجاح! ===");

} catch (e) {
    console.error("حدث خطأ:", e.message);
}
