/**
 * Books Routes Module
 * 
 * Handles book CRUD and linking to courses.
 * - GET books: Authenticated users only (students + admin)
 * - POST/PUT/DELETE books: Admin only
 * 
 * @module server/routes/books
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { v4: uuidv4 } = require('uuid');
const { generateDownloadUrl } = require('../r2.cjs');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

/** R2 storage prefix for books folder */
const BOOKS_R2_PREFIX = 'Books/';

// ============================================================================
// GET all books (Authenticated users only — S1 fix)
// ============================================================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const books = db.prepare(`
            SELECT books.*, courses.title as courseTitle 
            FROM books 
            LEFT JOIN courses ON books.courseId = courses.id
            ORDER BY books.createdAt DESC
        `).all();

        // Sign URLs for R2 files
        const signedBooks = await Promise.all(books.map(async (book) => {
            if (book.path) {
                try {
                    book.url = await generateDownloadUrl(BOOKS_R2_PREFIX + book.path);
                } catch (e) {
                    console.error(`[BOOK_URL_SIGN_ERROR] book ${book.id}:`, e.message);
                }
            }
            return book;
        }));

        res.json(signedBooks);
    } catch (e) {
        console.error('[BOOKS_GET_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل الكتب' });
    }
});

// ============================================================================
// GET book by course ID (Authenticated — L3 fix)
// ============================================================================
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE courseId = ?').get(req.params.courseId);
        if (!book) return res.json(null);

        if (book.path) {
            try {
                book.url = await generateDownloadUrl(BOOKS_R2_PREFIX + book.path);
            } catch (e) {
                console.error(`[BOOK_URL_SIGN_ERROR] book ${book.id}:`, e.message);
            }
        }

        res.json(book);
    } catch (e) {
        console.error('[BOOK_GET_BY_COURSE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحميل الكتاب' });
    }
});

// ============================================================================
// POST create book (Admin Only) — L1: enforce 1:1 course-book
// ============================================================================
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, path: bookPath, courseId } = req.body;

    if (!title || !bookPath) {
        return res.status(400).json({ error: 'العنوان ومسار الملف مطلوبان' });
    }

    try {
        // L1: Enforce 1:1 — each course can have only one book
        if (courseId) {
            const existingBook = db.prepare('SELECT id, title FROM books WHERE courseId = ?').get(courseId);
            if (existingBook) {
                return res.status(409).json({ 
                    error: `يوجد كتاب مرتبط بهذا المساق بالفعل: "${existingBook.title}". يرجى تعديله أو حذفه أولاً.` 
                });
            }
        }

        const id = uuidv4();
        db.prepare('INSERT INTO books (id, title, path, courseId) VALUES (?, ?, ?, ?)').run(id, title, bookPath, courseId || null);

        const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        console.log(`[BOOK_CREATED] Admin ${req.user.id} created book: ${id} — "${title}"`);
        res.status(201).json(newBook);
    } catch (e) {
        console.error('[BOOK_CREATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الكتاب' });
    }
});

// ============================================================================
// PUT update book (Admin Only)
// ============================================================================
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { title, path: bookPath, courseId } = req.body;
    const { id } = req.params;

    if (!title || !bookPath) {
        return res.status(400).json({ error: 'العنوان ومسار الملف مطلوبان' });
    }

    try {
        // L1: Enforce 1:1 — check if another book already uses this courseId
        if (courseId) {
            const existingBook = db.prepare('SELECT id, title FROM books WHERE courseId = ? AND id != ?').get(courseId, id);
            if (existingBook) {
                return res.status(409).json({ 
                    error: `يوجد كتاب آخر مرتبط بهذا المساق: "${existingBook.title}". يرجى فك الارتباط أولاً.` 
                });
            }
        }

        const result = db.prepare('UPDATE books SET title = ?, path = ?, courseId = ? WHERE id = ?').run(title, bookPath, courseId || null, id);

        if (result.changes === 0) return res.status(404).json({ error: 'الكتاب غير موجود' });

        const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        console.log(`[BOOK_UPDATED] Admin ${req.user.id} updated book: ${id}`);
        res.json(updatedBook);
    } catch (e) {
        console.error('[BOOK_UPDATE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث الكتاب' });
    }
});

// ============================================================================
// DELETE book (Admin Only)
// ============================================================================
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'الكتاب غير موجود' });

        console.log(`[BOOK_DELETED] Admin ${req.user.id} deleted book: ${req.params.id}`);
        res.json({ success: true });
    } catch (e) {
        console.error('[BOOK_DELETE_ERROR]:', e.message);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف الكتاب' });
    }
});

module.exports = router;
