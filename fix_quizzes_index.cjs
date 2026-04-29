const { db } = require('./server/database.cjs');

console.log('==================================================');
console.log('🚀 بدء عملية إصلاح مواقع الامتحانات (Quiz Index Fix)');
console.log('==================================================\n');

try {
    // 1. Get all quizzes
    const quizzes = db.prepare('SELECT * FROM quizzes').all();
    let updatedCount = 0;

    for (const quiz of quizzes) {
        // 2. Get the course for this quiz
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(quiz.courseId);
        
        if (!course) {
            console.log(`⚠️ تحذير: الامتحان "${quiz.title}" ليس له مساق صالح. تم تخطيه.`);
            continue;
        }

        // 3. Get the actual number of episodes for this course
        const episodesCount = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE courseId = ?').get(quiz.courseId).count;
        
        // Use episodesCount if > 0, otherwise fallback to lessonsCount, otherwise 0
        const finalIndex = episodesCount > 0 ? episodesCount : (course.lessonsCount || 0);

        // 4. Update if the index is wrong
        if (quiz.afterEpisodeIndex !== finalIndex) {
            db.prepare('UPDATE quizzes SET afterEpisodeIndex = ? WHERE id = ?').run(finalIndex, quiz.id);
            
            console.log(`✅ تم التحديث: امتحان "${quiz.title}" (مساق: ${course.title})`);
            console.log(`   - تم تغيير موقعه من الدرس [${quiz.afterEpisodeIndex}] ➡️ إلى الدرس الأخير [${finalIndex}]`);
            updatedCount++;
        } else {
            console.log(`🆗 تخطي: امتحان "${quiz.title}" مضبوط مسبقاً على [${finalIndex}].`);
        }
    }

    console.log('\n==================================================');
    console.log(`🎉 تمت العملية بنجاح! تم إصلاح (${updatedCount}) امتحان.`);
    console.log('==================================================');

} catch (error) {
    console.error('❌ حدث خطأ أثناء التحديث:', error);
}
