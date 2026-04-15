/**
 * This script identifies all student enrollments where the deadline has passed
 * and actively sets their `is_locked` status to 1.
 * 
 * Fix #6: Now excludes courses where the student has already passed ALL quizzes,
 * preventing unjust locking of completed/passed courses.
 * 
 * Run with: node scripts/lock_expired_courses.cjs
 */

const { db } = require('../server/database.cjs');

console.log('--- Starting Expired Courses Locker ---');

try {
    const now = new Date().toISOString();

    // Fix #6: Only lock courses where:
    // 1. The enrollment is not completed
    // 2. The deadline has passed
    // 3. The student has NOT passed all quizzes for that course
    const info = db.prepare(`
        UPDATE enrollments 
        SET is_locked = 1 
        WHERE completed = 0 
          AND is_locked = 0 
          AND deadline IS NOT NULL 
          AND deadline < ?
          AND NOT EXISTS (
            SELECT 1 FROM (
              SELECT e2.course_id, e2.user_id,
                     (SELECT COUNT(*) FROM quizzes q WHERE q.courseId = e2.course_id) as quiz_count,
                     (SELECT COUNT(DISTINCT q2.id) FROM quiz_results qr 
                      JOIN quizzes q2 ON qr.quizId = q2.id 
                      WHERE qr.userId = e2.user_id AND q2.courseId = e2.course_id 
                      AND qr.percentage >= q2.passing_score) as passed_count
              FROM enrollments e2
              WHERE e2.user_id = enrollments.user_id AND e2.course_id = enrollments.course_id
            ) sub
            WHERE sub.quiz_count > 0 AND sub.passed_count >= sub.quiz_count
          )
    `).run(now);

    console.log(`Successfully locked ${info.changes} expired courses.`);
} catch (error) {
    console.error('Failed to update enrollments:', error);
}

console.log('--- Finished ---');
