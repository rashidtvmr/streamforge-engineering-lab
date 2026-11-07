import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Dependency-free SQLite persistence for this learning project. */
export function openPlatformDatabase(file = ':memory:'): DatabaseSync {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;');
  migrate(db);
  return db;
}

export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, kind TEXT NOT NULL, message TEXT NOT NULL, video_id TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT);
    CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(user_id,created_at);
    CREATE TABLE IF NOT EXISTS recent_searches (user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, query TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id,query));
    CREATE TABLE IF NOT EXISTS studio_videos (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, media_path TEXT, media_blob BLOB, media_mime TEXT);
    CREATE TABLE IF NOT EXISTS comment_reports (id TEXT PRIMARY KEY, comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE, reporter_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, reason TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(comment_id,reporter_id));
    CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, video_id TEXT NOT NULL, author_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, parent_id TEXT REFERENCES comments(id), body TEXT NOT NULL, created_at TEXT NOT NULL, edited_at TEXT, deleted_at TEXT);
    CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id,created_at);
    CREATE TABLE IF NOT EXISTS playlists (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, name TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'private', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS playlist_items (playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE, video_id TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(playlist_id,video_id));
    CREATE TABLE IF NOT EXISTS subscriptions (user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, creator TEXT NOT NULL, PRIMARY KEY(user_id, creator));
    CREATE TABLE IF NOT EXISTS reactions (user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, video_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('like','dislike')), PRIMARY KEY(user_id, video_id));
    CREATE TABLE IF NOT EXISTS history (user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, video_id TEXT NOT NULL, progress_seconds INTEGER NOT NULL CHECK (progress_seconds BETWEEN 0 AND 36000), updated_at TEXT NOT NULL, PRIMARY KEY (user_id,video_id));
  `);
  const columns = db.prepare('PRAGMA table_info(studio_videos)').all().map((column) => String(column.name));
  if (!columns.includes('media_blob')) db.exec('ALTER TABLE studio_videos ADD COLUMN media_blob BLOB');
  if (!columns.includes('media_mime')) db.exec('ALTER TABLE studio_videos ADD COLUMN media_mime TEXT');
}
