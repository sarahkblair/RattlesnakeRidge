const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Central time date string
function cstToday() {
  return new Date(Date.now() - 6 * 3600000).toISOString().slice(0, 10);
}

// GET today's checklist state + all-time stats per item
router.get('/today', (req, res) => {
  const db = getDb();
  const today = cstToday();

  // Ensure today's rows exist for all items
  const items = db.prepare('SELECT * FROM checklist_items ORDER BY sort_order').all();
  const insert = db.prepare('INSERT OR IGNORE INTO checklist_logs (date, item_id, completed) VALUES (?, ?, 0)');
  for (const item of items) insert.run(today, item.id);

  const logs = db.prepare('SELECT cl.*, ci.emoji, ci.label, ci.sort_order FROM checklist_logs cl JOIN checklist_items ci ON ci.id = cl.item_id WHERE cl.date = ? ORDER BY ci.sort_order').all(today);

  // Stats per item
  const firstDate = db.prepare("SELECT MIN(date) as d FROM checklist_logs").get().d;
  const totalDays = firstDate ? Math.max(1, Math.round((Date.now() - new Date(firstDate).getTime()) / 86400000)) : 1;

  const result = logs.map(log => {
    const completedDays = db.prepare('SELECT COUNT(DISTINCT date) as c FROM checklist_logs WHERE item_id = ? AND completed = 1').get(log.item_id).c;
    const pct = Math.round((completedDays / totalDays) * 100);

    // Streak: count consecutive days ending today (CST) where item was completed
    let streak = 0;
    const d = new Date(Date.now() - 6 * 3600000);
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().slice(0, 10);
      const row = db.prepare('SELECT completed FROM checklist_logs WHERE date = ? AND item_id = ?').get(ds, log.item_id);
      if (row && row.completed) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    return { ...log, pct, streak };
  });

  res.json({ date: today, items: result });
});

// PATCH toggle an item for today
router.patch('/:itemId/toggle', (req, res) => {
  const db = getDb();
  const today = cstToday();
  const existing = db.prepare('SELECT * FROM checklist_logs WHERE date = ? AND item_id = ?').get(today, req.params.itemId);
  const newVal = existing ? (existing.completed ? 0 : 1) : 1;
  db.prepare('INSERT OR REPLACE INTO checklist_logs (date, item_id, completed, completed_at) VALUES (?, ?, ?, ?)').run(today, req.params.itemId, newVal, newVal ? Date.now() : null);
  res.json({ completed: newVal });
});

// GET 90-day heatmap data
router.get('/heatmap', (req, res) => {
  const db = getDb();
  const days = [];
  const now = new Date(Date.now() - 6 * 3600000);
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const total = db.prepare('SELECT COUNT(*) as c FROM checklist_items').get().c;
    const done = db.prepare('SELECT COUNT(*) as c FROM checklist_logs WHERE date = ? AND completed = 1').get(ds).c;
    days.push({ date: ds, done, total, pct: total ? Math.round((done / total) * 100) : 0 });
  }
  res.json(days);
});

// GET a specific day's detail
router.get('/day/:date', (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT ci.emoji, ci.label, ci.sort_order, COALESCE(cl.completed, 0) as completed
    FROM checklist_items ci
    LEFT JOIN checklist_logs cl ON cl.item_id = ci.id AND cl.date = ?
    ORDER BY ci.sort_order
  `).all(req.params.date);
  res.json(items);
});

module.exports = router;
