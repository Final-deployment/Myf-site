/**
 * ============================================================================
 * سكريبت صيانة شامل v2: فتح المساقات المقفلة ظلماً
 * ============================================================================
 * 
 * يستخدم نفس مسار قاعدة البيانات الحالي على السيرفر
 * 
 * شغّل: node scripts/fix_all_locked_courses.cjs
 * ============================================================================
 */

let db;
try {
    // Try relative path first (when running from project root)
    db = require('../server/database.cjs').db;
} catch (e) {
    try {
        // Try absolute require
        const path = require('path');
        const dbPath = path.resolve(__dirname, '..', 'server', 'database.cjs');
        db = require(dbPath).db;
    } catch (e2) {
        console.error('❌ لم يتم العثور على قاعدة البيانات. تأكد من تشغيل السكريبت من مجلد المشروع الرئيسي.');
        console.error('   مثال: node scripts/fix_all_locked_courses.cjs');
        console.error('   الخطأ:', e2.message);
        process.exit(1);
    }
}

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         سكريبت صيانة شامل v2 — فتح المساقات المقفلة ظلماً       ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

let totalUnlocked = 0;
let totalProgressFixed = 0;
let totalCompletedFixed = 0;

try {
    // ==========================================
    // الخطوة 1: فحص قاعدة البيانات
    // ==========================================
    const totalEnrollments = db.prepare('SELECT COUNT(*) as c FROM enrollments').get().c;
    const lockedCount = db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE is_locked = 1').get().c;
    console.log(`📊 إجمالي التسجيلات: ${totalEnrollments}`);
    console.log(`🔒 التسجيلات المقفلة: ${lockedCount}\n`);

    if (lockedCount === 0) {
        console.log('✅ لا توجد تسجيلات مقفلة. لا حاجة للإصلاح.');
        process.exit(0);
    }

    // ==========================================
    // الخطوة 2: جمع كل التسجيلات المقفلة
    // ==========================================
    const lockedEnrollments = db.prepare(`
        SELECT e.user_id, e.course_id, e.progress, e.completed, e.is_locked, e.deadline,
               u.name as student_name, c.title as course_title
        FROM enrollments e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN courses c ON e.course_id = c.id
        WHERE e.is_locked = 1
    `).all();

    console.log('─────────────────────────────────────────────');
    console.log('📋 فحص كل تسجيل مقفل:');
    console.log('─────────────────────────────────────────────\n');

    for (const enrollment of lockedEnrollments) {
        const { user_id, course_id, progress, completed, student_name, course_title } = enrollment;

        console.log(`  👤 "${student_name || user_id}" — 📚 "${course_title || course_id}"`);
        console.log(`     progress=${progress}%, completed=${completed}, is_locked=1`);

        // تحقق: هل اجتاز الطالب جميع اختبارات هذا المساق؟
        const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(course_id).c;
        
        let allQuizzesPassed = false;
        let passedCount = 0;
        
        if (quizCount > 0) {
            passedCount = db.prepare(`
                SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
                JOIN quizzes q ON qr.quizId = q.id
                WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
            `).get(user_id, course_id).c;
            allQuizzesPassed = passedCount >= quizCount;
            console.log(`     اختبارات: ${passedCount}/${quizCount} ناجحة${allQuizzesPassed ? ' ✅' : ' ❌'}`);
        } else {
            // لا يوجد اختبارات — المساق يُعتبر مُجتازاً إذا progress >= 100
            allQuizzesPassed = progress >= 100 || completed === 1;
            console.log(`     لا اختبارات — ${allQuizzesPassed ? 'مكتمل ✅' : 'غير مكتمل ❌'}`);
        }

        if (allQuizzesPassed) {
            // فتح المساق
            const result = db.prepare('UPDATE enrollments SET is_locked = 0 WHERE user_id = ? AND course_id = ?')
              .run(user_id, course_id);
            
            if (result.changes > 0) {
                totalUnlocked++;
                console.log(`     ➡️  تم الفتح! ✅\n`);
            } else {
                console.log(`     ⚠️  لم يتم التحديث (0 changes)!\n`);
            }
        } else {
            console.log(`     ➡️  أُبقي مقفلاً (لم يجتز المتطلبات)\n`);
        }
    }

    // ==========================================
    // الخطوة 3: إصلاح progress و completed
    // ==========================================
    console.log('─────────────────────────────────────────────');
    console.log('📊 الخطوة 3: إصلاح حالات progress و completed');
    console.log('─────────────────────────────────────────────\n');

    const allEnrollments = db.prepare(`
        SELECT e.user_id, e.course_id, e.progress, e.completed,
               u.name as student_name, c.title as course_title
        FROM enrollments e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN courses c ON e.course_id = c.id
    `).all();

    for (const enrollment of allEnrollments) {
        const { user_id, course_id, progress, completed, student_name, course_title } = enrollment;

        // تحقق من إتمام جميع الدروس
        const totalEpisodes = db.prepare('SELECT COUNT(*) as c FROM episodes WHERE courseId = ?').get(course_id).c;
        
        if (totalEpisodes === 0) continue; // لا دروس - تجاوز

        const completedEpisodes = db.prepare(`
            SELECT COUNT(*) as c FROM episode_progress 
            WHERE user_id = ? AND episode_id IN (SELECT id FROM episodes WHERE courseId = ?)
            AND completed = 1
        `).get(user_id, course_id).c;

        // تحقق من اجتياز جميع الاختبارات
        const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(course_id).c;
        let allQuizzesPassed = true;
        if (quizCount > 0) {
            const passedCount = db.prepare(`
                SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
                JOIN quizzes q ON qr.quizId = q.id
                WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
            `).get(user_id, course_id).c;
            allQuizzesPassed = passedCount >= quizCount;
        }

        // إصلاح: جميع الدروس مكتملة + جميع الاختبارات ناجحة
        if (completedEpisodes >= totalEpisodes && allQuizzesPassed) {
            if (progress < 100) {
                db.prepare('UPDATE enrollments SET progress = 100 WHERE user_id = ? AND course_id = ?')
                  .run(user_id, course_id);
                totalProgressFixed++;
                console.log(`  📈 progress → 100%: "${course_title}" — "${student_name}"`);
            }
            if (!completed) {
                db.prepare('UPDATE enrollments SET completed = 1 WHERE user_id = ? AND course_id = ?')
                  .run(user_id, course_id);
                totalCompletedFixed++;
                console.log(`  ☑️  completed → 1: "${course_title}" — "${student_name}"`);
            }
        }
    }

    // ==========================================
    // التحقق النهائي
    // ==========================================
    const remainingLocked = db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE is_locked = 1').get().c;

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                         الملخص النهائي                           ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║  مساقات تم فتحها (إلغاء القفل):        ${String(totalUnlocked).padStart(5)}                  ║`);
    console.log(`║  تسجيلات أُصلح progress فيها إلى 100%: ${String(totalProgressFixed).padStart(5)}                  ║`);
    console.log(`║  تسجيلات أُصلح completed فيها إلى 1:   ${String(totalCompletedFixed).padStart(5)}                  ║`);
    console.log(`║  تسجيلات لا تزال مقفلة (بحق):          ${String(remainingLocked).padStart(5)}                  ║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝');

} catch (error) {
    console.error('\n❌ حدث خطأ أثناء تنفيذ السكريبت:', error.message);
    console.error(error.stack);
    process.exit(1);
}

console.log('\n✅ انتهى السكريبت بنجاح.');
