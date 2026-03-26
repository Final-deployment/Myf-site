/**
 * This script identifies all student enrollments where the deadline has passed
 * and actively sets their `is_locked` status to 1.
 * 
 * Run with: node scripts/lock_expired_courses.cjs
 */

const { db } = require('../server/database.cjs');

console.log('--- Starting Expired Courses Locker ---');

try {
    const now = new Date().toISOString();

    const info = db.prepare(`
        UPDATE enrollments 
        SET is_locked = 1 
        WHERE completed = 0 
          AND is_locked = 0 
          AND deadline IS NOT NULL 
          AND deadline < ?
    `).run(now);

    console.log(`Successfully locked ${info.changes} expired courses.`);
} catch (error) {
    console.error('Failed to update enrollments:', error);
}

console.log('--- Finished ---');
