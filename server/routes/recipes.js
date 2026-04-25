const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM recipes ORDER BY category, name').all());
});

router.post('/', (req, res) => {
  const { name, category, type, emoji, ingredients, method, notes, source_url } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO recipes (id,name,category,type,emoji,ingredients,method,notes,source_url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, name, category||null, type||null, emoji||null, ingredients||null, method||null, notes||null, source_url||null, now);
  res.json(db.prepare('SELECT * FROM recipes WHERE id=?').get(id));
});

router.patch('/:id', (req, res) => {
  const { name, category, type, emoji, ingredients, method, notes, source_url } = req.body;
  db.prepare('UPDATE recipes SET name=COALESCE(?,name), category=COALESCE(?,category), type=COALESCE(?,type), emoji=COALESCE(?,emoji), ingredients=COALESCE(?,ingredients), method=COALESCE(?,method), notes=COALESCE(?,notes), source_url=COALESCE(?,source_url) WHERE id=?')
    .run(name||null, category||null, type||null, emoji||null, ingredients||null, method||null, notes||null, source_url||null, req.params.id);
  res.json(db.prepare('SELECT * FROM recipes WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
