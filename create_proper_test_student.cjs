const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('data/db.sqlite', { verbose: console.log });

async function createStudent() {
    const email = `student_1@example.com`;
    const password = 'password123';
    const name = 'Test Student';
    const id = 'user_' + Date.now();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Inserting into data/db.sqlite...');
    try {
        const stmt = db.prepare('INSERT INTO users (id, name, email, password, role, emailVerified) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(id, name, email, hashedPassword, 'student', 1);
        console.log(`Student created successfully in correct DB!`);
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: student`);
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            console.log('User already exists. Updating password and emailVerified...');
            const updateStmt = db.prepare('UPDATE users SET password = ?, emailVerified = 1 WHERE email = ?');
            updateStmt.run(hashedPassword, email);
            console.log(`Student updated successfully!`);
            console.log(`Name: ${name}`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.error('Error creating student:', e);
        }
    }
}

createStudent();
