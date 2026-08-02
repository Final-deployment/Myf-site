const { db } = require('./server/database.cjs');

// 1. Get a course
const course = db.prepare('SELECT id FROM courses LIMIT 1').get();
if (!course) { console.log('No courses found.'); process.exit(1); }

// 2. Get or create a test user
let user = db.prepare('SELECT id FROM users WHERE email = ?').get('dummy_stuck@example.com');
if (!user) {
    const insertUser = db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
    const newId = 'dummy-user-123';
    insertUser.run(newId, 'طالب وهمي عالق', 'dummy_stuck@example.com', 'dummy', 'student');
    user = { id: newId };
}

// 3. Create a stuck enrollment
const existingEnrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(user.id, course.id);
if (existingEnrollment) {
    db.prepare('UPDATE enrollments SET progress = 100, completed = 0 WHERE user_id = ? AND course_id = ?').run(user.id, course.id);
} else {
    db.prepare('INSERT INTO enrollments (user_id, course_id, progress, completed, is_locked) VALUES (?, ?, ?, ?, ?)').run(user.id, course.id, 100, 0, 0);
}

console.log('Dummy stuck student created successfully!');

// 4. Require the Watchman and run it immediately!
const { runWatchman } = require('./server/ai_watchman.cjs');

console.log('Starting AI Watchman to auto-remediate...');
runWatchman().then(() => {
    console.log('Watchman finished checking and remediating.');
    
    // Check if remediation worked
    const checkEnroll = db.prepare('SELECT completed FROM enrollments WHERE user_id = ? AND course_id = ?').get(user.id, course.id);
    console.log('Enrollment completed status is now:', checkEnroll.completed);
    
    // Check notifications
    const notifs = db.prepare('SELECT * FROM in_app_notifications WHERE user_id = ?').all(user.id);
    console.log('Notifications sent to student:', notifs);
});
