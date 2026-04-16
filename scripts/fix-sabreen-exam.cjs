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

    // Helper functions to get exact column names from Production PRAGMA
    function getColumns(tableName) {
        const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
        return info.map(c => c.name);
    }
    
    // Determine dynamic column names:
    const quizCols = getColumns('quiz_results');
    const qUserId = quizCols.includes('user_id') ? 'user_id' : 'userId';
    const qQuizId = quizCols.includes('quiz_id') ? 'quiz_id' : 'quizId';

    const epCols = getColumns('episode_progress');
    const eUserId = epCols.includes('user_id') ? 'user_id' : 'userId';
    const eCourseId = epCols.includes('course_id') ? 'course_id' : 'courseId';
    const eEpId = epCols.includes('episode_id') ? 'episode_id' : 'episodeId';
    const eCompletedAt = epCols.includes('updated_at') ? 'updated_at' : 'completedAt';

    const enCols = getColumns('enrollments');
    const enUserId = enCols.includes('user_id') ? 'user_id' : 'userId';
    const enCourseId = enCols.includes('course_id') ? 'course_id' : 'courseId';
    const enLastAccess = enCols.includes('last_accessed') ? 'last_accessed' : 'lastAccess';

    // 3. مسح الاختبار
    const quizzes = db.prepare("SELECT id FROM quizzes WHERE courseId = ? OR id IN (SELECT id FROM quizzes WHERE course_id = ?)").all(course.id, course.id);
    for (const quiz of quizzes) {
        db.prepare(`DELETE FROM quiz_results WHERE ${qUserId} = ? AND ${qQuizId} = ?`).run(user.id, quiz.id);
        console.log(`تم مسح النتيجة القديمة للاختبار (Quiz ID: ${quiz.id}) لتتمكن من إعادته.`);
    }

    // 4. استرجاع المشاهدات بنسبة 100%
    const episodes = db.prepare("SELECT id, title FROM episodes WHERE courseId = ? OR course_id = ?").all(course.id, course.id);
    console.log(`جاري تحديث تقدم الدروس (${episodes.length} درس)...`);

    for (const ep of episodes) {
        db.prepare(`DELETE FROM episode_progress WHERE ${eUserId} = ? AND ${eCourseId} = ? AND ${eEpId} = ?`).run(user.id, course.id, ep.id);
        db.prepare(`INSERT INTO episode_progress (${eUserId}, ${eCourseId}, ${eEpId}, completed, ${eCompletedAt}) VALUES (?, ?, ?, 1, datetime('now'))`).run(user.id, course.id, ep.id);
    }

    // 5. تحديث التقدم العام في المساق ليصبح 100%
    db.prepare(`DELETE FROM enrollments WHERE ${enUserId} = ? AND ${enCourseId} = ?`).run(user.id, course.id);
    db.prepare(`INSERT INTO enrollments (${enUserId}, ${enCourseId}, progress, ${enLastAccess}) VALUES (?, ?, 100, datetime('now'))`).run(user.id, course.id);

    console.log("=== اكتمل العمل بنجاح المرة هذه! ===");
    console.log(`تم إعادة فتح مساق "${course.title}" بنسبة 100% وتصفية سجلات الاختبار.`);

} catch (e) {
    console.error("حدث خطأ:", e.message);
}
