const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/techniques', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM meditation_techniques ORDER BY category, sort_order').all());
});

router.post('/techniques', (req, res) => {
  const db = getDb();
  const { name, category, description, benefit, min_minutes, max_minutes, pattern_json } = req.body;
  const r = db.prepare('INSERT INTO meditation_techniques (name, category, description, benefit, min_minutes, max_minutes, pattern_json, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, 1)').run(name, category, description, benefit, min_minutes, max_minutes, pattern_json || null);
  res.json({ id: r.lastInsertRowid });
});

router.put('/techniques/:id', (req, res) => {
  const db = getDb();
  const { name, description, benefit, min_minutes, max_minutes, pattern_json } = req.body;
  db.prepare('UPDATE meditation_techniques SET name = ?, description = ?, benefit = ?, min_minutes = ?, max_minutes = ?, pattern_json = ? WHERE id = ? AND is_custom = 1').run(name, description, benefit, min_minutes, max_minutes, pattern_json || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/techniques/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM meditation_techniques WHERE id = ? AND is_custom = 1').run(req.params.id);
  res.json({ ok: true });
});

router.post('/sessions', (req, res) => {
  const db = getDb();
  const { technique_id, duration_minutes } = req.body;
  const date = new Date().toISOString().slice(0, 10);
  const r = db.prepare('INSERT INTO meditation_sessions (technique_id, date, duration_minutes) VALUES (?, ?, ?)').run(technique_id || null, date, duration_minutes || null);
  res.json({ id: r.lastInsertRowid });
});

router.get('/sessions', (req, res) => {
  const db = getDb();
  const sessions = db.prepare('SELECT ms.*, mt.name as technique_name FROM meditation_sessions ms LEFT JOIN meditation_techniques mt ON mt.id = ms.technique_id ORDER BY ms.created_at DESC LIMIT 50').all();
  res.json(sessions);
});

module.exports = router;
