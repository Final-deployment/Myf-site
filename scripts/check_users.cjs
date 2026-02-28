const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log('Current Users:');
console.table(users);
