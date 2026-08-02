const { db } = require('./server/database.cjs');
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t=>t.name));
