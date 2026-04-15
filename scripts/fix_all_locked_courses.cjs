/**
 * ============================================================================
 * سكريبت صيانة شامل: فتح جميع المساقات المقفلة ظلماً
 * ============================================================================
 * 
 * يقوم هذا السكريبت بـ:
 * 1. فتح أي مساق مقفل (is_locked=1) إذا كان الطالب قد اجتاز جميع اختباراته
 * 2. تحديث progress إلى 100 و completed إلى 1 للمساقات التي اختباراتها ناجحة ودروسها مكتملة
 * 3. إصلاح حالات عدم التناسق بين episode_progress و enrollments
 * 
 * شغّل على السيرفر الحي بعد git pull:
 *   node scripts/fix_all_locked_courses.cjs
 * ============================================================================
 */

const { db } = require('../server/database.cjs');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       سكريبت صيانة شامل — فتح المساقات المقفلة ظلماً       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let totalUnlocked = 0;
let totalProgressFixed = 0;
let totalCompletedFixed = 0;

try {
    // ==========================================
    // الخطوة 1: جمع كل التسجيلات المقفلة
    // ==========================================
    const lockedEnrollments = db.prepare(`
        SELECT e.user_id, e.course_id, e.progress, e.completed, e.is_locked, e.deadline,
               u.name as student_name, c.title as course_title
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.is_locked = 1
    `).all();

    console.log(`📋 عدد التسجيلات المقفلة حالياً: ${lockedEnrollments.length}\n`);

    for (const enrollment of lockedEnrollments) {
        const { user_id, course_id, progress, student_name, course_title } = enrollment;

        // تحقق: هل اجتاز الطالب جميع اختبارات هذا المساق؟
        const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(course_id).c;
        
        let allQuizzesPassed = false;
        
        if (quizCount > 0) {
            const passedCount = db.prepare(`
                SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
                JOIN quizzes q ON qr.quizId = q.id
                WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
            `).get(user_id, course_id).c;
            allQuizzesPassed = passedCount >= quizCount;
        } else {
            // لا يوجد اختبارات — نتحقق من إتمام الدروس
            allQuizzesPassed = progress >= 100;
        }

        if (allQuizzesPassed) {
            // فتح المساق
            db.prepare('UPDATE enrollments SET is_locked = 0 WHERE user_id = ? AND course_id = ?')
              .run(user_id, course_id);
            totalUnlocked++;
            console.log(`  ✅ فُتح: "${course_title}" للطالب "${student_name}" (${quizCount > 0 ? `${quizCount} اختبارات ناجحة` : 'مكتمل 100%'})`);
        } else {
            console.log(`  ⏭️  أُبقي مقفلاً: "${course_title}" للطالب "${student_name}" (لم يجتز جميع الاختبارات)`);
        }
    }

    // ==========================================
    // الخطوة 2: إصلاح progress و completed للمساقات المجتازة
    // ==========================================
    console.log('\n─────────────────────────────────────────────');
    console.log('📊 الخطوة 2: إصلاح حالات progress و completed');
    console.log('─────────────────────────────────────────────\n');

    const allEnrollments = db.prepare(`
        SELECT e.user_id, e.course_id, e.progress, e.completed,
               u.name as student_name, c.title as course_title
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
    `).all();

    for (const enrollment of allEnrollments) {
        const { user_id, course_id, progress, completed, student_name, course_title } = enrollment;

        // تحقق من إتمام جميع الدروس
        const totalEpisodes = db.prepare('SELECT COUNT(*) as c FROM episodes WHERE courseId = ?').get(course_id).c;
        const completedEpisodes = db.prepare(`
            SELECT COUNT(*) as c FROM episode_progress 
            WHERE user_id = ? AND episode_id IN (SELECT id FROM episodes WHERE courseId = ?)
            AND completed = 1
        `).get(user_id, course_id).c;

        // تحقق من اجتياز جميع الاختبارات
        const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(course_id).c;
        let allQuizzesPassed = false;
        if (quizCount > 0) {
            const passedCount = db.prepare(`
                SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
                JOIN quizzes q ON qr.quizId = q.id
                WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
            `).get(user_id, course_id).c;
            allQuizzesPassed = passedCount >= quizCount;
        } else {
            allQuizzesPassed = true; // لا اختبارات
        }

        // حالة 1: جميع الدروس مكتملة + جميع الاختبارات ناجحة → progress = 100, completed = 1
        if (totalEpisodes > 0 && completedEpisodes >= totalEpisodes && allQuizzesPassed) {
            if (progress < 100) {
                db.prepare('UPDATE enrollments SET progress = 100 WHERE user_id = ? AND course_id = ?')
                  .run(user_id, course_id);
                totalProgressFixed++;
                console.log(`  📈 progress → 100%: "${course_title}" للطالب "${student_name}" (${completedEpisodes}/${totalEpisodes} دروس)`);
            }
            if (!completed) {
                db.prepare('UPDATE enrollments SET completed = 1 WHERE user_id = ? AND course_id = ?')
                  .run(user_id, course_id);
                totalCompletedFixed++;
                console.log(`  ☑️  completed → 1: "${course_title}" للطالب "${student_name}"`);
            }
        }

        // حالة 2: الاختبارات ناجحة لكن الدروس لم تكتمل — نتأكد أنه غير مقفل
        // (تم التعامل معها في الخطوة 1 أعلاه)
    }

    // ==========================================
    // الملخص النهائي
    // ==========================================
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                        الملخص النهائي                        ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  مساقات تم فتحها (إلغاء القفل):          ${String(totalUnlocked).padStart(5)}              ║`);
    console.log(`║  تسجيلات أُصلح progress فيها إلى 100%:   ${String(totalProgressFixed).padStart(5)}              ║`);
    console.log(`║  تسجيلات أُصلح completed فيها إلى 1:     ${String(totalCompletedFixed).padStart(5)}              ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

} catch (error) {
    console.error('\n❌ حدث خطأ أثناء تنفيذ السكريبت:', error);
    process.exit(1);
}

console.log('\n✅ انتهى السكريبت بنجاح.');
