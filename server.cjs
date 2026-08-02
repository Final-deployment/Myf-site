const result = require('dotenv').config();
if (result.error) {
    console.error('[dotenv] Error loading .env file:', result.error.message);
} else {
    const keys = Object.keys(result.parsed || {});
    console.log(`[dotenv] Successfully loaded ${keys.length} environment variables from .env`);
    if (keys.length === 0) {
        console.warn('[dotenv] WARNING: .env file found but it appears to be empty or misformatted.');
    }
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { initDatabase, db } = require('./server/database.cjs');

// Configuration
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.warn('WARNING: SECRET_KEY environment variable is not set! Authentication will fail.');
}

// Initialize Database
initDatabase();

// Start Background Services
const { startBackupScheduler } = require('./server/services/backupService.cjs');
startBackupScheduler();
require('./server/agent_bot.cjs'); // Start Telegram AI Bot

const app = express();

// ============================================================================
// SECURITY: Restricted CORS Configuration
// ============================================================================
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'https://localhost',           // Capacitor Android (androidScheme: 'https')
    'capacitor://localhost',       // Capacitor iOS
    'http://localhost',            // Capacitor fallback
    'https://mastaba.myf-online.com',
    'https://myf-online.com',
    'https://www.myf-online.com',
    'http://147.93.62.42:3001', 'http://147.93.62.42',
    'http://72.61.88.213:3001', 'http://72.61.88.213',
    'https://muslimyouth.ps', 'http://muslimyouth.ps',
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
].map(o => o?.trim()).filter(Boolean);

console.log('[Auth] Allowed Origins:', allowedOrigins);
if (allowedOrigins.length === 0) {
    console.warn('[CORS] WARNING: No origins allowed! Frontend may be blocked.');
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Normalize origin (remove trailing slash)
        const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

        const isAllowed = allowedOrigins.some(ao => {
            const normalizedAo = ao.endsWith('/') ? ao.slice(0, -1) : ao;
            return normalizedOrigin === normalizedAo;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: "${origin}" (Normalized: "${normalizedOrigin}")`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// ============================================================================
// SECURITY: Helmet & Rate Limiting
// ============================================================================
const helmet = require('helmet');
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP temporarily to avoid breaking React dev and images
    crossOriginEmbedderPolicy: false
}));

const rateLimit = require('express-rate-limit');

const globalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 1 minute)
    message: {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(globalRateLimiter);

// ============================================================================
// Body Parsing Middleware
// ============================================================================
app.use(express.json({ limit: '5mb' }));
app.use(express.raw({ type: ['application/octet-stream', 'audio/webm', 'audio/ogg', 'video/webm', 'video/mp4', 'image/*'], limit: '30mb' }));

// ============================================================================
// SECURITY: Enhanced Request Logger
// ============================================================================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    console.log(`[${timestamp}] [${ip}] ${req.method} ${req.url}`);

    // Log response time
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`[SLOW_REQUEST] ${req.method} ${req.url} took ${duration}ms`);
        }
    });

    next();
});

// ============================================================================
// Authentication Middleware (Exposed for routes)
// ============================================================================
const { authenticateToken, requireAdmin, requireAdminOrSupervisor } = require('./server/middleware.cjs');

// ============================================================================
// Health check endpoint (Public)
// ============================================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        db: db ? 'Initialised' : 'Not Initialised'
    });
});

// ============================================================================
// REMOVED: /api/fix-db endpoint was a security vulnerability
// Password resets should be done through proper admin channels
// ============================================================================

// ============================================================================
// TEMPORARY FIX ENDPOINT (Secured)
// ============================================================================
app.post('/api/admin/fix-locked-courses', authenticateToken, requireAdmin, (req, res) => {
    try {
        const result = db.prepare('UPDATE enrollments SET is_locked = 0 WHERE (progress >= 100 OR completed = 1) AND is_locked = 1').run();
        res.json({ success: true, changes: result.changes, message: 'Unlocked completed courses successfully.' });
    } catch(e) {
        console.error('[FIX_LOCKED_COURSES] Error:', e);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ============================================================================
// Centralized API Routes
// ============================================================================
const apiRoutes = require('./server/routes/index.cjs');

// Mount API Routes with global prefix
app.use('/api', (req, res, next) => {
    // Reduced logging for production (only log path, not full debug)
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
}, apiRoutes);

// ============================================================================
// Static assets
// ============================================================================
app.use(express.static(path.join(__dirname, 'dist')));

// ============================================================================
// API 404 Handler
// ============================================================================
app.use('/api', (req, res) => {
    res.status(404).json({
        error: `API endpoint ${req.method} ${req.path} not found`,
        code: 'API_NOT_FOUND'
    });
});

// ============================================================================
// SPA Fallback - MUST BE LAST
// ============================================================================
app.get(/.*/, (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Production build not found. Please run "npm run build" first.');
    }
});

// ============================================================================
// Global Error Handler
// ============================================================================
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${req.method} ${req.url}:`, err.message);

    const statusCode = err.status || 500;
    
    // Always hide internal exception messages on 500 errors
    const message = statusCode === 500
        ? 'Internal Server Error'
        : err.message;

    res.status(statusCode).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
        timestamp
    });
});

