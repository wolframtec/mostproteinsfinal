/**
 * Most Proteins API Server
 * 
 * A secure, maintainable backend for payment processing and order management.
 * Built with Express.js and Stripe.
 * 
 * Security Features:
 * - Helmet for security headers
 * - CORS protection
 * - Rate limiting
 * - Input validation
 * - XSS protection
 * - Request logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initDatabase, closeDatabase } from './database/index.js';

// Import routes
import paymentRoutes from './routes/payments.js';
import orderRoutes from './routes/orders.js';
import webhookRoutes from './routes/webhooks.js';
import healthRoutes from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// DATABASE INITIALIZATION
// ============================================

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  logger.info('Created data directory', { path: dataDir });
}

// Initialize database
try {
  initDatabase();
} catch (error) {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Stripe embedding
}));

// CORS - Cross-Origin Resource Sharing
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000', 'https://mostproteins.com', 'https://*.ok.kimi.link'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // Check for wildcard origins
      const isWildcard = allowedOrigins.some(allowed => allowed.includes('*') && new RegExp(allowed.replace('*', '.*')).test(origin));
      if (isWildcard) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Stripe-Signature'],
}));

// Rate Limiting - Prevent abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down and try again later.',
    });
  },
});

// Stricter rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment attempts per hour
  message: {
    error: 'Too many payment attempts',
    message: 'For security, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting
app.use(generalLimiter);

// HTTP Parameter Pollution Protection
app.use(hpp());

// ============================================
// BODY PARSING
// ============================================

// JSON body parser (limit size to prevent attacks)
app.use(express.json({ limit: '10kb' }));

// URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// LOGGING
// ============================================

app.use(requestLogger);

// ============================================
// ROUTES
// ============================================

// Health check (no rate limit)
app.use('/api/health', healthRoutes);

// Payments (strict rate limit)
app.use('/api/payments', paymentLimiter, paymentRoutes);

// Orders
app.use('/api/orders', orderRoutes);

// Stripe Webhooks (raw body needed for signature verification)
app.use('/api/webhooks', webhookRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist.',
  });
});

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   Most Proteins API Server                               ║
║   Environment: ${NODE_ENV.padEnd(46)}║
║   Port: ${PORT.toString().padEnd(53)}║
║   Stripe Mode: ${(process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST').padEnd(45)}║
║   Database: SQLite                                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  closeDatabase();
  server.close(() => {
    logger.info('Server closed. Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  closeDatabase();
  server.close(() => {
    logger.info('Server closed. Process terminated.');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  closeDatabase();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
