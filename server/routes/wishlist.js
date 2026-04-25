const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM wish_list ORDER BY class, species, variety').all());
});

router.post('/', (req, res) => {
  const { class: cls, species, variety, reason, priority } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO wish_list (id,class,species,variety,reason,priority) VALUES (?,?,?,?,?,?)')
    .run(id, cls||null, species||null, variety, reason||null, priority||null);
  res.json(db.prepare('SELECT * FROM wish_list WHERE id=?').get(id));
});

router.patch('/:id', (req, res) => {
  const { class: cls, species, variety, reason, priority } = req.body;
  db.prepare('UPDATE wish_list SET class=COALESCE(?,class), species=COALESCE(?,species), variety=COALESCE(?,variety), reason=COALESCE(?,reason), priority=COALESCE(?,priority) WHERE id=?')
    .run(cls||null, species||null, variety||null, reason||null, priority||null, req.params.id);
  res.json(db.prepare('SELECT * FROM wish_list WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM wish_list WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
