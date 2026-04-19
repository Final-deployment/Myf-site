const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

console.log('--- بدء عملية التراجع (Undo) الفوري وإصلاح الجريمة ---');

try {
    db.exec('BEGIN TRANSACTION');

    // 1. Find the exact wrong enrollments that just happened today with 0 progress
    const wrongEnrollments = db.prepare(`
        SELECT course_id, COUNT(*) as c 
        FROM enrollments 
        WHERE enrolled_at >= datetime('now', '-90 minutes') 
        AND progress = 0 
        AND completed = 0 
        AND is_locked = 0
        GROUP BY course_id
    `).all();

    // 2. Decrement the students_count for those specific courses
    let totalDeleted = 0;
    for (const record of wrongEnrollments) {
        db.prepare('UPDATE courses SET students_count = MAX(0, students_count - ?) WHERE id = ?').run(record.c, record.course_id);
    }

    // 3. Delete those enrollments securely
    const deleteResult = db.prepare(`
        DELETE FROM enrollments 
        WHERE enrolled_at >= datetime('now', '-90 minutes')  
        AND progress = 0 
        AND completed = 0 
        AND is_locked = 0
    `).run();

    db.exec('COMMIT');
    console.log(`✅ [نجاح] تم التراجع بأمان. تم مسح ${deleteResult.changes} تسجيل خاطئ، وتم إنقاص العدادات بشكل صحيح.`);
} catch (e) {
    db.exec('ROLLBACK');
    console.error('❌ [خطأ أثناء التراجع]:', e.message);
}
