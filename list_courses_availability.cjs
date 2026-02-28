const { db } = require('./server/database.cjs');

const courses = db.prepare('SELECT id, title, days_available, status, folder_id FROM courses').all();
console.log('Courses:', JSON.stringify(courses, null, 2));
process.exit(0);
