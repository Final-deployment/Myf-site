const { db } = require('./server/database.cjs');

try {
    const coursesCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const episodesCount = db.prepare('SELECT COUNT(*) as count FROM episodes').get().count;
    const booksCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
    const libraryCount = db.prepare('SELECT COUNT(*) as count FROM library_resources').get().count;

    console.log('--- PRODUCTION DB STATS ---');
    console.log(`Courses: ${coursesCount}`);
    console.log(`Episodes: ${episodesCount}`);
    console.log(`Books Table Rows: ${booksCount}`);
    console.log(`Library Resources Rows: ${libraryCount}`);

    console.log('\n--- SAMPLE BOOKS ---');
    const sampleBooks = db.prepare('SELECT * FROM books LIMIT 5').all();
    console.log(JSON.stringify(sampleBooks, null, 2));

    console.log('\n--- SAMPLE LIBRARY ---');
    const sampleLib = db.prepare('SELECT * FROM library_resources LIMIT 5').all();
    console.log(JSON.stringify(sampleLib, null, 2));

    console.log('\n--- COURSE-BOOK MAPPING CHECK ---');
    const mapping = db.prepare(`
        SELECT c.id, c.title, b.path 
        FROM courses c 
        LEFT JOIN books b ON c.id = b.courseId 
        WHERE b.path IS NOT NULL
    `).all();
    console.log(`Courses with linked books: ${mapping.length}`);
    mapping.forEach(m => console.log(`- ${m.title} -> ${m.path}`));

} catch (err) {
    console.error('VERIFICATION FAILED:', err);
}
