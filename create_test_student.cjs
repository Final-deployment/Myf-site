const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Path to database
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

async function createTestStudent() {
    const email = 'test_student_prog@example.com';
    const password = 'password123';
    const name = 'Programmatic Test Student';

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        console.log(`User ${email} already exists. Cleaning up...`);
        db.prepare('DELETE FROM enrollments WHERE user_id = ?').run(existing.id);
        db.prepare('DELETE FROM users WHERE id = ?').run(existing.id);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = 'user_test_' + Date.now();

    try {
        db.prepare(`
      INSERT INTO users (id, name, email, password, role, isVerified, status, createdAt)
      VALUES (?, ?, ?, ?, 'student', 1, 'active', CURRENT_TIMESTAMP)
    `).run(userId, name, email, hashedPassword);

        console.log(`Test student created successfully:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`User ID: ${userId}`);

        // Note: Auto-enrollment logic in database.cjs will pick this up on server restart,
        // but let's manually enroll to be 100% sure for this test.
        const foundationalCourseId = 'course_madkhal';
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 30);
        const deadline = deadlineDate.toISOString();

        db.prepare(`
      INSERT INTO enrollments (user_id, course_id, enrolled_at, deadline, progress, completed, is_locked)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0)
    `).run(userId, foundationalCourseId, deadline);

        console.log(`Manually enrolled in ${foundationalCourseId} with deadline ${deadline}.`);

    } catch (err) {
        console.error('Error creating test student:', err.message);
    } finally {
        db.close();
    }
}

createTestStudent();
