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
// SECURITY: Rate Limiting
// ============================================================================
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 1000; // Increased to 1000 for smoother development

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean old entries
    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
        const entry = rateLimitStore.get(ip);
        if (now > entry.resetTime) {
            // Reset window
            rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        } else {
            entry.count++;
            if (entry.count > MAX_REQUESTS_PER_WINDOW) {
                console.warn(`[RATE_LIMIT] Too many requests from IP: ${ip}`);
                return res.status(429).json({
                    error: 'Too many requests. Please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((entry.resetTime - now) / 1000)
                });
            }
        }
    }
    next();
};

// Apply rate limiting to all routes
app.use(rateLimiter);

// ============================================================================
// Body Parsing Middleware
// ============================================================================
app.use(express.json({ limit: '100mb' }));
app.use(express.raw({ type: ['application/octet-stream', 'audio/webm', 'audio/ogg', 'video/webm', 'video/mp4', 'image/*'], limit: '100mb' }));

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

    // Don't expose internal error details in production
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
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
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Al-Mastaba Server v2.0 (Secured)`);
    console.log(`========================================`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Database: SQLite (WAL Mode)`);
    console.log(`  CORS: Restricted to allowed origins`);
    console.log(`  Rate Limit: ${MAX_REQUESTS_PER_WINDOW} req/min`);
    console.log(`========================================\n`);
});
