const db = require('better-sqlite3')('data/db.sqlite');
const users = db.prepare("SELECT id, email, emailVerified, verificationCode, approved FROM users WHERE role='student' ORDER BY rowid DESC LIMIT 5").all();
users.forEach(u => console.log(u.email, '| verified:', u.emailVerified, '| code:', u.verificationCode, '| approved:', u.approved));
