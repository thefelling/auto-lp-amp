const { Pool } = require('pg');

// Cek URL database
const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL or DATABASE_PUBLIC_URL not set!');
} else {
  console.log(`📊 Database URL: ${dbUrl.replace(/\/\/.*@/, '//*****@')}`);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

// Test connection
pool.query('SELECT NOW()')
  .then((res) => {
    console.log('✅ Database connected at:', res.rows[0].now);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;