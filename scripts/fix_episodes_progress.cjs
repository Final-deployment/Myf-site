/**
 * ============================================================================
 * سكريبت صيانة: فتح جميع الدروس الداخلية للمساقات المكتملة
 * ============================================================================
 * 
 * وظيفة السكريبت:
 * يبحث عن كل طالب أتم المساق (أو اجتاز اختباراته) 
 * ويتأكد أن جميع الدروس مربوطة كـ completed=1 
 * ليتمكن الطالب من حرية التنقل في المشغل بدون قفل الدروس.
 * 
 * للتشغيل:
 * node scripts/fix_episodes_progress.cjs
 * ============================================================================
 */

let db;
try {
    const path = require('path');
    const dbPath = path.resolve(__dirname, '..', 'server', 'database.cjs');
    db = require(dbPath).db;
} catch (e) {
    try {
        db = require('../server/database.cjs').db;
    } catch(e2) {
        console.error('❌ تأكد من تشغيل السكريبت من مجلد المشروع الرئيسي.');
        process.exit(1);
    }
}

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║       سكريبت صيانة — تحرير قيود الدروس الداخلية للمكتملين        ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

try {
    let fixedEpisodesCount = 0;
    
    // 1. جلب كل التسجيلات المكتملة
    const completedEnrollments = db.prepare(`
        SELECT e.user_id, e.course_id, e.progress, u.name as student_name, c.title as course_title
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.progress >= 100 OR e.completed = 1
    `).all();

    console.log(`📊 عدد المساقات المكتملة أو شبه المكتملة: ${completedEnrollments.length}\n`);

    for (const enroll of completedEnrollments) {
        const { user_id, course_id, student_name, course_title } = enroll;

        // 2. جلب جميع الدروس لهذا المساق
        const episodes = db.prepare('SELECT id FROM episodes WHERE courseId = ?').all(course_id);
        
        let localFixedCount = 0;

        for (const ep of episodes) {
            // التحقق من حالة الدرس في جدول episode_progress
            const progress = db.prepare('SELECT completed FROM episode_progress WHERE user_id = ? AND episode_id = ? AND course_id = ?')
                               .get(user_id, ep.id, course_id);

            if (!progress) {
                // الدرس غير موجود أساساً في السجلات = إدراجه كمكتمل
                db.prepare(`
                    INSERT INTO episode_progress (user_id, episode_id, course_id, completed, last_position, watched_duration, updated_at)
                    VALUES (?, ?, ?, 1, 0, 0, CURRENT_TIMESTAMP)
                `).run(user_id, ep.id, course_id);
                localFixedCount++;
                fixedEpisodesCount++;
            } else if (progress.completed === 0) {
                // الدرس موجود لكن غير مكتمل = تحديثه لمكتمل
                db.prepare(`
                    UPDATE episode_progress SET completed = 1, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND episode_id = ? AND course_id = ?
                `).run(user_id, ep.id, course_id);
                localFixedCount++;
                fixedEpisodesCount++;
            }
        }

        if (localFixedCount > 0) {
            console.log(`  ✅ تم تحرير (${localFixedCount}) درس مغلق للطالب "${student_name}" في مساق "${course_title}"`);
        }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log(`║ تم تصحيح وتحرير إجمالي (${fixedEpisodesCount}) سجل درس ليكون متاحاً بحرية تامة ║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

} catch (error) {
    console.error('\n❌ حدث خطأ:', error.message);
    process.exit(1);
}
