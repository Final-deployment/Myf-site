const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'db.sqlite'));

try {
    const courses = db.prepare('SELECT id, title, folder_id, order_index FROM courses ORDER BY folder_id ASC, order_index ASC, id ASC').all();
    
    console.log('--- تسلسل المساقات في قاعدة البيانات المحلية ---');
    console.table(courses);
} catch (err) {
    console.error(err);
}
