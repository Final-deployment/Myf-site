// Debug script to check the state of b@b.com tester account
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

const user = db.prepare("SELECT id, email, role, is_tester FROM users WHERE email = 'b@b.com'").get();
console.log('\n=== USER ===');
console.log(user);

if (user) {
    const enrollments = db.prepare("SELECT * FROM enrollments WHERE user_id = ?").all(user.id);
    console.log('\n=== ENROLLMENTS ===');
    console.log(enrollments);

    const episodes = db.prepare("SELECT ep.id, ep.courseId, ep.title, ep.orderIndex FROM episodes ep WHERE ep.courseId = 'course_madkhal' ORDER BY ep.orderIndex").all();
    console.log('\n=== MADKHAL EPISODES ===');
    console.log(episodes);

    const progress = db.prepare("SELECT * FROM episode_progress WHERE user_id = ?").all(user.id);
    console.log('\n=== EPISODE PROGRESS ===');
    console.log(progress);

    const quizzes = db.prepare("SELECT * FROM quizzes WHERE courseId = 'course_madkhal'").all();
    console.log('\n=== MADKHAL QUIZZES ===');
    console.log(quizzes);

    const quizResults = db.prepare("SELECT * FROM quiz_results WHERE userId = ?").all(user.id);
    console.log('\n=== QUIZ RESULTS ===');
    console.log(quizResults);

    // Check what the next course would be
    const courses = db.prepare("SELECT id, title, order_index, folder_id FROM courses ORDER BY order_index ASC").all();
    console.log('\n=== ALL COURSES (order) ===');
    courses.forEach(c => console.log(`  ${c.order_index}: ${c.id} - ${c.title} (folder: ${c.folder_id})`));
}

db.close();
