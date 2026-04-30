const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// ── Training blocks ────────────────────────────────────────────────────────

router.get('/blocks', (req, res) => {
  const db = getDb();
  const blocks = db.prepare('SELECT * FROM training_blocks ORDER BY created_at DESC').all();
  res.json(blocks);
});

router.get('/blocks/active', (req, res) => {
  const db = getDb();
  const block = db.prepare('SELECT * FROM training_blocks WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get();
  if (!block) return res.json(null);
  const days = db.prepare('SELECT * FROM block_days WHERE block_id = ? ORDER BY day_of_week').all(block.id);
  const enriched = days.map(day => {
    const exercises = db.prepare('SELECT * FROM exercises WHERE block_day_id = ? ORDER BY sort_order').all(day.id);
    const exWithSets = exercises.map(ex => {
      const plans = db.prepare('SELECT * FROM set_plans WHERE exercise_id = ? ORDER BY set_number').all(ex.id);
      return { ...ex, set_plans: plans };
    });
    return { ...day, exercises: exWithSets };
  });
  res.json({ ...block, days: enriched });
});

router.post('/blocks', (req, res) => {
  const db = getDb();
  const { name, start_date, end_date, days } = req.body;
  db.prepare('UPDATE training_blocks SET is_active = 0').run();
  const r = db.prepare('INSERT INTO training_blocks (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)').run(name, start_date, end_date || null);
  const blockId = r.lastInsertRowid;

  if (days) {
    for (const day of days) {
      const dr = db.prepare('INSERT INTO block_days (block_id, day_of_week, workout_type, name, notes) VALUES (?, ?, ?, ?, ?)').run(blockId, day.day_of_week, day.workout_type || 'lifting', day.name, day.notes || null);
      const dayId = dr.lastInsertRowid;
      if (day.exercises) {
        day.exercises.forEach((ex, i) => {
          const er = db.prepare('INSERT INTO exercises (block_day_id, name, sort_order, goal_sets, goal_reps, rest_between_sets, rest_after_exercise, youtube_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(dayId, ex.name, i, ex.goal_sets || null, ex.goal_reps || null, ex.rest_between_sets || 90, ex.rest_after_exercise || 120, ex.youtube_links || null);
          if (ex.set_plans) {
            ex.set_plans.forEach(sp => {
              db.prepare('INSERT INTO set_plans (exercise_id, set_number, target_reps, target_weight) VALUES (?, ?, ?, ?)').run(er.lastInsertRowid, sp.set_number, sp.target_reps || null, sp.target_weight || null);
            });
          }
        });
      }
    }
  }

  res.json({ id: blockId });
});

router.put('/blocks/:id', (req, res) => {
  const db = getDb();
  const { name, end_date, is_active } = req.body;
  if (is_active) db.prepare('UPDATE training_blocks SET is_active = 0').run();
  db.prepare('UPDATE training_blocks SET name = COALESCE(?, name), end_date = COALESCE(?, end_date), is_active = COALESCE(?, is_active) WHERE id = ?').run(name || null, end_date || null, is_active != null ? is_active : null, req.params.id);
  res.json({ ok: true });
});

router.delete('/blocks/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM training_blocks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Today's workout ────────────────────────────────────────────────────────

router.get('/today', (req, res) => {
  const db = getDb();
  const dow = new Date().getDay();
  const block = db.prepare('SELECT * FROM training_blocks WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get();
  if (!block) return res.json(null);

  const day = db.prepare('SELECT * FROM block_days WHERE block_id = ? AND day_of_week = ?').get(block.id, dow);
  if (!day) return res.json({ rest: true, block });

  const exercises = db.prepare('SELECT * FROM exercises WHERE block_day_id = ? ORDER BY sort_order').all(day.id);
  const exData = exercises.map(ex => {
    const plans = db.prepare('SELECT * FROM set_plans WHERE exercise_id = ? ORDER BY set_number').all(ex.id);

    // Last week's logs
    const lastLog = db.prepare(`
      SELECT wl.* FROM workout_logs wl
      WHERE wl.block_day_id = ? AND wl.date < date('now')
      ORDER BY wl.date DESC LIMIT 1
    `).get(day.id);
    const lastSets = lastLog
      ? db.prepare('SELECT * FROM set_logs WHERE workout_log_id = ? AND exercise_id = ? ORDER BY set_number').all(lastLog.id, ex.id)
      : [];

    return { ...ex, set_plans: plans, last_sets: lastSets };
  });

  res.json({ block, day, exercises: exData });
});

// ── Logging sets ───────────────────────────────────────────────────────────

router.post('/log', (req, res) => {
  const db = getDb();
  const { block_day_id, date, sets } = req.body;
  const today = date || new Date().toISOString().slice(0, 10);

  let log = db.prepare('SELECT * FROM workout_logs WHERE block_day_id = ? AND date = ?').get(block_day_id, today);
  if (!log) {
    const r = db.prepare('INSERT INTO workout_logs (date, block_day_id) VALUES (?, ?)').run(today, block_day_id);
    log = { id: r.lastInsertRowid };
  }

  if (sets) {
    for (const s of sets) {
      db.prepare('INSERT OR REPLACE INTO set_logs (workout_log_id, exercise_id, set_number, actual_reps, actual_weight) VALUES (?, ?, ?, ?, ?)').run(log.id, s.exercise_id, s.set_number, s.actual_reps, s.actual_weight);
    }
  }

  res.json({ log_id: log.id });
});

router.get('/log/today', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const logs = db.prepare('SELECT sl.* FROM set_logs sl JOIN workout_logs wl ON wl.id = sl.workout_log_id WHERE wl.date = ?').all(today);
  res.json(logs);
});

module.exports = router;
