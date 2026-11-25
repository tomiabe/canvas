CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sketches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  collection TEXT NOT NULL DEFAULT 'Unsorted',
  tags TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sketches_user ON sketches(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Generative',
  config TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id, created_at DESC);
