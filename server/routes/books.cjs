const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const { v4: uuidv4 } = require('uuid');
const { generateDownloadUrl } = require('../r2.cjs');
const path = require('path');
const fs = require('fs');

// GET all books
router.get('/', async (req, res) => {
    try {
        const books = db.prepare(`
            SELECT books.*, courses.title as courseTitle 
            FROM books 
            LEFT JOIN courses ON books.courseId = courses.id
            ORDER BY books.createdAt DESC
        `).all();

        // Sign URLs
        const signedBooks = await Promise.all(books.map(async (book) => {
            if (book.path) {
                try {
                    // Books are stored in the Books/ prefix in R2
                    book.url = await generateDownloadUrl(`Books/${book.path}`);
                } catch (e) {
                    console.error(`Failed to sign URL for book ${book.id}:`, e);
                }
            }
            return book;
        }));

        res.json(signedBooks);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// GET book by course ID
router.get('/course/:courseId', async (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE courseId = ?').get(req.params.courseId);
        if (!book) return res.json(null);

        // Sign URL
        if (book.path) {
            try {
                book.url = await generateDownloadUrl(`Books/${book.path}`);
            } catch (e) {
                console.error(`Failed to sign URL for book ${book.id}:`, e);
            }
        }

        res.json(book);
    } catch (error) {
        console.error('Error fetching book for course:', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// POST create book
router.post('/', (req, res) => {
    const { title, path: bookPath, courseId } = req.body;

    if (!title || !bookPath) {
        return res.status(400).json({ error: 'Title and Path are required' });
    }

    try {
        // If courseId is provided, check if a book is already assigned to this course
        if (courseId) {
            const existingBook = db.prepare('SELECT id FROM books WHERE courseId = ?').get(courseId);
            if (existingBook) {
                // Option: Update existing or deny. User req implies "link each book to its course".
                // Let's allow overwriting or just warn. For now, we'll allow multiple books?? 
                // User said "link each book to its course", usually 1-to-1 but maybe not strictly.
                // "Video player... download book". Singular implies 1-to-1.
                // Let's enforce 1-to-1 for now in UI, but DB allows many.
            }
        }

        const id = uuidv4();
        const stmt = db.prepare('INSERT INTO books (id, title, path, courseId) VALUES (?, ?, ?, ?)');
        stmt.run(id, title, bookPath, courseId || null);

        const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        res.status(201).json(newBook);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});

// PUT update book
router.put('/:id', (req, res) => {
    const { title, path: bookPath, courseId } = req.body;
    const { id } = req.params;

    try {
        const stmt = db.prepare('UPDATE books SET title = ?, path = ?, courseId = ? WHERE id = ?');
        const result = stmt.run(title, bookPath, courseId || null, id);

        if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });

        const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// DELETE book
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

module.exports = router;
