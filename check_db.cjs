const db = require('better-sqlite3')('data/db.sqlite');
const c = db.prepare("SELECT * FROM courses WHERE id='course_seerah'").get();
const eps = db.prepare("SELECT * FROM episodes WHERE courseId='course_seerah'").all();
console.log('Course lessons_count:', c.lessons_count);
console.log('Episodes count:', eps.length);
