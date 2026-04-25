const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Projects CRUD
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

router.post('/', (req, res) => {
  const { title, status = 'todo', owner, category, start_date, budget, next_action } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO projects (id,title,status,owner,category,start_date,budget,next_action,hero_image,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, title, status, owner||null, category||null, start_date||null, budget||null, next_action||null, null, now);
  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(id));
});

router.patch('/:id', (req, res) => {
  const { title, status, owner, category, start_date, budget, next_action, hero_image } = req.body;
  const current = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Not found' });

  // Auto-stamp start_date when moving to active
  let effectiveStartDate = start_date !== undefined ? start_date : current.start_date;
  if (status === 'active' && !effectiveStartDate) {
    effectiveStartDate = new Date().toISOString().slice(0, 10);
  }

  db.prepare('UPDATE projects SET title=COALESCE(?,title), status=COALESCE(?,status), owner=COALESCE(?,owner), category=COALESCE(?,category), start_date=?, budget=COALESCE(?,budget), next_action=COALESCE(?,next_action), hero_image=COALESCE(?,hero_image) WHERE id=?')
    .run(title||null, status||null, owner||null, category||null, effectiveStartDate, budget||null, next_action||null, hero_image||null, req.params.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  // Cleanup images
  const images = db.prepare('SELECT filename FROM project_images WHERE project_id=?').all(req.params.id);
  images.forEach(img => {
    const fp = path.join(UPLOADS_DIR, img.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  });
  const project = db.prepare('SELECT hero_image FROM projects WHERE id=?').get(req.params.id);
  if (project?.hero_image) {
    const fp = path.join(UPLOADS_DIR, project.hero_image);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Materials
router.get('/:id/materials', (req, res) => {
  res.json(db.prepare('SELECT * FROM project_materials WHERE project_id=? ORDER BY sort_order, rowid').all(req.params.id));
});

router.post('/:id/materials', (req, res) => {
  const { name, cost, where_buy } = req.body;
  const id = randomUUID();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM project_materials WHERE project_id=?').get(req.params.id);
  db.prepare('INSERT INTO project_materials (id,project_id,name,cost,where_buy,bought,sort_order) VALUES (?,?,?,?,?,0,?)')
    .run(id, req.params.id, name, cost||null, where_buy||null, (maxOrder.m || 0) + 1);
  res.json(db.prepare('SELECT * FROM project_materials WHERE id=?').get(id));
});

router.patch('/:projectId/materials/:id', (req, res) => {
  const { name, cost, where_buy, bought } = req.body;
  db.prepare('UPDATE project_materials SET name=COALESCE(?,name), cost=COALESCE(?,cost), where_buy=COALESCE(?,where_buy), bought=COALESCE(?,bought) WHERE id=? AND project_id=?')
    .run(name||null, cost||null, where_buy||null, bought !== undefined ? (bought ? 1 : 0) : null, req.params.id, req.params.projectId);
  res.json(db.prepare('SELECT * FROM project_materials WHERE id=?').get(req.params.id));
});

router.delete('/:projectId/materials/:id', (req, res) => {
  db.prepare('DELETE FROM project_materials WHERE id=? AND project_id=?').run(req.params.id, req.params.projectId);
  res.json({ ok: true });
});

// Labor
router.get('/:id/labor', (req, res) => {
  res.json(db.prepare('SELECT * FROM project_labor WHERE project_id=? ORDER BY sort_order, rowid').all(req.params.id));
});

router.post('/:id/labor', (req, res) => {
  const { description, cost, contractor } = req.body;
  const id = randomUUID();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM project_labor WHERE project_id=?').get(req.params.id);
  db.prepare('INSERT INTO project_labor (id,project_id,description,cost,contractor,paid,sort_order) VALUES (?,?,?,?,?,0,?)')
    .run(id, req.params.id, description, cost||null, contractor||null, (maxOrder.m || 0) + 1);
  res.json(db.prepare('SELECT * FROM project_labor WHERE id=?').get(id));
});

router.patch('/:projectId/labor/:id', (req, res) => {
  const { description, cost, contractor, paid } = req.body;
  db.prepare('UPDATE project_labor SET description=COALESCE(?,description), cost=COALESCE(?,cost), contractor=COALESCE(?,contractor), paid=COALESCE(?,paid) WHERE id=? AND project_id=?')
    .run(description||null, cost||null, contractor||null, paid !== undefined ? (paid ? 1 : 0) : null, req.params.id, req.params.projectId);
  res.json(db.prepare('SELECT * FROM project_labor WHERE id=?').get(req.params.id));
});

router.delete('/:projectId/labor/:id', (req, res) => {
  db.prepare('DELETE FROM project_labor WHERE id=? AND project_id=?').run(req.params.id, req.params.projectId);
  res.json({ ok: true });
});

// Notes
router.get('/:id/notes', (req, res) => {
  res.json(db.prepare('SELECT * FROM project_notes WHERE project_id=? ORDER BY date DESC').all(req.params.id));
});

router.post('/:id/notes', (req, res) => {
  const { date, text } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO project_notes (id,project_id,date,text) VALUES (?,?,?,?)').run(id, req.params.id, date, text);
  res.json(db.prepare('SELECT * FROM project_notes WHERE id=?').get(id));
});

router.patch('/:projectId/notes/:id', (req, res) => {
  const { date, text } = req.body;
  db.prepare('UPDATE project_notes SET date=COALESCE(?,date), text=COALESCE(?,text) WHERE id=? AND project_id=?')
    .run(date||null, text||null, req.params.id, req.params.projectId);
  res.json(db.prepare('SELECT * FROM project_notes WHERE id=?').get(req.params.id));
});

router.delete('/:projectId/notes/:id', (req, res) => {
  db.prepare('DELETE FROM project_notes WHERE id=? AND project_id=?').run(req.params.id, req.params.projectId);
  res.json({ ok: true });
});

// Resources
router.get('/:id/resources', (req, res) => {
  res.json(db.prepare('SELECT * FROM project_resources WHERE project_id=?').all(req.params.id));
});

router.post('/:id/resources', (req, res) => {
  const { label, url } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO project_resources (id,project_id,label,url) VALUES (?,?,?,?)').run(id, req.params.id, label, url||null);
  res.json(db.prepare('SELECT * FROM project_resources WHERE id=?').get(id));
});

router.delete('/:projectId/resources/:id', (req, res) => {
  db.prepare('DELETE FROM project_resources WHERE id=? AND project_id=?').run(req.params.id, req.params.projectId);
  res.json({ ok: true });
});

// Project Images
router.get('/:id/images', (req, res) => {
  res.json(db.prepare('SELECT * FROM project_images WHERE project_id=?').all(req.params.id));
});

router.post('/:id/images', (req, res) => {
  const { filename } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO project_images (id,project_id,filename) VALUES (?,?,?)').run(id, req.params.id, filename);
  res.json(db.prepare('SELECT * FROM project_images WHERE id=?').get(id));
});

router.delete('/:projectId/images/:id', (req, res) => {
  const img = db.prepare('SELECT filename FROM project_images WHERE id=? AND project_id=?').get(req.params.id, req.params.projectId);
  if (img) {
    const fp = path.join(UPLOADS_DIR, img.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.prepare('DELETE FROM project_images WHERE id=?').run(req.params.id);
  }
  res.json({ ok: true });
});

module.exports = router;
