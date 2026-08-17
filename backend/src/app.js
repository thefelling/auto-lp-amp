require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// ===== IMPORT ROUTES =====
const authRoutes = require('./api/auth');
const adminRoutes = require('./api/admin');
const projectRoutes = require('./api/projects');
const templateRoutes = require('./api/templates');
const systemRoutes = require('./api/system');

// ===== IMPORT MIDDLEWARE =====
const { errorHandler } = require('./middleware/error');

// ===== IMPORT DATABASE =====
const pool = require('./db');

// ===== START WORKER (BullMQ) =====
// Jalankan worker di background, tapi skip kalo di environment test
if (process.env.NODE_ENV !== 'test') {
  try {
    require('./queue/worker');
    console.log('✅ BullMQ Workers started');
  } catch (error) {
    console.log('⚠️ Queue worker not started:', error.message);
  }
}

// ===== INIT APP =====
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// LOGGING STARTUP
// ============================================
console.log('🚀 Starting Auto LP & AMP Backend...');
console.log('═══════════════════════════════════════');
console.log(`📊 DATABASE_URL   : ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set'}`);
console.log(`📊 REDIS_URL      : ${process.env.REDIS_URL ? '✅ Set' : '❌ Not Set'}`);
console.log(`🔑 OPENAI_API_KEY : ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log(`🎨 FAL_API_KEY    : ${process.env.FAL_API_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log(`☁️ CLOUDFLARE     : ${process.env.CLOUDFLARE_API_TOKEN ? '✅ Set' : '❌ Not Set'}`);
console.log(`🤖 TELEGRAM      : ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not Set'}`);
console.log(`👤 MASTER_USERNAME: ${process.env.MASTER_USERNAME ? '✅ Set' : '❌ Not Set'}`);
console.log('═══════════════════════════════════════');

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Logging
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (untuk akses gambar/assets)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// ROUTES
// ============================================

// === AUTH ===
app.use('/api/auth', authRoutes);

// === ADMIN (master only) ===
app.use('/api/admin', adminRoutes);

// === PROJECTS (AMP + LP) ===
app.use('/api/projects', projectRoutes);

// === TEMPLATES ===
app.use('/api/templates', templateRoutes);

// === SYSTEM ===
app.use('/api/system', systemRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  try {
    // Cek database
    const dbResult = await pool.query('SELECT 1');
    const dbConnected = dbResult.rows.length > 0;
    
    res.json({
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    name: 'Auto LP & AMP Generator API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      login: '/api/auth/login (POST)',
      projects: '/api/projects',
      templates: '/api/templates',
      system: '/api/system',
      admin: '/api/admin (master only)',
    },
    documentation: 'Coming soon...',
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ERROR HANDLER (harus di paling akhir)
// ============================================

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// ============================================
// EXPORT (untuk testing)
// ============================================

module.exports = app;