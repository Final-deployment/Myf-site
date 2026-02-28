const { db } = require('./server/database.cjs');

const students = db.prepare("SELECT email, name FROM users WHERE role = 'student' LIMIT 5").all();
console.log('Students:', JSON.stringify(students, null, 2));
process.exit(0);
