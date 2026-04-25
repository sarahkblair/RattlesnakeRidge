const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM meal_pool ORDER BY added_at DESC').all());
});

router.post('/', (req, res) => {
  const { name, components, time_estimate, season } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO meal_pool (id,name,components,time_estimate,season,added_at) VALUES (?,?,?,?,?,?)').run(id, name, components||null, time_estimate||null, season||null, now);
  res.json(db.prepare('SELECT * FROM meal_pool WHERE id=?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM meal_pool WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/rate', (req, res) => {
  const meal = db.prepare('SELECT * FROM meal_pool WHERE id=?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Not found' });
  const { rating } = req.body;
  const ratingId = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO meal_ratings (id,meal_name,rating,rated_at) VALUES (?,?,?,?)').run(ratingId, meal.name, rating, now);
  db.prepare('DELETE FROM meal_pool WHERE id=?').run(req.params.id);
  res.json({ ok: true, rating: db.prepare('SELECT * FROM meal_ratings WHERE id=?').get(ratingId) });
});

module.exports = router;
