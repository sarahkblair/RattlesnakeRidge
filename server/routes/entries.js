const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

function getEntryWithTags(db, id) {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  if (!entry) return null;
  const tags = db.prepare(`
    SELECT t.id, t.name FROM tags t
    JOIN entry_tags et ON et.tag_id = t.id
    WHERE et.entry_id = ?
  `).all(id);
  const images = db.prepare('SELECT * FROM images WHERE entry_id = ? ORDER BY created_at').all(id);
  return { ...entry, tags, images };
}

// GET all entries for a section
router.get('/', (req, res) => {
  const db = getDb();
  const { section, subsection, show_folder_id, status, sort } = req.query;

  let query = 'SELECT e.* FROM entries e WHERE 1=1';
  const params = [];

  if (section) { query += ' AND e.section = ?'; params.push(section); }
  if (subsection) { query += ' AND e.subsection = ?'; params.push(subsection); }
  if (show_folder_id) { query += ' AND e.show_folder_id = ?'; params.push(show_folder_id); }
  if (status && status !== 'all') { query += ' AND e.status = ?'; params.push(status); }

  if (section === 'vocabulary') {
    const vocabSort = sort || db.prepare("SELECT value FROM settings WHERE key = 'vocabulary_sort'").get()?.value || 'date-desc';
    if (vocabSort === 'alpha-asc') query += ' ORDER BY e.title ASC';
    else if (vocabSort === 'alpha-desc') query += ' ORDER BY e.title DESC';
    else if (vocabSort === 'date-asc') query += ' ORDER BY e.created_at ASC';
    else query += ' ORDER BY e.created_at DESC';
  } else {
    query += ' ORDER BY e.created_at DESC';
  }

  const entries = db.prepare(query).all(...params);

  const result = entries.map(entry => {
    const tags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN entry_tags et ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `).all(entry.id);
    return { ...entry, tags };
  });

  res.json(result);
});

// GET single entry
router.get('/:id', (req, res) => {
  const db = getDb();
  const entry = getEntryWithTags(db, req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Update last_opened
  db.prepare('UPDATE entries SET last_opened = ? WHERE id = ?').run(Date.now(), req.params.id);

  res.json(entry);
});

// POST create entry
router.post('/', (req, res) => {
  const db = getDb();
  const {
    section, subsection, title, body, definition, examples, how_came_across,
    author, reflection, fiction_nonfiction, link, status, show_folder_id, date_field, tags
  } = req.body;

  if (!section || !title) return res.status(400).json({ error: 'section and title required' });

  const stmt = db.prepare(`
    INSERT INTO entries (section, subsection, title, body, definition, examples, how_came_across,
      author, reflection, fiction_nonfiction, link, status, show_folder_id, date_field, last_opened)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    section, subsection || null, title, body || null, definition || null,
    examples || null, how_came_across || null, author || null, reflection || null,
    fiction_nonfiction || 'non-fiction', link || null, status || 'not-consumed',
    show_folder_id || null, date_field || null, Date.now()
  );

  const id = result.lastInsertRowid;

  if (tags && tags.length > 0) {
    syncTags(db, id, tags);
  }

  res.json(getEntryWithTags(db, id));
});

// PUT update entry
router.put('/:id', (req, res) => {
  const db = getDb();
  const {
    title, body, definition, examples, how_came_across, author, reflection,
    fiction_nonfiction, link, status, subsection, date_field, tags
  } = req.body;

  const existing = db.prepare('SELECT id FROM entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE entries SET
      title = COALESCE(?, title),
      body = ?,
      definition = ?,
      examples = ?,
      how_came_across = ?,
      author = ?,
      reflection = ?,
      fiction_nonfiction = COALESCE(?, fiction_nonfiction),
      link = ?,
      status = COALESCE(?, status),
      subsection = COALESCE(?, subsection),
      date_field = ?,
      updated_at = unixepoch()
    WHERE id = ?
  `).run(
    title || null, body !== undefined ? body : null,
    definition !== undefined ? definition : null,
    examples !== undefined ? examples : null,
    how_came_across !== undefined ? how_came_across : null,
    author !== undefined ? author : null,
    reflection !== undefined ? reflection : null,
    fiction_nonfiction || null, link !== undefined ? link : null,
    status || null, subsection || null,
    date_field !== undefined ? date_field : null,
    req.params.id
  );

  if (tags !== undefined) {
    syncTags(db, req.params.id, tags);
  }

  res.json(getEntryWithTags(db, req.params.id));
});

// PATCH toggle status
router.patch('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  db.prepare('UPDATE entries SET status = ?, updated_at = unixepoch() WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// DELETE entry
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET entries by tag
router.get('/by-tag/:tagId', (req, res) => {
  const db = getDb();
  const entries = db.prepare(`
    SELECT e.* FROM entries e
    JOIN entry_tags et ON et.entry_id = e.id
    WHERE et.tag_id = ?
    ORDER BY e.section, e.created_at DESC
  `).all(req.params.tagId);

  const result = entries.map(entry => {
    const tags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN entry_tags et ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `).all(entry.id);
    return { ...entry, tags };
  });

  res.json(result);
});

function syncTags(db, entryId, tagNames) {
  db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').run(entryId);
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(trimmed);
    if (!tag) {
      const r = db.prepare('INSERT INTO tags (name) VALUES (?)').run(trimmed);
      tag = { id: r.lastInsertRowid };
    }
    db.prepare('INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)').run(entryId, tag.id);
  }
}

// Book pairings
router.get('/:id/pairings', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const rows = db.prepare(`
    SELECT e.id as paired_id, e.title, e.author FROM entries e
    JOIN book_pairings bp ON (bp.entry_id_a = ? AND bp.entry_id_b = e.id)
      OR (bp.entry_id_b = ? AND bp.entry_id_a = e.id)
  `).all(id, id);
  res.json(rows);
});

router.put('/:id/pairings', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { pairs } = req.body; // array of paired entry IDs

  db.prepare('DELETE FROM book_pairings WHERE entry_id_a = ? OR entry_id_b = ?').run(id, id);

  for (const pairId of (pairs || [])) {
    const a = Math.min(id, pairId);
    const b = Math.max(id, pairId);
    db.prepare('INSERT OR IGNORE INTO book_pairings (entry_id_a, entry_id_b) VALUES (?, ?)').run(a, b);
  }
  res.json({ ok: true });
});

module.exports = router;
