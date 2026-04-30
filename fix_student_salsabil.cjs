/**
 * FIX: Restore progress for student "سلسبيل شتيوي" after course reordering fix.
 * 
 * SITUATION:
 * - She passed 4 courses: Madkhal(0), Aqeeda(1), Fiqh1(2), Nifas(3)
 * - Due to old ordering bug, Seerah(6) was opened instead of Tafseer(4)
 * - After reordering fix, all courses appear locked due to expired deadlines
 * 
 * THIS SCRIPT:
 * 1. Finds the student by name
 * 2. Shows her current enrollment + quiz status
 * 3. Marks all completed courses as NOT locked
 * 4. Opens the NEXT correct course (Tafseer - order 4) for her
 * 5. If she had enrolled in Seerah by mistake, keeps that enrollment but she can't access it
 *    until she passes Tafseer(4) and Tazkiyah(5) naturally
 * 
 * Run on server: node fix_student_salsabil.cjs
 */
const { db } = require('./server/database.cjs');

// ==========================================
// 1. Find the student
// ==========================================
const student = db.prepare("SELECT * FROM users WHERE name LIKE '%سلسبيل%'").get();

if (!student) {
    console.log('❌ لم يتم العثور على الطالبة "سلسبيل". محاولة البحث بطرق أخرى...');
    const allStudents = db.prepare("SELECT id, name, email FROM users WHERE role = 'student'").all();
    console.log(`\nقائمة الطلاب (${allStudents.length}):`);
    allStudents.forEach(s => console.log(`  - ${s.name} (${s.email}) [${s.id}]`));
    process.exit(1);
}

console.log(`\n✅ تم العثور على الطالبة: ${student.name}`);
console.log(`   Email: ${student.email}`);
console.log(`   ID: ${student.id}`);

// ==========================================
// 2. Show current course order
// ==========================================
console.log('\n=== ترتيب المساقات الحالي ===');
const courses = db.prepare("SELECT id, title, order_index FROM courses WHERE folder_id = 'foundation_shariah' ORDER BY order_index ASC, id ASC").all();
courses.forEach((c, i) => {
    console.log(`  ${c.order_index}: ${c.title} (${c.id})`);
});

// ==========================================
// 3. Show her enrollments
// ==========================================
console.log('\n=== التحاقاتها الحالية ===');
const enrollments = db.prepare(`
    SELECT e.*, c.title, c.order_index 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.id 
    WHERE e.user_id = ?
    ORDER BY c.order_index ASC
`).all(student.id);

enrollments.forEach(e => {
    const deadlineStr = e.deadline ? new Date(e.deadline).toLocaleDateString('ar-EG') : 'لا يوجد';
    const expired = e.deadline && new Date() > new Date(e.deadline);
    console.log(`  [order ${e.order_index}] ${e.title}`);
    console.log(`    progress=${e.progress}% | completed=${e.completed} | is_locked=${e.is_locked} | deadline=${deadlineStr} ${expired ? '⏰ منتهي' : '✅'}`);
});

// ==========================================
// 4. Show her quiz results
// ==========================================
console.log('\n=== نتائج اختباراتها ===');
const quizResults = db.prepare(`
    SELECT qr.*, q.courseId, q.title as quizTitle, q.passing_score, c.title as courseTitle
    FROM quiz_results qr
    JOIN quizzes q ON qr.quizId = q.id
    JOIN courses c ON q.courseId = c.id
    WHERE qr.userId = ?
    ORDER BY qr.completedAt ASC
`).all(student.id);

quizResults.forEach(r => {
    const passed = r.percentage >= r.passing_score;
    console.log(`  ${passed ? '✅' : '❌'} ${r.courseTitle} — ${r.percentage}% (${passed ? 'ناجح' : 'راسب'}) — ${r.completedAt}`);
});

// ==========================================
// 5. Check which courses she has PASSED
// ==========================================
console.log('\n=== تحقق من اجتياز المساقات ===');
const CORRECT_ORDER = [
    'course_madkhal',        // 0
    'course_aqeeda',         // 1
    'course_fiqh1-waseelit', // 2
    'course_nifas',          // 3
    'course_tafseer',        // 4
    'course_tazkiyah',       // 5
    'course_seerah',         // 6
    'course_arba3oon',       // 7
    'course_fiqh2-it7af',    // 8
];

