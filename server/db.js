const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'rr.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  class TEXT NOT NULL,
  species TEXT NOT NULL,
  variety TEXT NOT NULL,
  plant_name TEXT NOT NULL,
  location TEXT,
  unconfirmed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plant_history (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  event TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plant_photos (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS care_plans (
  plant_id TEXT PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  weather_json TEXT,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS botanical_profiles (
  plant_id TEXT PRIMARY KEY REFERENCES plants(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS harvests (
  id TEXT PRIMARY KEY,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS wish_list (
  id TEXT PRIMARY KEY,
  class TEXT,
  species TEXT,
  variety TEXT NOT NULL,
  reason TEXT,
  priority TEXT CHECK(priority IN ('high','medium','low'))
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  type TEXT CHECK(type IN ('Baking','Cooking')),
  emoji TEXT,
  ingredients TEXT,
  method TEXT,
  notes TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_pool (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  components TEXT,
  time_estimate TEXT,
  season TEXT,
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_ratings (
  id TEXT PRIMARY KEY,
  meal_name TEXT NOT NULL,
  rating TEXT NOT NULL,
  rated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  item TEXT NOT NULL,
  recipes TEXT,
  purchased INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('active','todo','completed')),
  owner TEXT,
  category TEXT,
  start_date TEXT,
  budget REAL,
  next_action TEXT,
  hero_image TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_materials (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost REAL,
  where_buy TEXT,
  bought INTEGER DEFAULT 0,
  sort_order INTEGER
);

CREATE TABLE IF NOT EXISTS project_labor (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost REAL,
  contractor TEXT,
  paid INTEGER DEFAULT 0,
  sort_order INTEGER
);

CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_resources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT
);

CREATE TABLE IF NOT EXISTS project_images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  frequency_days INTEGER NOT NULL,
  notes TEXT,
  last_done_at TEXT,
  next_due_at TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  who TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price REAL,
  qty INTEGER DEFAULT 1,
  image_url TEXT,
  image_filename TEXT,
  notes TEXT,
  source_url TEXT,
  sort_order INTEGER,
  created_at TEXT NOT NULL
);
`);

function seed() {
  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // --- Plants ---
  const existingPlants = db.prepare('SELECT COUNT(*) as c FROM plants').get();
  if (existingPlants.c === 0) {
    const insertPlant = db.prepare(`
      INSERT INTO plants (id,class,species,variety,plant_name,location,unconfirmed,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    const insertHistory = db.prepare(`
      INSERT INTO plant_history (id,plant_id,date,event) VALUES (?,?,?,?)
    `);

    const figVarieties = [
      { variety: 'Black Madeira', unconfirmed: 0 },
      { variety: 'Violette de Bordeaux', unconfirmed: 0 },
      { variety: 'Unknown Variety', unconfirmed: 1 },
    ];

    figVarieties.forEach(({ variety, unconfirmed }) => {
      for (let i = 1; i <= 3; i++) {
        const plantId = randomUUID();
        const plantName = `${variety} #${i}`;
        insertPlant.run(plantId, 'Fig', 'Common Fig', variety, plantName, '3-gallon pot', unconfirmed, now, now);
        insertHistory.run(randomUUID(), plantId, '2025-02-01', 'Planted cutting in 1-gallon pot');
        if (!unconfirmed) {
          insertHistory.run(randomUUID(), plantId, '2026-04-01', 'Transferred to 3-gallon pot');
        }
      }
    });

    // Wish list
    const insertWish = db.prepare(`
      INSERT INTO wish_list (id,class,species,variety,reason,priority) VALUES (?,?,?,?,?,?)
    `);
    insertWish.run(randomUUID(), 'Citrus', 'Lemon', 'Meyer Lemon', 'Kitchen staple, pot-friendly for winter protection', 'high');
    insertWish.run(randomUUID(), 'Herb', 'Rosemary', 'Tuscan Blue', 'Hardy perennial, drought tolerant, thrives in West TX heat', 'high');
    insertWish.run(randomUUID(), 'Pepper', 'Chile Pepper', 'Hatch Green Chile', 'Southwest iconic variety, perfect for RR', 'medium');
  }

  // --- Recipes ---
  const existingRecipes = db.prepare('SELECT COUNT(*) as c FROM recipes').get();
  if (existingRecipes.c === 0) {
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (id,name,category,type,emoji,ingredients,method,notes,source_url,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    const recipes = [
      {
        name: 'Sourdough Bread',
        category: 'Bread', type: 'Baking', emoji: '🍞',
        ingredients: '500g bread flour\n375g water\n100g active sourdough starter\n10g salt',
        method: 'Mix flour and water, autolyse 30 min. Add starter and salt, stretch and fold every 30 min x4. Bulk ferment 4-6 hours. Shape, cold proof overnight. Bake in Dutch oven at 500°F — 20 min covered, 20 min uncovered.',
        notes: 'Adjust water to 80% hydration for West TX dry climate.',
      },
      {
        name: 'Brown Butter Skillet Cornbread',
        category: 'Bread', type: 'Baking', emoji: '🌽',
        ingredients: '1.5 cups cornmeal\n0.5 cup flour\n1 tsp baking powder\n0.5 tsp baking soda\n1 tsp salt\n2 eggs\n1.5 cups buttermilk\n6 tbsp butter',
        method: 'Brown butter in cast iron skillet. Mix dry ingredients. Whisk eggs and buttermilk. Combine, pour into hot skillet. Bake 400°F for 20-22 min until golden.',
        notes: 'Use lard instead of butter for extra flavor.',
      },
      {
        name: 'Calabrian Chili Pappardelle',
        category: 'Main', type: 'Cooking', emoji: '🍝',
        ingredients: 'Pappardelle pasta\nCalabrian chilis in oil\nDiced tomatoes\nGarlic\nAnchovy\nParmesan\nButter\nFresh basil',
        method: 'Bloom anchovies and garlic in olive oil. Add Calabrian chilis and tomatoes. Simmer 20 min. Toss with pasta, pasta water, butter. Finish with parmesan and basil.',
        notes: 'Calabrian chilis from Tutto Calabria brand.',
      },
      {
        name: 'Venison Backstrap',
        category: 'Main', type: 'Cooking', emoji: '🦌',
        ingredients: 'Venison backstrap\nFresh rosemary and thyme\nGarlic\nButter\nSalt and pepper\nOlive oil',
        method: 'Dry brine overnight with salt. Pat dry. Sear in cast iron 2-3 min per side over high heat. Baste with herb butter. Rest 10 min before slicing against grain.',
        notes: 'Do not cook past medium-rare — venison dries out fast.',
      },
      {
        name: 'Shakshuka',
        category: 'Breakfast', type: 'Cooking', emoji: '🍳',
        ingredients: '6 eggs\n2 cans crushed tomatoes\nBell peppers\nOnion\nGarlic\nCumin, paprika, cayenne\nFeta\nFresh herbs',
        method: 'Sauté onion and peppers. Add garlic and spices. Pour in tomatoes, simmer 15 min. Make wells, crack in eggs. Cover and cook until whites set but yolks runny. Top with feta and herbs.',
        notes: 'Add harissa for deeper flavor.',
      },
      {
        name: "Grandpa's Cherry Pie",
        category: 'Dessert', type: 'Baking', emoji: '🥧',
        ingredients: 'Pie crust (2 discs)\n6 cups fresh or frozen cherries\n1 cup sugar\n1/4 cup cornstarch\n1 tsp almond extract\n2 tbsp butter\nEgg wash',
        method: 'Mix cherries, sugar, cornstarch, almond extract. Fill bottom crust. Dot with butter. Top crust with lattice or vents. Egg wash. Bake 425°F 20 min, reduce to 375°F for 25-30 min.',
        notes: 'Tart cherries work best. Use almond extract generously.',
      },
    ];
    recipes.forEach(r => {
      insertRecipe.run(randomUUID(), r.name, r.category, r.type, r.emoji, r.ingredients, r.method, r.notes || null, r.source_url || null, now);
    });

    // Meal pool
    const insertMeal = db.prepare(`
      INSERT INTO meal_pool (id,name,components,time_estimate,season,added_at) VALUES (?,?,?,?,?,?)
    `);
    insertMeal.run(randomUUID(), 'Smoky Venison Chili', 'Main dish', '2.5 hours', 'Fall/Winter', now);
    insertMeal.run(randomUUID(), 'Thai Red Curry Chicken', 'Main dish', '45 min', 'Year-round', now);
    insertMeal.run(randomUUID(), 'Calabrian Chili Pappardelle', 'Main dish', '30 min', 'Year-round', now);
    insertMeal.run(randomUUID(), 'Sourdough Cornbread', 'Bread', '3 hours', 'Year-round', now);
    insertMeal.run(randomUUID(), 'Shakshuka', 'Main dish', '30 min', 'Year-round', now);
  }

  // --- Projects ---
  const existingProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get();
  if (existingProjects.c === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (id,title,status,owner,category,start_date,budget,next_action,hero_image,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    const insertMaterial = db.prepare(`
      INSERT INTO project_materials (id,project_id,name,cost,where_buy,bought,sort_order) VALUES (?,?,?,?,?,?,?)
    `);
    const insertLabor = db.prepare(`
      INSERT INTO project_labor (id,project_id,description,cost,contractor,paid,sort_order) VALUES (?,?,?,?,?,?,?)
    `);
    const insertNote = db.prepare(`
      INSERT INTO project_notes (id,project_id,date,text) VALUES (?,?,?,?)
    `);

    // Kyle's Shop
    const shopId = randomUUID();
    insertProject.run(shopId, "Kyle's Shop", 'active', 'Kyle', 'Land', '2026-03-01', 45000,
      'Get 3 concrete contractor quotes for the slab pour.', null, now);
    const shopMaterials = [
      ['Concrete slab', 8000, 'Local supplier', 0],
      ['Steel framing', 12000, 'Metal supply co.', 0],
      ['Roofing metal', 3500, 'Metal supply co.', 0],
      ['Electrical panel & wiring', 4000, 'Home Depot', 0],
      ['Garage doors (2x)', 2800, 'Online order', 1],
      ['Insulation', 1800, 'Home Depot', 0],
    ];
    shopMaterials.forEach(([name, cost, where_buy, bought], i) => {
      insertMaterial.run(randomUUID(), shopId, name, cost, where_buy, bought, i);
    });
    insertLabor.run(randomUUID(), shopId, 'Concrete slab pour', 4500, 'TBD', 0, 0);
    insertLabor.run(randomUUID(), shopId, 'Steel frame erection', 6000, 'TBD', 0, 1);
    insertLabor.run(randomUUID(), shopId, 'Electrical rough-in', 3200, 'TBD', 0, 2);
    insertNote.run(randomUUID(), shopId, '2026-03-01', 'Decided on 40x60 ft footprint. Kyle wants 14ft clearance for the truck lift.');
    insertNote.run(randomUUID(), shopId, '2026-04-01', 'Got first quote from Martinez Concrete — came in too high. Getting 2 more bids.');

    // Pottery Studio
    const potteryId = randomUUID();
    insertProject.run(potteryId, 'Pottery Studio', 'todo', 'Sarah', 'Kitchen', null, 8000,
      'Research pottery wheel options — Brent vs. Speedball vs. Shimpo.', null, now);
    const potteryMaterials = [
      ['Pottery wheel', 1200, 'Sheffield Pottery', 0],
      ['Kiln (electric)', 2800, 'Skutt Kilns', 0],
      ['Clay 50 lb x 10', 250, 'Local ceramic supplier', 0],
      ['Glazes starter set', 180, 'Sheffield Pottery', 0],
      ['Modeling & trimming tools', 120, 'Amazon', 0],
      ['Brushes set', 45, 'Amazon', 0],
      ['Kiln shelves & posts', 280, 'Skutt', 0],
      ['Apron & protective gear', 60, 'Amazon', 0],
    ];
    potteryMaterials.forEach(([name, cost, where_buy, bought], i) => {
      insertMaterial.run(randomUUID(), potteryId, name, cost, where_buy, bought, i);
    });
    insertNote.run(randomUUID(), potteryId, '2026-04-01', 'Goal: hand-throw all everyday dishes for the house over 2-3 years. Start with bowls and mugs.');

    // Wooden Spoon Carving
    const spoonId = randomUUID();
    insertProject.run(spoonId, 'Wooden Spoon Carving', 'todo', 'Sarah', 'Kitchen', null, 600,
      'Source cherry and walnut blanks from local hardwood dealer.', null, now);
    const spoonMaterials = [
      ['Wood blanks (cherry x10)', 80, 'Hardwood dealer', 0],
      ['Wood blanks (walnut x10)', 100, 'Hardwood dealer', 0],
      ['Hook knife', 45, 'BeaverCraft', 0],
      ['Straight carving knife', 40, 'BeaverCraft', 0],
      ['Spoon gouge', 55, 'Mora', 0],
      ['Leather strop + compound', 30, 'Amazon', 0],
      ['Food-safe mineral oil', 18, 'Amazon', 1],
      ['Beeswax finish', 22, 'Local', 0],
    ];
    spoonMaterials.forEach(([name, cost, where_buy, bought], i) => {
      insertMaterial.run(randomUUID(), spoonId, name, cost, where_buy, bought, i);
    });
    insertNote.run(randomUUID(), spoonId, '2026-04-01', 'Want to carve cooking spoons, serving spoons, and spatulas. Start with easier straight-grain cherry before walnut.');
  }

  // --- Maintenance Tasks ---
  const existingTasks = db.prepare('SELECT COUNT(*) as c FROM maintenance_tasks').get();
  if (existingTasks.c === 0) {
    const insertTask = db.prepare(`
      INSERT INTO maintenance_tasks (id,name,category,frequency_days,notes,last_done_at,next_due_at)
      VALUES (?,?,?,?,?,?,?)
    `);

    const tasks = [
      { name: 'Weekly cleaning', category: 'House', freq: 7 },
      { name: 'AC / HVAC filter change', category: 'Systems', freq: 30 },
      { name: 'Generator test run', category: 'Systems', freq: 30 },
      { name: "Brad's tank clean", category: 'Animals', freq: 60 },
      { name: "Cookie's feeding", category: 'Animals', freq: 60 },
      { name: 'Clean showerheads', category: 'House', freq: 90 },
      { name: 'Pest spray', category: 'House', freq: 90 },
      { name: 'Dryer vent clean', category: 'House', freq: 180 },
      { name: 'Gutter cleaning', category: 'House', freq: 180 },
      { name: 'Chimney clean', category: 'House', freq: 365 },
      { name: 'Power wash exterior', category: 'House', freq: 365 },
      { name: 'Well system check', category: 'Systems', freq: 365 },
      { name: 'Mow / brush management', category: 'Land', freq: 14 },
    ];

    tasks.forEach(({ name, category, freq }) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * freq));
      insertTask.run(randomUUID(), name, category, freq, null, null, dueDate.toISOString().slice(0, 10));
    });
  }

  // --- Shopping Items ---
  const existingShopping = db.prepare('SELECT COUNT(*) as c FROM shopping_items').get();
  if (existingShopping.c === 0) {
    const insertShop = db.prepare(`
      INSERT INTO shopping_items (id,room,name,brand,price,qty,image_url,image_filename,notes,source_url,sort_order,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    insertShop.run(randomUUID(), 'Kitchen', 'Cast Iron Dutch Oven 5.5qt', 'Staub', 349, 1, null, null, 'Matte black or dark blue', null, 0, now);
    insertShop.run(randomUUID(), 'Kitchen', 'Classic 8in Chef Knife', 'Shun', 185, 1, null, null, null, null, 1, now);
    insertShop.run(randomUUID(), 'Living Room', 'Leather Chesterfield Sofa Cognac', 'Pottery Barn', 3200, 1, null, null, 'Check dimensions — 88in wide. Measure doorway first.', null, 0, now);
    insertShop.run(randomUUID(), 'Master Bedroom', 'Linen Duvet Cover Natural', 'Parachute', 229, 1, null, null, 'King size', null, 0, now);
  }

  // Default settings
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('google_doc_url', '')").run();
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('compass_state', NULL)").run();
}

seed();

module.exports = db;
