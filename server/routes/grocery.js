const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM grocery_items ORDER BY section, item').all());
});

router.post('/', (req, res) => {
  const { section, item, recipes } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO grocery_items (id,section,item,recipes,purchased) VALUES (?,?,?,?,0)')
    .run(id, section, item, recipes||null);
  res.json(db.prepare('SELECT * FROM grocery_items WHERE id=?').get(id));
});

router.patch('/:id', (req, res) => {
  const { section, item, recipes, purchased } = req.body;
  db.prepare('UPDATE grocery_items SET section=COALESCE(?,section), item=COALESCE(?,item), recipes=COALESCE(?,recipes), purchased=COALESCE(?,purchased) WHERE id=?')
    .run(section||null, item||null, recipes||null, purchased !== undefined ? (purchased ? 1 : 0) : null, req.params.id);
  res.json(db.prepare('SELECT * FROM grocery_items WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM grocery_items WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
