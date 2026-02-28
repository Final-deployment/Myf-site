const path = require('path');
// Adjust path to require database.cjs correctly from scripts folder
const { db, initDatabase } = require('../server/database.cjs');

console.log('--- STARTING USER RESET ---');

try {
    // 1. Delete all users
    console.log('Deleting all existing users...');
    // We disable foreign keys temporarily if we want to be super checking, but CASCADE should work with them ON.
    // However, better-sqlite3 enables foreign keys by default? let's check. 
    // db.pragma('foreign_keys = ON'); // usually good practice if we rely on cascade

    const deleteResult = db.prepare('DELETE FROM users').run();
    console.log(`Successfully deleted ${deleteResult.changes} user records (and cascaded data).`);

    // 2. Re-run initDatabase to seed the defaults defined in database.cjs
    console.log('Re-initializing database to seed default admins...');
    initDatabase();

    // 3. Verify
    const admins = db.prepare("SELECT id, name, email, role FROM users WHERE role = 'admin'").all();
    console.log('--- VERIFICATION ---');
    console.log(`Found ${admins.length} admins:`);
    console.table(admins);

    const allUsers = db.prepare("SELECT count(*) as count FROM users").get();
    console.log(`Total users in DB: ${allUsers.count}`);

} catch (error) {
    console.error('FATAL ERROR during reset:', error);
}

console.log('--- RESET COMPLETE ---');
