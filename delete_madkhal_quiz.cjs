const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

// Delete the Madkhal quiz
const result = db.prepare("DELETE FROM quizzes WHERE id = 'quiz_madkhal_final'").run();
console.log('Deleted quiz_madkhal_final, rows affected:', result.changes);

// Also reset course progress for tester so we can test fresh
db.prepare("UPDATE enrollments SET progress = 100 WHERE user_id = 'user_tester_1772684502030' AND course_id = 'course_madkhal'").run();
console.log('Set tester course_madkhal progress to 100');

db.close();
console.log('Done.');
