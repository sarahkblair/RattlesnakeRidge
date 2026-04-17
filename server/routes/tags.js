const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET all tags
router.get('/', (req, res) => {
  const db = getDb();
  const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
  res.json(tags);
});

// POST create tag
router.post('/', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name.trim());
    res.json({ id: result.lastInsertRowid, name: name.trim() });
  } catch (e) {
    const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name.trim());
    res.json(existing);
  }
});

// PUT rename tag
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  res.json({ ok: true });
});

// DELETE tag
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
