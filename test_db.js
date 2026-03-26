const db = require('better-sqlite3')('data/database.sqlite');
console.log(db.prepare("SELECT id, name, email, role FROM users WHERE role='admin' OR email='admin@example.com'").all());
