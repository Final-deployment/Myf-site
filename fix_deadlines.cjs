const Database = require('better-sqlite3');
const db = new Database('/app/data/db.sqlite');

// Get all enrollments with their corresponding course's days_available
const enrollments = db.prepare(`
    SELECT e.user_id, e.course_id, e.enrolled_at, c.days_available 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
`).all();

console.log(`Found ${enrollments.length} enrollments to process.`);
let updatedCount = 0;

const updateStmt = db.prepare('UPDATE enrollments SET deadline = ?, is_locked = 0 WHERE user_id = ? AND course_id = ?');

db.transaction(() => {
    for (const enr of enrollments) {
        if (!enr.days_available) {
            console.log(`Skipping course ${enr.course_id} for user ${enr.user_id} - no days_available set.`);
            continue;
        }

        // Calculate new deadline based on enrolled_at and specific course days_available
        const enrolledDate = new Date(enr.enrolled_at);
        const deadlineDate = new Date(enrolledDate);
        deadlineDate.setDate(deadlineDate.getDate() + enr.days_available);

        updateStmt.run(deadlineDate.toISOString(), enr.user_id, enr.course_id);
        updatedCount++;
    }
})();

console.log(`Successfully updated deadlines for ${updatedCount} enrollments based on their correct course duration.`);