// ============================================================================
// Start Server
// ============================================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  Al-Mastaba Server v2.0 (Secured)');
    console.log('========================================');
    console.log(`  Port: ${PORT}`);
    console.log(`  Database: SQLite (WAL Mode)`);
    console.log(`  CORS: Restricted to allowed origins`);
    console.log(`  Rate Limit: 1000 req/min`);
    console.log('========================================\n');

    // ======================================================================
    // Scheduled Task: Check for inactive supervisors every 24 hours
    // ======================================================================
    const { createNotification } = require('./server/routes/notifications_internal.cjs');

    function checkInactiveSupervisors() {
        try {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const cutoff = twoDaysAgo.toISOString();

            const inactiveSupervisors = db.prepare(`
                SELECT id, name, email, last_login
                FROM users
                WHERE role = 'supervisor'
                  AND (last_login IS NULL OR last_login < ?)
            `).all(cutoff);

            if (inactiveSupervisors.length > 0) {
                const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();

                for (const sup of inactiveSupervisors) {
                    const daysSince = sup.last_login
                        ? Math.ceil((Date.now() - new Date(sup.last_login).getTime()) / (1000 * 3600 * 24))
                        : '\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641';

                    for (const admin of admins) {
                        createNotification(admin.id, 'supervisor_inactive',
                            '\u0645\u0634\u0631\u0641 \u063a\u0627\u0626\u0628',
                            `\u0627\u0644\u0645\u0634\u0631\u0641 "${sup.name}" \u0644\u0645 \u064a\u0633\u062c\u0644 \u062f\u062e\u0648\u0644\u0647 \u0645\u0646\u0630 ${daysSince} \u0623\u064a\u0627\u0645.`,
                            '/admin/supervisors'
                        );
                    }

                    createNotification(sup.id, 'inactivity_reminder',
                        '\u062a\u0630\u0643\u064a\u0631 \u0628\u0627\u0644\u062f\u062e\u0648\u0644',
                        `\u0644\u0645 \u062a\u0633\u062c\u0644 \u062f\u062e\u0648\u0644\u0643 \u0645\u0646\u0630 ${daysSince} \u0623\u064a\u0627\u0645. \u0637\u0644\u0627\u0628\u0643 \u0628\u062d\u0627\u062c\u0629 \u0644\u0645\u062a\u0627\u0628\u0639\u062a\u0643.`,
                        '/supervisor/students'
                    );
                }
                console.log(`[SUPERVISOR_CHECK] Found ${inactiveSupervisors.length} inactive supervisor(s).`);
            }
        } catch (e) {
            console.error('[SUPERVISOR_INACTIVITY_CHECK_ERROR]:', e.message);
        }
    }

    setTimeout(checkInactiveSupervisors, 60 * 1000);
    setInterval(checkInactiveSupervisors, 24 * 60 * 60 * 1000);

    // ======================================================================
    // Scheduled Task: Al-Mastaba Smart Guardian (AI Watchman)
    // ======================================================================
    const { runWatchman } = require('./server/ai_watchman.cjs');
    const cron = require('node-cron');
    
    // Run exactly at midnight every day
    cron.schedule('0 0 * * *', () => {
        runWatchman();
    });
    
    // Run once after 2 minutes of startup for testing/initial run
    setTimeout(runWatchman, 2 * 60 * 1000);
});
