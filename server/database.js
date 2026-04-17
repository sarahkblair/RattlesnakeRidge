const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'sarahs_brain.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      subsection TEXT,
      title TEXT NOT NULL,
      body TEXT,
      definition TEXT,
      examples TEXT,
      how_came_across TEXT,
      author TEXT,
      reflection TEXT,
      fiction_nonfiction TEXT DEFAULT 'non-fiction',
      link TEXT,
      status TEXT DEFAULT 'not-consumed',
      show_folder_id INTEGER REFERENCES show_folders(id) ON DELETE CASCADE,
      last_opened INTEGER,
      date_field TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS show_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS entry_tags (
      entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS daily_strip (
      date TEXT PRIMARY KEY,
      vocabulary_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
      wisdom_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
      deep_dive_id INTEGER REFERENCES entries(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS business_subsections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    INSERT OR IGNORE INTO business_subsections (name, sort_order) VALUES
      ('Strategy', 0),
      ('Sales', 1),
      ('Leadership', 2),
      ('Negotiation', 3),
      ('Project Management', 4);

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('vocabulary_sort', 'date-desc'),
      ('first_launch_complete', 'false'),
      ('theme', 'light');
  `);
}

module.exports = { getDb };
