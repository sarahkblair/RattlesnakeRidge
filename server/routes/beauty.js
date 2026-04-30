const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  const db = getDb();
  const morning = db.prepare("SELECT * FROM beauty_products WHERE routine = 'morning' ORDER BY sort_order").all();
  const evening = db.prepare("SELECT * FROM beauty_products WHERE routine = 'evening' ORDER BY sort_order").all();
  res.json({ morning, evening });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { routine, name, brand, notes, frequency } = req.body;
  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order),0) as m FROM beauty_products WHERE routine = ?").get(routine).m;
  const r = db.prepare('INSERT INTO beauty_products (routine, name, brand, notes, frequency, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(routine, name, brand || null, notes || null, frequency || 'daily', maxOrder + 1);
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, brand, notes, frequency, sort_order } = req.body;
  db.prepare('UPDATE beauty_products SET name = COALESCE(?, name), brand = ?, notes = ?, frequency = COALESCE(?, frequency), sort_order = COALESCE(?, sort_order) WHERE id = ?').run(name || null, brand !== undefined ? brand : null, notes !== undefined ? notes : null, frequency || null, sort_order != null ? sort_order : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM beauty_products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
