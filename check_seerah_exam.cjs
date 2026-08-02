const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

console.log('--- فحص امتحان السيرة النبوية ---');

try {
    const quiz = db.prepare("SELECT id, title, courseId, afterEpisodeIndex, passing_score FROM quizzes WHERE courseId = 'course_seerah'").get();
    
    if (quiz) {
        console.log('✅ الامتحان موجود في قاعدة البيانات:');
        console.log(quiz);
    } else {
        console.log('❌ لم يتم العثور على أي امتحان لمساق السيرة النبوية (course_seerah).');
    }

    // فحص الأسئلة
    if (quiz) {
        const questionsStr = db.prepare("SELECT questions FROM quizzes WHERE courseId = 'course_seerah'").get().questions;
        if (questionsStr) {
            const questions = JSON.parse(questionsStr);
            console.log(`\n✅ عدد الأسئلة المتوفرة في الامتحان: ${questions.length} أسئلة.`);
        } else {
            console.log('\n❌ لا يوجد أسئلة محفوظة للامتحان.');
        }
    }
} catch (e) {
    console.error('حدث خطأ أثناء الفحص:', e.message);
}
