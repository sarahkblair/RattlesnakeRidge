const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  const { room } = req.query;
  const query = room
    ? 'SELECT * FROM shopping_items WHERE room=? ORDER BY sort_order, created_at'
    : 'SELECT * FROM shopping_items ORDER BY room, sort_order, created_at';
  const items = room ? db.prepare(query).all(room) : db.prepare(query).all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { room, name, brand, price, qty, image_url, image_filename, notes, source_url } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM shopping_items WHERE room=?').get(room);
  db.prepare('INSERT INTO shopping_items (id,room,name,brand,price,qty,image_url,image_filename,notes,source_url,sort_order,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, room, name, brand||null, price||null, qty||1, image_url||null, image_filename||null, notes||null, source_url||null, (maxOrder.m || 0) + 1, now);
  res.json(db.prepare('SELECT * FROM shopping_items WHERE id=?').get(id));
});

router.patch('/:id', (req, res) => {
  const { room, name, brand, price, qty, image_url, image_filename, notes, source_url } = req.body;
  db.prepare('UPDATE shopping_items SET room=COALESCE(?,room), name=COALESCE(?,name), brand=COALESCE(?,brand), price=COALESCE(?,price), qty=COALESCE(?,qty), image_url=COALESCE(?,image_url), image_filename=COALESCE(?,image_filename), notes=COALESCE(?,notes), source_url=COALESCE(?,source_url) WHERE id=?')
    .run(room||null, name||null, brand||null, price||null, qty||null, image_url||null, image_filename||null, notes||null, source_url||null, req.params.id);
  res.json(db.prepare('SELECT * FROM shopping_items WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT image_filename FROM shopping_items WHERE id=?').get(req.params.id);
  if (item?.image_filename) {
    const path = require('path');
    const fs = require('fs');
    const fp = path.join(__dirname, '..', '..', 'uploads', item.image_filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  db.prepare('DELETE FROM shopping_items WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Move item to different room
router.post('/:id/move', (req, res) => {
  const { room } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM shopping_items WHERE room=?').get(room);
  db.prepare('UPDATE shopping_items SET room=?, sort_order=? WHERE id=?').run(room, (maxOrder.m || 0) + 1, req.params.id);
  res.json(db.prepare('SELECT * FROM shopping_items WHERE id=?').get(req.params.id));
});

// Reorder items in a room
router.post('/reorder', (req, res) => {
  const { room, orderedIds } = req.body;
  const update = db.prepare('UPDATE shopping_items SET sort_order=? WHERE id=? AND room=?');
  const updateMany = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, id, room));
  });
  updateMany(orderedIds);
  res.json({ ok: true });
});

// URL fetch via Claude
router.post('/fetch-url', async (req, res) => {
  const { url } = req.body;
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timed out — fill in the details below', timeout: true });
    }
  }, 20000);

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: 'You are a web scraper assistant. Extract product information from URLs and return valid JSON only.',
      messages: [{
        role: 'user',
        content: `Extract product information from this URL: ${url}

Return ONLY valid JSON in this exact format:
{"name":"product name","brand":"brand name","price":0.00,"imageUrl":"image url if available"}

If any field is not available, use null. Return only the JSON object, no explanation.`,
      }],
    });

    clearTimeout(timeout);
    let text = response.content[0].text.trim();
    text = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1) throw new Error('Could not extract product info');
    const parsed = JSON.parse(text.slice(start, end + 1));
    res.json(parsed);
  } catch (err) {
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(500).json({ error: "Couldn't read this page — fill in the details below", details: err.message });
    }
  }
});

module.exports = router;
