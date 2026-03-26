const { db } = require('./server/database.cjs');

console.log('--- Starting Deadline Recalculation ---');

// Get all enrollments with their corresponding course's days_available
const enrollments = db.prepare(`
    SELECT e.user_id, e.course_id, e.enrolled_at, c.days_available 
    FROM enrollments e 
    JOIN courses c ON e.course_id = c.id
`).all();

const updateStmt = db.prepare('UPDATE enrollments SET deadline = ? WHERE user_id = ? AND course_id = ?');

let updatedCount = 0;

db.transaction(() => {
    for (const enr of enrollments) {
        if (!enr.days_available) {
            console.log(`Skipping course ${enr.course_id} for user ${enr.user_id} - no days_available set.`);
            continue;
        }

        // Calculate new deadline based on enrolled_at and specific course days_available
        const deadlineDate = new Date(enr.enrolled_at);
        if (isNaN(deadlineDate.getTime())) continue; // Skip if invalid date

        deadlineDate.setDate(deadlineDate.getDate() + enr.days_available);
        const newDeadline = deadlineDate.toISOString();

        updateStmt.run(newDeadline, enr.user_id, enr.course_id);
        updatedCount++;
    }
})();

console.log(`Successfully recalculated and updated deadlines for ${updatedCount} enrollments.`);
console.log('--- Finished ---');
process.exit(0);
