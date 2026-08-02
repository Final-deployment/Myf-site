const db = require('better-sqlite3')('data/db.sqlite');
const c = db.prepare("SELECT id FROM courses WHERE id='course_seerah'").get();
const q = db.prepare("SELECT courseId FROM quizzes WHERE courseId='course_seerah'").get();
console.log(c.id === q.courseId, c.id.length, q.courseId.length);
