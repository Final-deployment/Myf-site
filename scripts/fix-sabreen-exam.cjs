const db = require('better-sqlite3')('database.sqlite');

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
    const quizzes = db.prepare("SELECT id FROM quizzes WHERE courseId = ?").all(course.id);
    for (const quiz of quizzes) {
        const deleteResult = db.prepare("DELETE FROM quiz_results WHERE userId = ? AND quizId = ?").run(user.id, quiz.id);
        if (deleteResult.changes > 0) {
            console.log(`تم مسح النتيجة القديمة للاختبار (Quiz ID: ${quiz.id}) لتتمكن من إعادته.`);
        }
    }

    // 4. استرجاع المشاهدات واستكمال الدروس بنسبة 100%
    const episodes = db.prepare("SELECT id, title FROM episodes WHERE courseId = ?").all(course.id);
    console.log(`جاري تحديث تقدم الدروس (${episodes.length} درس)...`);

    for (const ep of episodes) {
        // تحديث أو إدخال إكمال الحلقة
        db.prepare(`
            INSERT INTO episode_progress (userId, courseId, episodeId, completed, completedAt) 
            VALUES (?, ?, ?, 1, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET completed = 1
        `).run(user.id, course.id, ep.id);
        
        // Some sqlite versions might not support ON CONFLICT(id) if id is not provided or it's a surrogate key. 
        // Let's use a safer approach for better-sqlite3 without strict UPSERT over synthetic PKs:
        db.prepare(`DELETE FROM episode_progress WHERE userId = ? AND courseId = ? AND episodeId = ?`).run(user.id, course.id, ep.id);
        db.prepare(`INSERT INTO episode_progress (userId, courseId, episodeId, completed, completedAt) VALUES (?, ?, ?, 1, datetime('now'))`).run(user.id, course.id, ep.id);
    }

    // 5. تحديث التقدم العام في المساق ليصبح 100% (ولكن بدون إنهاء المساق كلياً لتسمح للامتحان بالظهور)
    db.prepare(`DELETE FROM enrollments WHERE userId = ? AND courseId = ?`).run(user.id, course.id);
    db.prepare(`INSERT INTO enrollments (userId, courseId, progress, lastAccess) VALUES (?, ?, 100, datetime('now'))`).run(user.id, course.id);

    console.log("=== اكتمل العمل بنجاح! ===");
    console.log(`تم إعادة فتح مساق "${course.title}" للطالبة "${user.name}" بنسبة 100% وتمت تصفية سجلات الاختبار لتبدأه الآن.`);

} catch (e) {
    console.error("حدث خطأ:", e.message);
}
