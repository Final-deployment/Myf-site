const db = require('better-sqlite3')('data/db.sqlite');
const courses = db.prepare('SELECT id, title FROM courses').all();
console.log("--- All Courses ---");
for (const c of courses) {
    const q = db.prepare('SELECT id, title, courseId FROM quizzes WHERE courseId = ?').all(c.id);
    console.log(`Course: ${c.title} (ID: ${c.id})`);
    console.log(`  Quizzes Count: ${q.length}`);
}
