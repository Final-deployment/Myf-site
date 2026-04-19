const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

const student = db.prepare('SELECT id, name FROM users WHERE name LIKE \'%سلسبيل فرج%\'').get();
if(student) {
  console.log('👤 الطالبة:', student.name);
  console.log('\n📚 المساقات المسجلة حالياً:');
  const en = db.prepare('SELECT c.title, e.progress, e.completed, e.enrolled_at FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?').all(student.id);
  en.forEach(e => console.log('  - ' + e.title + ' | تقدم: ' + e.progress + '% | مكتمل: ' + (e.completed ? 'نعم' : 'لا') + ' | تاريخ: ' + e.enrolled_at));
  
  console.log('\n📝 نتائج الامتحانات التي قدمتها:');
  const qr = db.prepare('SELECT c.title, qr.percentage, q.passing_score FROM quiz_results qr JOIN quizzes q ON qr.quizId=q.id JOIN courses c ON q.courseId=c.id WHERE qr.userId = ?').all(student.id);
  qr.forEach(q => console.log('  - مساق: ' + q.title + ' | العلامة: ' + q.percentage + '% | علامة النجاح المطلوبة: ' + (q.passing_score||70) + '%'));
} else {
  console.log('لم يتم العثور على طالبة بهذا الاسم');
}
