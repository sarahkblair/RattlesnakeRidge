const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'vision');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const db = getDb();
  const cards = db.prepare('SELECT * FROM vision_cards ORDER BY sort_order, created_at').all();
  const result = cards.map(card => {
    const images = db.prepare('SELECT * FROM vision_card_images WHERE card_id = ? ORDER BY sort_order').all(card.id);
    return { ...card, images };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT * FROM vision_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  const images = db.prepare('SELECT * FROM vision_card_images WHERE card_id = ? ORDER BY sort_order').all(card.id);
  res.json({ ...card, images });
});

router.post('/', upload.single('image'), (req, res) => {
  const db = getDb();
  const { title, description } = req.body;
  const image_filename = req.file ? req.file.filename : null;
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM vision_cards').get().m;
  const r = db.prepare('INSERT INTO vision_cards (title, description, image_filename, sort_order) VALUES (?, ?, ?, ?)').run(title, description || null, image_filename, maxOrder + 1);
  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { title, description, notes_html, sort_order } = req.body;
  db.prepare('UPDATE vision_cards SET title = COALESCE(?, title), description = ?, notes_html = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?').run(title || null, description !== undefined ? description : null, notes_html !== undefined ? notes_html : null, sort_order != null ? sort_order : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT * FROM vision_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  if (card.image_filename) {
    const p = path.join(uploadsDir, card.image_filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  db.prepare('DELETE FROM vision_cards WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Gallery images per card
router.post('/:id/images', upload.single('image'), (req, res) => {
  const db = getDb();
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM vision_card_images WHERE card_id = ?').get(req.params.id).m;
  const r = db.prepare('INSERT INTO vision_card_images (card_id, filename, sort_order) VALUES (?, ?, ?)').run(req.params.id, req.file.filename, maxOrder + 1);
  res.json({ id: r.lastInsertRowid, filename: req.file.filename });
});

router.delete('/:id/images/:imgId', (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT * FROM vision_card_images WHERE id = ? AND card_id = ?').get(req.params.imgId, req.params.id);
  if (!img) return res.status(404).json({ error: 'Not found' });
  const p = path.join(uploadsDir, img.filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  db.prepare('DELETE FROM vision_card_images WHERE id = ?').run(req.params.imgId);
  res.json({ ok: true });
});

router.put('/:id/images/reorder', (req, res) => {
  const db = getDb();
  const { order } = req.body; // array of { id, sort_order }
  for (const item of order) {
    db.prepare('UPDATE vision_card_images SET sort_order = ? WHERE id = ? AND card_id = ?').run(item.sort_order, item.id, req.params.id);
  }
  res.json({ ok: true });
});

module.exports = router;
