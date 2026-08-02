const db = require('better-sqlite3')('data/db.sqlite');
console.log(db.prepare("SELECT id, title, courseId, afterEpisodeIndex FROM quizzes WHERE courseId='course_seerah'").all());
