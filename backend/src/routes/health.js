import express from 'express';
import os from 'os';
import logger from '../utils/logger.js';
import { getDatabase } from '../database/index.js';

const router = express.Router();

// Start time for uptime calculation
const startTime = Date.now();

/**
 * Check database connection
 */
const checkDatabase = () => {
  try {
    const db = getDatabase();
    // Try a simple query
    db.prepare('SELECT 1').get();
    return { status: 'connected', type: 'SQLite' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = checkDatabase();
  
  if (dbStatus.status !== 'connected') {
    return res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: dbStatus,
        timestamp: new Date().toISOString(),
      }
    });
  }

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000)
    }
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system info
 * @access  Public
 */
router.get('/detailed', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const systemMemory = {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem()
  };

  const dbStatus = checkDatabase();

  res.json({
    success: true,
    data: {
      status: dbStatus.status === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor((Date.now() - startTime) / 1000),
        formatted: formatUptime(Date.now() - startTime)
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      memory: {
        process: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        },
        system: {
          total: formatBytes(systemMemory.total),
          free: formatBytes(systemMemory.free),
          used: formatBytes(systemMemory.used),
          usagePercent: Math.round((systemMemory.used / systemMemory.total) * 100)
        }
      },
      cpu: {
        loadAverage: os.loadavg(),
        count: os.cpus().length
      },
      services: {
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        sendgrid: process.env.SENDGRID_API_KEY ? 'configured' : 'not_configured',
        database: dbStatus
      }
    }
  });
});

/**
 * @route   GET /api/health/ready
 * @desc    Kubernetes-style readiness probe
 * @access  Public
 */
router.get('/ready', (req, res) => {
  const dbStatus = checkDatabase();
  
  // Check if all required services are ready
  const checks = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    database: dbStatus.status === 'connected',
    server: true
  };

  const allReady = Object.values(checks).every(check => check === true);

  if (allReady) {
    res.json({
      success: true,
      data: {
        ready: true,
        checks
      }
    });
  } else {
    res.status(503).json({
      success: false,
      data: {
        ready: false,
        checks
      }
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Kubernetes-style liveness probe
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.json({
    success: true,
    data: {
      alive: true,
      timestamp: new Date().toISOString()
    }
  });
});

// Helper functions
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
