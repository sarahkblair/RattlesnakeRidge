const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);

  const term = `%${q.trim()}%`;

  const entries = db.prepare(`
    SELECT DISTINCT e.* FROM entries e
    LEFT JOIN entry_tags et ON et.entry_id = e.id
    LEFT JOIN tags t ON t.id = et.tag_id
    WHERE
      e.title LIKE ?
      OR e.body LIKE ?
      OR e.definition LIKE ?
      OR e.author LIKE ?
      OR e.examples LIKE ?
      OR e.how_came_across LIKE ?
      OR e.reflection LIKE ?
      OR t.name LIKE ?
    ORDER BY e.section, e.created_at DESC
  `).all(term, term, term, term, term, term, term, term);

  const result = entries.map(entry => {
    const tags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN entry_tags et ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `).all(entry.id);
    return { ...entry, tags };
  });

  // Group by section
  const grouped = {};
  for (const entry of result) {
    if (!grouped[entry.section]) grouped[entry.section] = [];
    grouped[entry.section].push(entry);
  }

  res.json({ results: result, grouped });
});

module.exports = router;
