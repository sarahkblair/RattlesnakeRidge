const router = require('express').Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const result = {};
  rows.forEach(r => { result[r.key] = r.value; });
  res.json(result);
});

router.patch('/', (req, res) => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updateMany = db.transaction((entries) => {
    entries.forEach(([k, v]) => update.run(k, v));
  });
  updateMany(Object.entries(req.body));
  const rows = db.prepare('SELECT * FROM settings').all();
  const result = {};
  rows.forEach(r => { result[r.key] = r.value; });
  res.json(result);
});

module.exports = router;
