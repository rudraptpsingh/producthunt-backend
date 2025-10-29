const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Helper function to run queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

// Initialize database schema
async function initializeDatabase() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const schemaPath = path.join(__dirname, 'db-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✓ Database schema initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// User operations
const users = {
  async create(email, passwordHash, name) {
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    return result.rows[0];
  },
  
  async findByEmail(email) {
    const result = await query(
      'SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },
  
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
};

// Tracked hunts operations
const trackedHunts = {
  async create(userId, huntData) {
    const result = await query(
      `INSERT INTO tracked_hunts 
        (user_id, product_slug, product_name, product_url, tagline, category, initial_rank, initial_upvotes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       ON CONFLICT (user_id, product_slug) 
       DO UPDATE SET 
         last_checked_at = CURRENT_TIMESTAMP, 
         is_active = true
       RETURNING *`,
      [userId, huntData.slug, huntData.name, huntData.url, huntData.tagline, huntData.category, huntData.rank, huntData.upvotes]
    );
    return result.rows[0];
  },
  
  async getByUserId(userId) {
    const result = await query(
      `SELECT * FROM tracked_hunts 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY tracked_at DESC`,
      [userId]
    );
    return result.rows;
  },
  
  async delete(id, userId) {
    const result = await query(
      'UPDATE tracked_hunts SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

// Saved analyses operations
const savedAnalyses = {
  async create(userId, analysisData) {
    const result = await query(
      `INSERT INTO saved_analyses 
        (user_id, app_name, category, tagline, score, score_label, insights) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [userId, analysisData.appName, analysisData.category, analysisData.tagline, 
       analysisData.score, analysisData.scoreLabel, JSON.stringify(analysisData.insights)]
    );
    return result.rows[0];
  },
  
  async getByUserId(userId, limit = 10) {
    const result = await query(
      `SELECT * FROM saved_analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
};

// Hunt snapshots operations
const huntSnapshots = {
  async create(trackedHuntId, snapshotData) {
    const result = await query(
      `INSERT INTO hunt_snapshots 
        (tracked_hunt_id, rank, upvotes, comments, velocity) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [trackedHuntId, snapshotData.rank, snapshotData.upvotes, snapshotData.comments, snapshotData.velocity]
    );
    return result.rows[0];
  },
  
  async getByHuntId(trackedHuntId, days = 7) {
    const result = await query(
      `SELECT * FROM hunt_snapshots 
       WHERE tracked_hunt_id = $1 
         AND snapshot_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
       ORDER BY snapshot_at ASC`,
      [trackedHuntId]
    );
    return result.rows;
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase,
  users,
  trackedHunts,
  savedAnalyses,
  huntSnapshots
};
