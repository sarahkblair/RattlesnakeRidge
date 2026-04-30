const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM rss_feeds ORDER BY name').all());
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, url } = req.body;
  try {
    const r = db.prepare('INSERT INTO rss_feeds (name, url) VALUES (?, ?)').run(name || url, url);
    res.json({ id: r.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Feed already exists' });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, active } = req.body;
  db.prepare('UPDATE rss_feeds SET name = COALESCE(?, name), active = COALESCE(?, active) WHERE id = ?').run(name || null, active != null ? active : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM rss_feeds WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Fetch and parse a single RSS feed (server-side)
router.get('/fetch/:id', async (req, res) => {
  const db = getDb();
  const feed = db.prepare('SELECT * FROM rss_feeds WHERE id = ?').get(req.params.id);
  if (!feed) return res.status(404).json({ error: 'Not found' });
  try {
    const Parser = require('rss-parser');
    const parser = new Parser({ timeout: 8000 });
    const result = await parser.parseURL(feed.url);
    res.json({ title: result.title, items: result.items.slice(0, 20).map(item => ({ title: item.title, link: item.link, pubDate: item.pubDate, content: item.contentSnippet })) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch feed', detail: e.message });
  }
});

// Reading suggestions
router.get('/suggestions', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const suggestions = getDb().prepare('SELECT rs.*, GROUP_CONCAT(rr.rating) as ratings FROM reading_suggestions rs LEFT JOIN reading_ratings rr ON rr.suggestion_id = rs.id WHERE rs.date = ? GROUP BY rs.id ORDER BY rs.category').all(today);
  res.json(suggestions);
});

router.post('/suggestions', (req, res) => {
  const db = getDb();
  const { category, title, url, source, summary, content_type, perspective, pair_id } = req.body;
  const date = new Date().toISOString().slice(0, 10);
  const r = db.prepare('INSERT INTO reading_suggestions (date, category, title, url, source, summary, content_type, perspective, pair_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(date, category, title, url || null, source || null, summary || null, content_type || 'article', perspective || null, pair_id || null);
  res.json({ id: r.lastInsertRowid });
});

router.patch('/suggestions/:id/rate', (req, res) => {
  const db = getDb();
  const { rating } = req.body;
  db.prepare('INSERT OR REPLACE INTO reading_ratings (suggestion_id, rating) VALUES (?, ?)').run(req.params.id, rating);
  res.json({ ok: true });
});

router.patch('/suggestions/:id/save', (req, res) => {
  getDb().prepare('UPDATE reading_suggestions SET saved = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
