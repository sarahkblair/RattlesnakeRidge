const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/', (req, res) => {
  const db = getDb();
  const today = todayStr();

  let strip = db.prepare('SELECT * FROM daily_strip WHERE date = ?').get(today);

  if (!strip) {
    // Pick random vocabulary
    const vocabEntries = db.prepare("SELECT id FROM entries WHERE section = 'vocabulary'").all();
    const vocabId = vocabEntries.length > 0
      ? vocabEntries[Math.floor(Math.random() * vocabEntries.length)].id
      : null;

    // Pick random wisdom
    const wisdomEntries = db.prepare("SELECT id FROM entries WHERE section = 'wisdom'").all();
    const wisdomId = wisdomEntries.length > 0
      ? wisdomEntries[Math.floor(Math.random() * wisdomEntries.length)].id
      : null;

    // Pick deep dive with oldest last_opened
    const deepDive = db.prepare(`
      SELECT id FROM entries
      WHERE section = 'deep-dives'
      ORDER BY COALESCE(last_opened, 0) ASC
      LIMIT 1
    `).get();
    const deepDiveId = deepDive ? deepDive.id : null;

    db.prepare('INSERT OR REPLACE INTO daily_strip (date, vocabulary_id, wisdom_id, deep_dive_id) VALUES (?, ?, ?, ?)').run(today, vocabId, wisdomId, deepDiveId);
    strip = { date: today, vocabulary_id: vocabId, wisdom_id: wisdomId, deep_dive_id: deepDiveId };
  }

  const vocab = strip.vocabulary_id
    ? db.prepare('SELECT id, title, definition FROM entries WHERE id = ?').get(strip.vocabulary_id)
    : null;

  const wisdom = strip.wisdom_id
    ? db.prepare('SELECT id, body, author FROM entries WHERE id = ?').get(strip.wisdom_id)
    : null;

  const deepDive = strip.deep_dive_id
    ? db.prepare('SELECT id, title, last_opened FROM entries WHERE id = ?').get(strip.deep_dive_id)
    : null;

  res.json({ vocab, wisdom, deepDive });
});

module.exports = router;
