const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET all settings
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });

  const businessSubsections = db.prepare('SELECT * FROM business_subsections ORDER BY sort_order').all();
  res.json({ settings, businessSubsections });
});

// PUT update setting
router.put('/:key', (req, res) => {
  const db = getDb();
  const { value } = req.body;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, value);
  res.json({ ok: true });
});

// POST add business subsection
router.post('/business-subsections', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM business_subsections').get().m || 0;
    const result = db.prepare('INSERT INTO business_subsections (name, sort_order) VALUES (?, ?)').run(name.trim(), maxOrder + 1);
    res.json({ id: result.lastInsertRowid, name: name.trim(), sort_order: maxOrder + 1 });
  } catch (e) {
    res.status(400).json({ error: 'Subsection already exists' });
  }
});

// DELETE business subsection
router.delete('/business-subsections/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM business_subsections WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET export all data
router.get('/export', (req, res) => {
  const db = getDb();
  const entries = db.prepare('SELECT * FROM entries').all();
  const tags = db.prepare('SELECT * FROM tags').all();
  const entryTags = db.prepare('SELECT * FROM entry_tags').all();
  const showFolders = db.prepare('SELECT * FROM show_folders').all();
  const images = db.prepare('SELECT * FROM images').all();
  const settings = db.prepare('SELECT * FROM settings').all();
  const businessSubsections = db.prepare('SELECT * FROM business_subsections').all();

  res.json({
    exportedAt: new Date().toISOString(),
    version: '1.0',
    entries, tags, entryTags, showFolders, images, settings, businessSubsections
  });
});

module.exports = router;
