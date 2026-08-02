const db = require('better-sqlite3')('data/db.sqlite');
console.log('Course ID:', db.prepare("SELECT id FROM courses WHERE id = 'course_seerah'").get());
