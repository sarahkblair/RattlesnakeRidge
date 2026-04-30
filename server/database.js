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
    -- ── Core entries ──────────────────────────────────────────────
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
      is_favorite INTEGER DEFAULT 0,
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
      entry_id INTEGER REFERENCES entries(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS book_pairings (
      entry_id_a INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      entry_id_b INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      PRIMARY KEY (entry_id_a, entry_id_b)
    );

    -- ── Daily strip ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS daily_strip (
      date TEXT PRIMARY KEY,
      vocabulary_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
      wisdom_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
      deep_dive_id INTEGER REFERENCES entries(id) ON DELETE SET NULL
    );

    -- ── Checklist bar ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS checklist_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      item_id INTEGER NOT NULL REFERENCES checklist_items(id),
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      UNIQUE(date, item_id)
    );

    -- ── Workout ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS training_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS block_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_id INTEGER NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      workout_type TEXT NOT NULL DEFAULT 'lifting',
      name TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_day_id INTEGER NOT NULL REFERENCES block_days(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      goal_sets INTEGER,
      goal_reps TEXT,
      rest_between_sets INTEGER DEFAULT 90,
      rest_after_exercise INTEGER DEFAULT 120,
      youtube_links TEXT
    );

    CREATE TABLE IF NOT EXISTS set_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      target_reps INTEGER,
      target_weight REAL
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      block_day_id INTEGER NOT NULL REFERENCES block_days(id),
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS set_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      actual_reps INTEGER,
      actual_weight REAL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Meditation ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS meditation_techniques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      benefit TEXT,
      min_minutes INTEGER,
      max_minutes INTEGER,
      pattern_json TEXT,
      is_custom INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS meditation_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technique_id INTEGER REFERENCES meditation_techniques(id),
      date TEXT NOT NULL,
      duration_minutes INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Beauty ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS beauty_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      notes TEXT,
      frequency TEXT DEFAULT 'daily',
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Style ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS wishlist_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES wishlist_categories(id) ON DELETE SET NULL,
      url TEXT,
      product_name TEXT,
      brand TEXT,
      price TEXT,
      image_url TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS shopper_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      results_json TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Cycles ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS period_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL UNIQUE,
      end_date TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS cycle_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      mood_score INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Vision board ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vision_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image_filename TEXT,
      notes_html TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS vision_card_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL REFERENCES vision_cards(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Favorites ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS favorite_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES favorite_categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── RSS & reading ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      url TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS reading_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      source TEXT,
      summary TEXT,
      content_type TEXT DEFAULT 'article',
      perspective TEXT,
      pair_id TEXT,
      saved INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS reading_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_id INTEGER NOT NULL REFERENCES reading_suggestions(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- ── Settings ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS business_subsections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  seedInitialData();
  setupFTS5();
}

function seedInitialData() {
  const checklistItems = [
    [1, '✒️', 'Morning Pages', 0],
    [2, '🌄', 'Morning Sunshine', 1],
    [3, '☀️', 'Morning Beauty', 2],
    [4, '📚', 'Read', 3],
    [5, '🧩', 'Puzzles', 4],
    [6, '🗣️', 'Speaking', 5],
    [7, '👭', 'Talk to a Friend', 6],
    [8, '💪', 'Exercise', 7],
    [9, '⛰️', 'Take a Walk', 8],
    [10, '🎨', 'Art', 9],
    [11, '🌅', 'Evening Sunshine', 10],
    [12, '🌙', 'Evening Beauty', 11],
    [13, '🕯️', 'Night Time Reflections', 12],
  ];
  for (const [id, emoji, label, order] of checklistItems) {
    db.prepare('INSERT OR IGNORE INTO checklist_items (id, emoji, label, sort_order) VALUES (?, ?, ?, ?)').run(id, emoji, label, order);
  }

  const businessSubs = [['Strategy', 0], ['Sales', 1], ['Leadership', 2], ['Negotiation', 3], ['Project Management', 4]];
  for (const [name, order] of businessSubs) {
    db.prepare('INSERT OR IGNORE INTO business_subsections (name, sort_order) VALUES (?, ?)').run(name, order);
  }

  const wishlistCats = [['Tops',0],['Bottoms',1],['Dresses',2],['Jumpsuits',3],['Sets',4],['Outerwear',5],['Lingerie',6],['Pajamas',7],['Shoes',8],['Accessories',9]];
  for (const [name, order] of wishlistCats) {
    db.prepare('INSERT OR IGNORE INTO wishlist_categories (name, sort_order) VALUES (?, ?)').run(name, order);
  }

  const starterTags = ['psychology','animals','food','memoir','philosophy','history','business','science','health','technology','language','nature'];
  for (const name of starterTags) {
    db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(name);
  }

  const defaultSettings = [
    ['vocabulary_sort', 'date-desc'],
    ['first_launch_complete', 'false'],
    ['theme', 'light'],
    ['spotify_playlist_id', ''],
    ['spotify_access_token', ''],
    ['spotify_refresh_token', ''],
    ['active_tab', 'learn'],
  ];
  for (const [key, value] of defaultSettings) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  seedMeditationTechniques();
}

function seedMeditationTechniques() {
  const techniques = [
    { name: 'Box Breathing', category: 'breathing', benefit: 'Lowers heart rate and anxiety', min_minutes: 10, max_minutes: 20, pattern_json: JSON.stringify({ inhale: 4, hold1: 4, exhale: 4, hold2: 4 }), description: 'Equal-duration breathing pattern used by Navy SEALs and athletes for stress and focus.' },
    { name: '4-7-8 Breathing', category: 'breathing', benefit: 'Promotes sleep and reduces acute stress', min_minutes: 5, max_minutes: 10, pattern_json: JSON.stringify({ inhale: 4, hold1: 7, exhale: 8, hold2: 0 }), description: 'Dr. Andrew Weil\'s relaxing breath technique. Exhale is always 2× inhale.' },
    { name: 'Wim Hof Method', category: 'breathing', benefit: 'Energizing and immune-boosting', min_minutes: 15, max_minutes: 30, pattern_json: JSON.stringify({ inhale: 2, hold1: 0, exhale: 2, hold2: 0, rounds: 30 }), description: 'Rapid rhythmic breaths followed by breath retention. Do not practice while driving or in water.' },
    { name: 'Alternate Nostril', category: 'breathing', benefit: 'Balances brain hemispheres and promotes clarity', min_minutes: 10, max_minutes: 15, pattern_json: JSON.stringify({ inhale: 4, hold1: 2, exhale: 4, hold2: 0 }), description: 'Nadi Shodhana pranayama. Alternates airflow through left and right nostrils.' },
    { name: 'Diaphragmatic Breathing', category: 'breathing', benefit: 'Reduces tension and cortisol', min_minutes: 5, max_minutes: 15, pattern_json: JSON.stringify({ inhale: 4, hold1: 0, exhale: 6, hold2: 0 }), description: 'Slow deep belly breathing that activates the parasympathetic nervous system.' },
    { name: 'Coherent Breathing', category: 'breathing', benefit: 'Optimizes heart rate variability', min_minutes: 10, max_minutes: 20, pattern_json: JSON.stringify({ inhale: 6, hold1: 0, exhale: 6, hold2: 0 }), description: '5 breaths per minute. Research shows peak HRV at this rate.' },
    { name: 'Kapalbhati', category: 'breathing', benefit: 'Energizing cleansing breath', min_minutes: 5, max_minutes: 10, pattern_json: JSON.stringify({ inhale: 1, hold1: 0, exhale: 0.5, hold2: 0 }), description: 'Forced exhales with passive inhales. Begin very gently.' },
    { name: 'Mindfulness', category: 'meditation', benefit: 'Present moment awareness and calm', min_minutes: 10, max_minutes: 20, pattern_json: null, description: 'Observe thoughts and sensations without judgment, returning attention to the breath.' },
    { name: 'Body Scan', category: 'meditation', benefit: 'Releases physical tension', min_minutes: 20, max_minutes: 45, pattern_json: null, description: 'Systematically move attention through each body part from feet to crown.' },
    { name: 'Loving Kindness', category: 'meditation', benefit: 'Cultivates compassion and connection', min_minutes: 15, max_minutes: 30, pattern_json: null, description: 'Extend feelings of warmth and goodwill to self, loved ones, neutral people, and all beings.' },
    { name: 'Visualization', category: 'meditation', benefit: 'Guided imagery for goals and anxiety', min_minutes: 10, max_minutes: 20, pattern_json: null, description: 'Engage all senses to vividly imagine desired outcomes or peaceful scenes.' },
    { name: 'Vipassana', category: 'meditation', benefit: 'Insight into the nature of sensations', min_minutes: 20, max_minutes: 60, pattern_json: null, description: 'Observe arising and passing sensations without attachment or aversion.' },
    { name: 'Yoga Nidra', category: 'meditation', benefit: 'Guided sleep-state meditation', min_minutes: 20, max_minutes: 45, pattern_json: null, description: 'Systematic rotation of consciousness through body parts in deep relaxation.' },
    { name: 'NSDR', category: 'meditation', benefit: 'Rapid restoration of focus and energy', min_minutes: 10, max_minutes: 20, pattern_json: null, description: 'Non-Sleep Deep Rest — Andrew Huberman protocol for afternoon recovery and dopamine restoration.' },
    { name: 'Anapanasati', category: 'meditation', benefit: 'Traditional breath mindfulness', min_minutes: 15, max_minutes: 30, pattern_json: null, description: 'Buddhist mindfulness of breathing. Sixteen contemplations from inhale to full release.' },
  ];

  techniques.forEach((t, i) => {
    db.prepare(`
      INSERT OR IGNORE INTO meditation_techniques (name, category, description, benefit, min_minutes, max_minutes, pattern_json, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.name, t.category, t.description, t.benefit, t.min_minutes, t.max_minutes, t.pattern_json, i);
  });
}

function setupFTS5() {
  try {
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        title, body, definition, examples, how_came_across, author, reflection,
        content='entries', content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(rowid, title, body, definition, examples, how_came_across, author, reflection)
        VALUES (new.id, new.title, new.body, new.definition, new.examples, new.how_came_across, new.author, new.reflection);
      END;

      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, title, body, definition, examples, how_came_across, author, reflection)
        VALUES ('delete', old.id, old.title, old.body, old.definition, old.examples, old.how_came_across, old.author, old.reflection);
      END;

      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, title, body, definition, examples, how_came_across, author, reflection)
        VALUES ('delete', old.id, old.title, old.body, old.definition, old.examples, old.how_came_across, old.author, old.reflection);
        INSERT INTO entries_fts(rowid, title, body, definition, examples, how_came_across, author, reflection)
        VALUES (new.id, new.title, new.body, new.definition, new.examples, new.how_came_across, new.author, new.reflection);
      END;
    `);
  } catch (e) {
    // FTS5 triggers already exist or FTS5 not supported — fall back to LIKE search
    console.warn('FTS5 setup skipped:', e.message);
  }
}

module.exports = { getDb };
