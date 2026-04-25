const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

// Tasks
router.get('/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM maintenance_tasks ORDER BY next_due_at').all();
  res.json(tasks);
});

router.post('/tasks', (req, res) => {
  const { name, category, frequency_days, notes } = req.body;
  const id = randomUUID();
  const next_due_at = new Date();
  next_due_at.setDate(next_due_at.getDate() + parseInt(frequency_days));
  db.prepare('INSERT INTO maintenance_tasks (id,name,category,frequency_days,notes,last_done_at,next_due_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, category||null, frequency_days, notes||null, null, next_due_at.toISOString().slice(0, 10));
  res.json(db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(id));
});

router.patch('/tasks/:id', (req, res) => {
  const { name, category, frequency_days, notes } = req.body;
  db.prepare('UPDATE maintenance_tasks SET name=COALESCE(?,name), category=COALESCE(?,category), frequency_days=COALESCE(?,frequency_days), notes=COALESCE(?,notes) WHERE id=?')
    .run(name||null, category||null, frequency_days||null, notes||null, req.params.id);
  res.json(db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(req.params.id));
});

router.delete('/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM maintenance_tasks WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Complete a task
router.post('/tasks/:id/complete', (req, res) => {
  const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  const { who, notes } = req.body;
  const now = new Date().toISOString();
  const histId = randomUUID();

  db.prepare('INSERT INTO maintenance_history (id,task_id,completed_at,who,notes) VALUES (?,?,?,?,?)')
    .run(histId, req.params.id, now, who||null, notes||null);

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + task.frequency_days);
  db.prepare('UPDATE maintenance_tasks SET last_done_at=?, next_due_at=? WHERE id=?')
    .run(now.slice(0, 10), nextDue.toISOString().slice(0, 10), req.params.id);

  res.json({
    task: db.prepare('SELECT * FROM maintenance_tasks WHERE id=?').get(req.params.id),
    history: db.prepare('SELECT * FROM maintenance_history WHERE id=?').get(histId),
  });
});

// History
router.get('/history', (req, res) => {
  const history = db.prepare(`
    SELECT mh.*, mt.name as task_name
    FROM maintenance_history mh
    JOIN maintenance_tasks mt ON mh.task_id = mt.id
    ORDER BY mh.completed_at DESC
    LIMIT 200
  `).all();
  res.json(history);
});

// Schedule (same as tasks, sorted by due date)
router.get('/schedule', (req, res) => {
  const tasks = db.prepare('SELECT * FROM maintenance_tasks ORDER BY next_due_at').all();
  res.json(tasks);
});

module.exports = router;
