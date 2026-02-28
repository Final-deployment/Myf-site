const { db } = require('./server/database.cjs');

try {
    console.log('=== PRODUCTION DATABASE VERIFICATION ===\n');

    // 1. Check books table
    const booksCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
    console.log(`Books table count: ${booksCount}`);

    if (booksCount > 0) {
        const books = db.prepare('SELECT * FROM books').all();
        console.log('\nBooks in database:');
        books.forEach(b => console.log(`  - ${b.id}: "${b.title}" -> path: "${b.path}" (courseId: ${b.courseId})`));
    }

    // 2. Check library_resources table
    const libCount = db.prepare('SELECT COUNT(*) as count FROM library_resources').get().count;
    console.log(`\nLibrary resources count: ${libCount}`);

    if (libCount > 0) {
        const libs = db.prepare('SELECT id, title, url FROM library_resources').all();
        console.log('\nLibrary resources in database:');
        libs.forEach(l => console.log(`  - ${l.id}: "${l.title}" -> url: "${l.url?.substring(0, 50)}..."`));
    }

    // 3. Check courses with book joins
    console.log('\n=== COURSE-BOOK JOIN CHECK ===');
    const courseBooks = db.prepare(`
        SELECT c.id, c.title, b.path as book_path 
        FROM courses c 
        LEFT JOIN books b ON c.id = b.courseId
    `).all();

    courseBooks.forEach(cb => {
        console.log(`  - Course "${cb.title}" (${cb.id}): book_path = ${cb.book_path || 'NULL'}`);
    });

    // 4. Environment check
    console.log('\n=== ENVIRONMENT VARIABLES ===');
    console.log(`R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID ? 'SET' : 'NOT SET'}`);
    console.log(`R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
    console.log(`R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME || 'NOT SET'}`);
    console.log(`R2_PUBLIC_DOMAIN: ${process.env.R2_PUBLIC_DOMAIN || 'NOT SET'}`);

    console.log('\n=== VERIFICATION COMPLETE ===');
} catch (err) {
    console.error('VERIFICATION FAILED:', err);
}
