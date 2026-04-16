const db = require('better-sqlite3')('database.sqlite');
const users = db.prepare('SELECT id, name, email FROM users WHERE name LIKE ?').all('%صابرين%');
const courses = db.prepare('SELECT id, title FROM courses WHERE title LIKE ?').all('%الحيض%');
console.log('Users:', users);
console.log('Courses:', courses);

if (users.length > 0 && courses.length > 0) {
    const studentId = users[0].id;
    const courseId = courses[0].id;
    console.log('\n--- Status ---');
    console.log('Enrollment:', db.prepare('SELECT * FROM enrollments WHERE courseId = ? AND userId = ?').get(courseId, studentId));
    console.log('Episode Progress:', db.prepare('SELECT * FROM episode_progress WHERE courseId = ? AND userId = ?').all(courseId, studentId));
    console.log('Quiz Results:', db.prepare('SELECT qr.* FROM quiz_results qr JOIN quizzes q ON qr.quizId = q.id WHERE q.courseId = ? AND qr.userId = ?').all(courseId, studentId));
}
