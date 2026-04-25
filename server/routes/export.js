const router = require('express').Router();
const db = require('../db');

router.get('/all', (req, res) => {
  const data = {
    exportedAt: new Date().toISOString(),
    plants: db.prepare('SELECT * FROM plants').all(),
    plant_history: db.prepare('SELECT * FROM plant_history').all(),
    plant_photos: db.prepare('SELECT * FROM plant_photos').all(),
    care_plans: db.prepare('SELECT * FROM care_plans').all(),
    botanical_profiles: db.prepare('SELECT * FROM botanical_profiles').all(),
    harvests: db.prepare('SELECT * FROM harvests').all(),
    wish_list: db.prepare('SELECT * FROM wish_list').all(),
    recipes: db.prepare('SELECT * FROM recipes').all(),
    meal_pool: db.prepare('SELECT * FROM meal_pool').all(),
    meal_ratings: db.prepare('SELECT * FROM meal_ratings').all(),
    grocery_items: db.prepare('SELECT * FROM grocery_items').all(),
    projects: db.prepare('SELECT * FROM projects').all(),
    project_materials: db.prepare('SELECT * FROM project_materials').all(),
    project_labor: db.prepare('SELECT * FROM project_labor').all(),
    project_notes: db.prepare('SELECT * FROM project_notes').all(),
    project_resources: db.prepare('SELECT * FROM project_resources').all(),
    maintenance_tasks: db.prepare('SELECT * FROM maintenance_tasks').all(),
    maintenance_history: db.prepare('SELECT * FROM maintenance_history').all(),
    shopping_items: db.prepare('SELECT * FROM shopping_items').all(),
    settings: db.prepare('SELECT * FROM settings').all(),
  };
  res.setHeader('Content-Disposition', `attachment; filename="rr-export-${new Date().toISOString().slice(0,10)}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});

module.exports = router;
