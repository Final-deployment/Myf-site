const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

const testerId = 'user_tester_1772684502030';

// Find all courses where the tester has quiz results but no enrollment
const coursesWithResults = db.prepare(`
    SELECT DISTINCT q.courseId 
    FROM quiz_results qr
    JOIN quizzes q ON qr.quizId = q.id
    WHERE qr.userId = ?
`).all(testerId);

console.log('Courses with quiz results:', coursesWithResults.map(r => r.courseId));

// Check which ones don't have enrollment
for (const r of coursesWithResults) {
    const enrollment = db.prepare(`SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`).get(testerId, r.courseId);
    if (!enrollment) {
        console.log(`Missing enrollment for course ${r.courseId}, creating...`);
        const now = new Date().toISOString();
        // Get the course's days_available
        const course = db.prepare(`SELECT days_available FROM courses WHERE id = ?`).get(r.courseId);
        const daysAvailable = course?.days_available || 30;
        const deadline = new Date(Date.now() + daysAvailable * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`INSERT INTO enrollments (user_id, course_id, progress, enrolled_at, deadline) VALUES (?, ?, 100, ?, ?)`)
            .run(testerId, r.courseId, now, deadline);
        console.log(`  Created enrollment for ${r.courseId} with progress=100`);
    } else {
        console.log(`Enrollment exists for ${r.courseId}, progress=${enrollment.progress}`);
        if (enrollment.progress < 100) {
            // Update to 100 since quiz was passed
            db.prepare(`UPDATE enrollments SET progress = 100 WHERE user_id = ? AND course_id = ?`).run(testerId, r.courseId);
            console.log(`  Updated progress to 100`);
        }
    }
}

// Also check Madkhal which has no quiz but should be enrolled
const madkhalEnrollment = db.prepare(`SELECT * FROM enrollments WHERE user_id = ? AND course_id = 'course_madkhal'`).get(testerId);
console.log('\nMadkhal enrollment:', madkhalEnrollment ? `exists, progress=${madkhalEnrollment.progress}` : 'MISSING');

// List all enrollments for tester
const allEnrollments = db.prepare(`SELECT course_id, progress FROM enrollments WHERE user_id = ?`).all(testerId);
console.log('\nAll tester enrollments:');
allEnrollments.forEach(e => console.log(`  ${e.course_id}: ${e.progress}%`));

db.close();
console.log('\nDone.');
