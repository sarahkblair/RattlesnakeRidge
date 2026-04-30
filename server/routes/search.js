const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);

  let entries = [];

  // Try FTS5 first
  try {
    entries = db.prepare(`
      SELECT e.* FROM entries e
      JOIN entries_fts fts ON fts.rowid = e.id
      WHERE entries_fts MATCH ?
      ORDER BY rank
      LIMIT 200
    `).all(q.trim() + '*');
  } catch (e) {
    // Fall back to LIKE
    const term = `%${q.trim()}%`;
    entries = db.prepare(`
      SELECT DISTINCT e.* FROM entries e
      LEFT JOIN entry_tags et ON et.entry_id = e.id
      LEFT JOIN tags t ON t.id = et.tag_id
      WHERE e.title LIKE ? OR e.body LIKE ? OR e.definition LIKE ?
        OR e.author LIKE ? OR e.examples LIKE ? OR t.name LIKE ?
      ORDER BY e.section, e.created_at DESC LIMIT 200
    `).all(term, term, term, term, term, term);
  }

  const result = entries.map(entry => {
    const tags = db.prepare(`SELECT t.id, t.name FROM tags t JOIN entry_tags et ON et.tag_id = t.id WHERE et.entry_id = ?`).all(entry.id);
    return { ...entry, tags };
  });

  const grouped = {};
  for (const e of result) {
    if (!grouped[e.section]) grouped[e.section] = [];
    grouped[e.section].push(e);
  }

  res.json({ results: result, grouped });
});

module.exports = router;