let lastPassedIndex = -1;
for (let i = 0; i < CORRECT_ORDER.length; i++) {
    const courseId = CORRECT_ORDER[i];
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    
    // Check quiz pass
    const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(courseId).c;
    let passed = false;
    
    if (quizCount > 0) {
        const passedCount = db.prepare(`
            SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
            JOIN quizzes q ON qr.quizId = q.id
            WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= q.passing_score
        `).get(student.id, courseId).c;
        passed = passedCount >= quizCount;
    } else {
        const completed = db.prepare(
            'SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND (progress >= 100 OR completed = 1)'
        ).get(student.id, courseId);
        passed = !!completed;
    }
    
    console.log(`  ${i}: ${course?.title || courseId} — ${passed ? '✅ اجتازت' : '❌ لم تجتز'}`);
    if (passed) lastPassedIndex = i;
}

const nextCourseIndex = lastPassedIndex + 1;
const nextCourseId = CORRECT_ORDER[nextCourseIndex];
const nextCourse = nextCourseId ? db.prepare('SELECT * FROM courses WHERE id = ?').get(nextCourseId) : null;

console.log(`\n📍 آخر مساق اجتازته: ${lastPassedIndex >= 0 ? courses.find(c => c.id === CORRECT_ORDER[lastPassedIndex])?.title : 'لا شيء'} (index ${lastPassedIndex})`);
console.log(`📍 المساق التالي المفترض فتحه: ${nextCourse?.title || 'أنهت كل المساقات!'} (index ${nextCourseIndex})`);

// ==========================================
// 6. APPLY FIXES
// ==========================================
console.log('\n=== تطبيق الإصلاحات ===');

db.transaction(() => {
    // A) Mark all PASSED courses as unlocked and completed
    for (let i = 0; i <= lastPassedIndex; i++) {
        const courseId = CORRECT_ORDER[i];
        const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(student.id, courseId);
        
        if (enrollment) {
            db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0, completed = 1, progress = 100 
                WHERE user_id = ? AND course_id = ?
            `).run(student.id, courseId);
            console.log(`  ✅ ${courseId} — فُتح وعُلّم كمكتمل`);
        } else {
            // She passed the quiz but wasn't enrolled — create enrollment as completed
            db.prepare(`
                INSERT INTO enrollments (user_id, course_id, enrolled_at, progress, completed, is_locked, deadline)
                VALUES (?, ?, CURRENT_TIMESTAMP, 100, 1, 0, NULL)
            `).run(student.id, courseId);
            console.log(`  ✅ ${courseId} — أُنشئ تسجيل مكتمل (كانت ناجحة لكن غير مسجلة)`);
        }
    }

    // B) Open the NEXT course for her (enroll if not enrolled, unlock if locked)
    if (nextCourseId) {
        const nextEnrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(student.id, nextCourseId);
        
        if (nextEnrollment) {
            // Reset deadline from NOW + days_available
            const daysAvailable = nextCourse?.days_available || 30;
            const newDeadline = new Date();
            newDeadline.setDate(newDeadline.getDate() + daysAvailable);
            
            db.prepare(`
                UPDATE enrollments 
                SET is_locked = 0, deadline = ?, extensions_used = 0 
                WHERE user_id = ? AND course_id = ?
            `).run(newDeadline.toISOString(), student.id, nextCourseId);
            console.log(`  🔓 ${nextCourseId} — فُتح مع مهلة جديدة (${daysAvailable} يوم من الآن)`);
        } else {
            // Enroll her in the next course
            const daysAvailable = nextCourse?.days_available || 30;
            const newDeadline = new Date();
            newDeadline.setDate(newDeadline.getDate() + daysAvailable);
            
            db.prepare(`
                INSERT INTO enrollments (user_id, course_id, enrolled_at, progress, completed, is_locked, deadline, extensions_used)
                VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0, 0, ?, 0)
            `).run(student.id, nextCourseId, newDeadline.toISOString());
            console.log(`  🆕 ${nextCourseId} — تم تسجيلها وفتح المساق (${daysAvailable} يوم)`);
        }
    }
})();

// ==========================================
// 7. Verify final state
// ==========================================
console.log('\n=== الحالة النهائية بعد الإصلاح ===');
const finalEnrollments = db.prepare(`
    SELECT e.*, c.title, c.order_index 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.id 
    WHERE e.user_id = ?
    ORDER BY c.order_index ASC
`).all(student.id);

finalEnrollments.forEach(e => {
    const deadlineStr = e.deadline ? new Date(e.deadline).toLocaleDateString('ar-EG') : '—';
    const status = e.completed ? '✅ مكتمل' : e.is_locked ? '🔒 مغلق' : '🟢 مفتوح';
    console.log(`  [${e.order_index}] ${e.title} — ${status} | progress=${e.progress}% | deadline=${deadlineStr}`);
});

console.log('\n=== تم الإصلاح بنجاح! ===');
console.log(`المساق المفتوح التالي: ${nextCourse?.title || 'أنهت الدورة!'}`);
