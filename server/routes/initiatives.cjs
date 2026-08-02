const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');
const crypto = require('crypto');
const { authenticateToken, requireAdmin } = require('../middleware.cjs');

// Get all initiatives (public)
router.get('/', (req, res) => {
    try {
        const initiatives = db.prepare(`
            SELECT * FROM initiatives
            ORDER BY created_at DESC
        `).all();
        res.json(initiatives);
    } catch (error) {
        console.error('Error fetching initiatives:', error);
        res.status(500).json({ error: 'Failed to fetch initiatives' });
    }
});

// Get initiative by ID (public)
router.get('/:id', (req, res) => {
    try {
        const initiative = db.prepare(`
            SELECT * FROM initiatives
            WHERE id = ?
        `).get(req.params.id);
        
        if (!initiative) return res.status(404).json({ error: 'Initiative not found' });
        res.json(initiative);
    } catch (error) {
        console.error('Error fetching initiative:', error);
        res.status(500).json({ error: 'Failed to fetch initiative' });
    }
});

// Create initiative (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { title, description, image, link } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    const id = 'init_' + crypto.randomBytes(8).toString('hex');
    
    try {
        db.prepare(`
            INSERT INTO initiatives (id, title, description, image, link)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, title, description, image || null, link || null);
        
        const newInitiative = db.prepare('SELECT * FROM initiatives WHERE id = ?').get(id);
        res.status(201).json(newInitiative);
    } catch (error) {
        console.error('Error creating initiative:', error);
        res.status(500).json({ error: 'Failed to create initiative' });
    }
});

// Delete initiative (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM initiatives WHERE id = ?').run(req.params.id);
        res.json({ message: 'Initiative deleted successfully' });
    } catch (error) {
        console.error('Error deleting initiative:', error);
        res.status(500).json({ error: 'Failed to delete initiative' });
    }
});

module.exports = router;
