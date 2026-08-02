const db = require('better-sqlite3')('data/db.sqlite');
const c = db.prepare("SELECT * FROM courses WHERE id='course_seerah'").get();
const eps = db.prepare("SELECT id, title, orderIndex FROM episodes WHERE courseId='course_seerah' ORDER BY orderIndex ASC").all();
console.log('Course lessons_count:', c.lessons_count);
console.log('Episodes:');
console.table(eps);
