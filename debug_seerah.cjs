const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

console.log('--- Course ---');
const course = db.prepare('SELECT * FROM courses WHERE id = ?').get('course_seerah');
console.log(course);

console.log('\n--- Episodes ---');
const episodes = db.prepare('SELECT id, courseId, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all('course_seerah');
console.log(episodes);

console.log('\n--- Quizzes ---');
const quizzes = db.prepare('SELECT id, title, afterEpisodeIndex FROM quizzes WHERE courseId = ?').all('course_seerah');
console.log(quizzes);
