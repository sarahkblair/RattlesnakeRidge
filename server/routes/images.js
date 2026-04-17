const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_DIR, String(req.params.entryId || 'misc'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// POST upload image for entry
router.post('/:entryId', upload.single('image'), (req, res) => {
  const db = getDb();
  if (!req.file) return res.status(400).json({ error: 'No valid image file' });

  const result = db.prepare(
    'INSERT INTO images (entry_id, filename, original_name) VALUES (?, ?, ?)'
  ).run(req.params.entryId, req.file.filename, req.file.originalname);

  res.json({
    id: result.lastInsertRowid,
    entry_id: req.params.entryId,
    filename: req.file.filename,
    original_name: req.file.originalname,
    url: `/uploads/${req.params.entryId}/${req.file.filename}`
  });
});

// DELETE image
router.delete('/:entryId/:imageId', (req, res) => {
  const db = getDb();
  const image = db.prepare('SELECT * FROM images WHERE id = ? AND entry_id = ?').get(req.params.imageId, req.params.entryId);
  if (!image) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(UPLOADS_DIR, String(req.params.entryId), image.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM images WHERE id = ?').run(req.params.imageId);
  res.json({ ok: true });
});

module.exports = router;
