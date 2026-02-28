const { db } = require('./server/database.cjs');

const studentEmail = 'student_1@example.com';
const user = db.prepare('SELECT id, role FROM users WHERE email = ?').get(studentEmail);

if (!user) {
    console.log('Student not found');
} else {
    console.log('User Found:', user);
    const courses = db.prepare('SELECT id, title, folder_id FROM courses ORDER BY order_index ASC').all();
    const enrollments = db.prepare('SELECT * FROM enrollments WHERE user_id = ?').all(user.id);
    console.log('Enrollments:', enrollments);

    courses.forEach(c => {
        const enrollment = enrollments.find(e => e.course_id === c.id);
        console.log(`Course: ${c.title} (${c.id}) - Enrolled: ${!!enrollment}`);
    });
}
process.exit(0);
