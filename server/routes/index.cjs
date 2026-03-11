const express = require('express');
const router = express.Router();

// Import Modular Routes
const authRoutes = require('./auth.cjs');
const courseRoutes = require('./courses.cjs');
const userRoutes = require('./users.cjs');
const adminRoutes = require('./admin.cjs');
const quizRoutes = require('./quizzes.cjs');
const contentRoutes = require('./content.cjs');
const socialRoutes = require('./social.cjs');
const certificateRoutes = require('./certificates.cjs');
const r2Routes = require('./r2.cjs');
const supervisorRoutes = require('./supervisors.cjs');
const folderRoutes = require('./folders.cjs');
const ratingRoutes = require('./ratings.cjs');
const booksRoutes = require('./books.cjs');

// Middleware for authentication will be handled in server.cjs or specifically in modules
// But we can define the mount structure here

// Mount Routes
router.use('/', authRoutes); // Login, Register, etc
router.use('/courses', courseRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/quizzes', quizRoutes);
router.use('/content', contentRoutes);
router.use('/social', socialRoutes);
router.use('/certificates', certificateRoutes);
router.use('/r2', r2Routes);
router.use('/supervisors', supervisorRoutes);
router.use('/folders', folderRoutes);
router.use('/ratings', ratingRoutes);
router.use('/books', booksRoutes);

// Export the centralized router
module.exports = router;
