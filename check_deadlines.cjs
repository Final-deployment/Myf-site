const { db } = require('./server/database.cjs');

const studentEmail = 'student_1@example.com';
const user = db.prepare('SELECT id FROM users WHERE email = ?').get(studentEmail);

if (!user) {
    console.log('Student not found');
} else {
    const enrollments = db.prepare('SELECT e.*, c.title, c.days_available FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?').all(user.id);
    console.log('Enrollments with Details:', JSON.stringify(enrollments, null, 2));

    const now = new Date();
    enrollments.forEach(e => {
        const deadline = new Date(e.deadline);
        console.log(`Course: ${e.title} - Deadline: ${e.deadline} - Past: ${now > deadline} - IsLocked: ${e.is_locked}`);
    });
}
process.exit(0);
