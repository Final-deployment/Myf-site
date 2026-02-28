const db = require('better-sqlite3')('data/db.sqlite');
const rows = db.prepare(`
        SELECT c.*, b.path as book_path 
        FROM courses c 
        LEFT JOIN (SELECT courseId, MIN(path) as path FROM books GROUP BY courseId) b ON c.id = b.courseId 
        ORDER BY c.order_index ASC, c.created_at DESC
`).all();
console.log("Total rows:", rows.length);
if (rows.length > 0) {
    console.log("Keys in first row:", Object.keys(rows[0]));
    console.log("Sample folder_id:", rows[0].folder_id);
}
