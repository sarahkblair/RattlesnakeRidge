const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET all show folders with episode counts
router.get('/', (req, res) => {
  const db = getDb();
  const folders = db.prepare('SELECT * FROM show_folders ORDER BY name').all();
  const result = folders.map(f => {
    const total = db.prepare("SELECT COUNT(*) as c FROM entries WHERE show_folder_id = ? AND section = 'podcasts'").get(f.id).c;
    const consumed = db.prepare("SELECT COUNT(*) as c FROM entries WHERE show_folder_id = ? AND section = 'podcasts' AND status = 'consumed'").get(f.id).c;
    return { ...f, total, consumed };
  });
  res.json(result);
});

// POST create show folder
router.post('/', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare('INSERT INTO show_folders (name) VALUES (?)').run(name.trim());
  res.json({ id: result.lastInsertRowid, name: name.trim(), total: 0, consumed: 0 });
});

// PUT rename show folder
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  db.prepare('UPDATE show_folders SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  res.json({ ok: true });
});

// DELETE show folder
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM show_folders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
