const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const cats = db.prepare('SELECT * FROM favorite_categories ORDER BY sort_order, name').all();
  const result = cats.map(cat => {
    const sites = db.prepare('SELECT * FROM favorites WHERE category_id = ? ORDER BY name').all(cat.id);
    return { ...cat, sites };
  });
  // Also uncategorized
  const uncategorized = db.prepare('SELECT * FROM favorites WHERE category_id IS NULL ORDER BY name').all();
  res.json({ categories: result, uncategorized });
});

router.post('/categories', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM favorite_categories').get().m;
  const r = db.prepare('INSERT INTO favorite_categories (name, sort_order) VALUES (?, ?)').run(name.trim(), maxOrder + 1);
  res.json({ id: r.lastInsertRowid, name: name.trim() });
});

router.put('/categories/:id', (req, res) => {
  getDb().prepare('UPDATE favorite_categories SET name = ? WHERE id = ?').run(req.body.name, req.params.id);
  res.json({ ok: true });
});

router.delete('/categories/:id', (req, res) => {
  getDb().prepare('DELETE FROM favorite_categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { category_id, name, url } = req.body;
  const r = db.prepare('INSERT INTO favorites (category_id, name, url) VALUES (?, ?, ?)').run(category_id || null, name, url);
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { category_id, name, url } = req.body;
  db.prepare('UPDATE favorites SET category_id = ?, name = COALESCE(?, name), url = COALESCE(?, url) WHERE id = ?').run(category_id !== undefined ? category_id : null, name || null, url || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM favorites WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
