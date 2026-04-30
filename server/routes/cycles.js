const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Period logs
router.get('/periods', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM period_logs ORDER BY start_date DESC').all());
});

router.post('/periods', (req, res) => {
  const db = getDb();
  const { start_date, end_date, notes } = req.body;
  const r = db.prepare('INSERT OR REPLACE INTO period_logs (start_date, end_date, notes) VALUES (?, ?, ?)').run(start_date, end_date || null, notes || null);
  res.json({ id: r.lastInsertRowid });
});

router.put('/periods/:id', (req, res) => {
  const db = getDb();
  const { end_date, notes } = req.body;
  db.prepare('UPDATE period_logs SET end_date = ?, notes = ? WHERE id = ?').run(end_date || null, notes || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/periods/:id', (req, res) => {
  getDb().prepare('DELETE FROM period_logs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Daily check-in
router.get('/checkins', (req, res) => {
  const { limit = 90 } = req.query;
  res.json(getDb().prepare('SELECT * FROM cycle_checkins ORDER BY date DESC LIMIT ?').all(Number(limit)));
});

router.get('/checkins/today', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb().prepare('SELECT * FROM cycle_checkins WHERE date = ?').get(today);
  res.json(row || null);
});

router.post('/checkins', (req, res) => {
  const db = getDb();
  const { date, mood_score, notes } = req.body;
  const d = date || new Date().toISOString().slice(0, 10);
  db.prepare('INSERT OR REPLACE INTO cycle_checkins (date, mood_score, notes) VALUES (?, ?, ?)').run(d, mood_score, notes || null);
  res.json({ ok: true });
});

// Cycle analysis — compute current phase from period history
router.get('/analysis', (req, res) => {
  const db = getDb();
  const periods = db.prepare('SELECT * FROM period_logs WHERE start_date IS NOT NULL ORDER BY start_date DESC LIMIT 12').all();

  if (periods.length === 0) return res.json({ phase: null, dayInCycle: null, cycleLength: 28, dataPoints: 0 });

  // Calculate average cycle length from multiple periods
  let avgCycle = 28;
  let avgPeriod = 5;
  if (periods.length >= 2) {
    const lengths = [];
    for (let i = 0; i < periods.length - 1; i++) {
      const a = new Date(periods[i].start_date);
      const b = new Date(periods[i + 1].start_date);
      const diff = Math.round((a - b) / 86400000);
      if (diff > 0 && diff < 50) lengths.push(diff);
    }
    if (lengths.length) avgCycle = Math.round(lengths.reduce((a, b) => a + b) / lengths.length);
  }
  if (periods.filter(p => p.end_date).length >= 2) {
    const durations = periods.filter(p => p.end_date).map(p => {
      return Math.round((new Date(p.end_date) - new Date(p.start_date)) / 86400000) + 1;
    });
    avgPeriod = Math.round(durations.reduce((a, b) => a + b) / durations.length);
  }

  const lastPeriodStart = new Date(periods[0].start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayInCycle = Math.round((today - lastPeriodStart) / 86400000) + 1;

  // Phase boundaries (personalized)
  const follicularLength = Math.round((avgCycle - avgPeriod - 3 - 12) / 1); // remaining after other phases
  const menstrualEnd = avgPeriod;
  const follicularEnd = menstrualEnd + Math.max(follicularLength, 5);
  const ovulatoryEnd = follicularEnd + 3;
  // luteal fills the rest

  let phase, phaseDay;
  if (dayInCycle <= menstrualEnd) { phase = 'menstrual'; phaseDay = dayInCycle; }
  else if (dayInCycle <= follicularEnd) { phase = 'follicular'; phaseDay = dayInCycle - menstrualEnd; }
  else if (dayInCycle <= ovulatoryEnd) { phase = 'ovulatory'; phaseDay = dayInCycle - follicularEnd; }
  else { phase = 'luteal'; phaseDay = dayInCycle - ovulatoryEnd; }

  // If past average cycle length, estimate a new period started
  const effectiveDay = dayInCycle > avgCycle ? ((dayInCycle - 1) % avgCycle) + 1 : dayInCycle;

  res.json({
    phase,
    phaseDay,
    dayInCycle: effectiveDay,
    cycleLength: avgCycle,
    periodLength: avgPeriod,
    dataPoints: periods.length,
    accurate: periods.length >= 3,
    phaseBoundaries: { menstrualEnd, follicularEnd, ovulatoryEnd, luteaEnd: avgCycle }
  });
});

module.exports = router;
