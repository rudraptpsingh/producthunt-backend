-- Database schema for HuntProductHunt

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for express-session)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);

-- Tracked hunts table
CREATE TABLE IF NOT EXISTS tracked_hunts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_slug VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_url TEXT NOT NULL,
  tagline TEXT,
  category VARCHAR(255),
  initial_rank INTEGER,
  initial_upvotes INTEGER,
  tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, product_slug)
);

-- Saved analyses table
CREATE TABLE IF NOT EXISTS saved_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  tagline TEXT,
  score INTEGER,
  score_label VARCHAR(50),
  insights JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hunt snapshots for historical tracking
CREATE TABLE IF NOT EXISTS hunt_snapshots (
  id SERIAL PRIMARY KEY,
  tracked_hunt_id INTEGER NOT NULL REFERENCES tracked_hunts(id) ON DELETE CASCADE,
  rank INTEGER,
  upvotes INTEGER,
  comments INTEGER,
  velocity DECIMAL(10, 2),
  snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IDX_tracked_hunts_user_id ON tracked_hunts(user_id);
CREATE INDEX IF NOT EXISTS IDX_saved_analyses_user_id ON saved_analyses(user_id);
CREATE INDEX IF NOT EXISTS IDX_hunt_snapshots_tracked_hunt_id ON hunt_snapshots(tracked_hunt_id);
