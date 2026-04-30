const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Wishlist categories
router.get('/categories', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM wishlist_categories ORDER BY sort_order').all());
});

// Wishlist items
router.get('/wishlist', (req, res) => {
  const db = getDb();
  const { category_id } = req.query;
  let q = 'SELECT * FROM wishlist_items';
  const params = [];
  if (category_id) { q += ' WHERE category_id = ?'; params.push(category_id); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...params));
});

router.post('/wishlist', (req, res) => {
  const db = getDb();
  const { category_id, url, product_name, brand, price, image_url, notes } = req.body;
  const r = db.prepare('INSERT INTO wishlist_items (category_id, url, product_name, brand, price, image_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(category_id || null, url || null, product_name || null, brand || null, price || null, image_url || null, notes || null);
  res.json({ id: r.lastInsertRowid });
});

router.put('/wishlist/:id', (req, res) => {
  const db = getDb();
  const { category_id, product_name, brand, price, image_url, notes } = req.body;
  db.prepare('UPDATE wishlist_items SET category_id = COALESCE(?, category_id), product_name = COALESCE(?, product_name), brand = ?, price = ?, image_url = ?, notes = ? WHERE id = ?').run(category_id || null, product_name || null, brand !== undefined ? brand : null, price !== undefined ? price : null, image_url !== undefined ? image_url : null, notes !== undefined ? notes : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/wishlist/:id', (req, res) => {
  getDb().prepare('DELETE FROM wishlist_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Shopper query history (last 10)
router.get('/shopper/history', (req, res) => {
  res.json(getDb().prepare('SELECT id, query, created_at FROM shopper_queries ORDER BY created_at DESC LIMIT 10').all());
});

router.post('/shopper/history', (req, res) => {
  const db = getDb();
  const { query, results } = req.body;
  const r = db.prepare('INSERT INTO shopper_queries (query, results_json) VALUES (?, ?)').run(query, JSON.stringify(results || []));
  // Prune old queries beyond 10
  const all = db.prepare('SELECT id FROM shopper_queries ORDER BY created_at DESC').all();
  if (all.length > 10) {
    const toDelete = all.slice(10).map(r => r.id);
    db.prepare(`DELETE FROM shopper_queries WHERE id IN (${toDelete.map(() => '?').join(',')})`).run(...toDelete);
  }
  res.json({ id: r.lastInsertRowid });
});

module.exports = router;
