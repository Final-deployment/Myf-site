const db = require('better-sqlite3')('data/db.sqlite');

// 1. Delete ALL books for Madkhal (no book exists for this course)
const delMadkhal = db.prepare('DELETE FROM books WHERE courseId = ?').run('course_madkhal');
console.log('Deleted Madkhal books:', delMadkhal.changes);

// 2. For each course, keep only one book (the one with 'book_' prefix), delete duplicates
const allBooks = db.prepare('SELECT id, courseId, path FROM books ORDER BY courseId').all();
const seen = new Set();
for (const book of allBooks) {
    if (seen.has(book.courseId)) {
        // Duplicate - delete it
        db.prepare('DELETE FROM books WHERE id = ?').run(book.id);
        console.log('Deleted duplicate:', book.id, 'for course', book.courseId);
    } else {
        seen.add(book.courseId);
    }
}

// 3. Verify
const remaining = db.prepare('SELECT id, courseId, path FROM books ORDER BY courseId').all();
console.log('\nRemaining books (' + remaining.length + '):');
remaining.forEach(b => console.log(' -', b.courseId, '->', b.path));
