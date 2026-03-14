const Database = require('better-sqlite3');
const path = require('path');

// Assuming the script is run from the root of the project
const dbPath = path.join(__dirname, 'data/db.sqlite');

try {
    const db = new Database(dbPath);
    console.log('Connected to database at:', dbPath);

    // Find locked courses where progress is 100 or completed flag is 1
    const getLocked = db.prepare('SELECT COUNT(*) as count FROM enrollments WHERE is_locked = 1 AND (progress >= 100 OR completed = 1)').get();
    
    if (getLocked.count > 0) {
        console.log(`Found ${getLocked.count} locked courses that were actually completed. Unlocking...`);
        
        // Unlock them
        const result = db.prepare('UPDATE enrollments SET is_locked = 0 WHERE is_locked = 1 AND (progress >= 100 OR completed = 1)').run();
        
        console.log(`Success! Unlocked ${result.changes} courses for students who have completed them.`);
    } else {
        console.log('No locked completed courses found in the database. Everything looks good!');
    }
    
    db.close();
} catch (error) {
    console.error('An error occurred while updating the database:', error.message);
}
