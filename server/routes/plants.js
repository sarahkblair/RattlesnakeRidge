const router = require('express').Router();
const db = require('../db');
const { randomUUID } = require('crypto');

// GET all plants
router.get('/', (req, res) => {
  const plants = db.prepare('SELECT * FROM plants ORDER BY class, species, variety, plant_name').all();
  res.json(plants);
});

// POST create plant
router.post('/', (req, res) => {
  const { class: cls, species, variety, plant_name, location, unconfirmed } = req.body;
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO plants (id,class,species,variety,plant_name,location,unconfirmed,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, cls, species, variety, plant_name, location || null, unconfirmed ? 1 : 0, now, now);
  res.json(db.prepare('SELECT * FROM plants WHERE id=?').get(id));
});

// PATCH update plant
router.patch('/:id', (req, res) => {
  const { class: cls, species, variety, plant_name, location, unconfirmed } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE plants SET class=COALESCE(?,class), species=COALESCE(?,species),
    variety=COALESCE(?,variety), plant_name=COALESCE(?,plant_name),
    location=?, unconfirmed=COALESCE(?,unconfirmed), updated_at=? WHERE id=?
  `).run(cls||null, species||null, variety||null, plant_name||null,
    location !== undefined ? location : db.prepare('SELECT location FROM plants WHERE id=?').get(req.params.id)?.location,
    unconfirmed !== undefined ? (unconfirmed ? 1 : 0) : null,
    now, req.params.id);
  res.json(db.prepare('SELECT * FROM plants WHERE id=?').get(req.params.id));
});

// DELETE plant
router.delete('/:id', (req, res) => {
  // Cleanup photos from filesystem
  const photos = db.prepare('SELECT filename FROM plant_photos WHERE plant_id=?').all(req.params.id);
  const path = require('path');
  const fs = require('fs');
  const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
  photos.forEach(p => {
    const fp = path.join(UPLOADS_DIR, p.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  });
  db.prepare('DELETE FROM plants WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// --- History ---
router.get('/:id/history', (req, res) => {
  const history = db.prepare('SELECT * FROM plant_history WHERE plant_id=? ORDER BY date DESC').all(req.params.id);
  res.json(history);
});

router.post('/:id/history', (req, res) => {
  const { date, event } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO plant_history (id,plant_id,date,event) VALUES (?,?,?,?)').run(id, req.params.id, date, event);
  res.json(db.prepare('SELECT * FROM plant_history WHERE id=?').get(id));
});

router.patch('/:plantId/history/:id', (req, res) => {
  const { date, event } = req.body;
  db.prepare('UPDATE plant_history SET date=COALESCE(?,date), event=COALESCE(?,event) WHERE id=? AND plant_id=?')
    .run(date||null, event||null, req.params.id, req.params.plantId);
  res.json(db.prepare('SELECT * FROM plant_history WHERE id=?').get(req.params.id));
});

router.delete('/:plantId/history/:id', (req, res) => {
  db.prepare('DELETE FROM plant_history WHERE id=? AND plant_id=?').run(req.params.id, req.params.plantId);
  res.json({ ok: true });
});

// --- Photos ---
router.get('/:id/photos', (req, res) => {
  res.json(db.prepare('SELECT * FROM plant_photos WHERE plant_id=? ORDER BY uploaded_at DESC').all(req.params.id));
});

router.post('/:id/photos', (req, res) => {
  const { filename } = req.body;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO plant_photos (id,plant_id,filename,uploaded_at) VALUES (?,?,?,?)').run(id, req.params.id, filename, now);
  res.json(db.prepare('SELECT * FROM plant_photos WHERE id=?').get(id));
});

router.delete('/:plantId/photos/:id', (req, res) => {
  const photo = db.prepare('SELECT filename FROM plant_photos WHERE id=? AND plant_id=?').get(req.params.id, req.params.plantId);
  if (photo) {
    const path = require('path');
    const fs = require('fs');
    const fp = path.join(__dirname, '..', '..', 'uploads', photo.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.prepare('DELETE FROM plant_photos WHERE id=?').run(req.params.id);
  }
  res.json({ ok: true });
});

// --- Care Plan ---
router.get('/:id/care-plan', (req, res) => {
  const plan = db.prepare('SELECT * FROM care_plans WHERE plant_id=?').get(req.params.id);
  res.json(plan || null);
});

router.post('/:id/care-plan/refresh', async (req, res) => {
  try {
    const plant = db.prepare('SELECT * FROM plants WHERE id=?').get(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    const history = db.prepare('SELECT * FROM plant_history WHERE plant_id=? ORDER BY date DESC LIMIT 10').all(req.params.id);

    // Fetch weather
    let weatherText = '';
    let weatherJson = null;
    try {
      const https = require('https');
      const weatherData = await new Promise((resolve, reject) => {
        https.get('https://api.open-meteo.com/v1/forecast?latitude=30.5&longitude=-104.0&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=America%2FChicago&forecast_days=7', (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        }).on('error', reject);
      });
      weatherJson = JSON.stringify(weatherData);
      const days = weatherData.daily.time.map((date, i) =>
        `${date}: High ${Math.round(weatherData.daily.temperature_2m_max[i])}°F, Low ${Math.round(weatherData.daily.temperature_2m_min[i])}°F, Precip ${weatherData.daily.precipitation_sum[i]}in`
      );
      weatherText = `7-day forecast:\n${days.join('\n')}`;
    } catch (e) {
      weatherText = 'Weather data unavailable.';
    }

    const historyText = history.length > 0
      ? history.map(h => `${h.date}: ${h.event}`).join('\n')
      : 'No history recorded yet.';

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Generate a detailed care plan for this plant at Rattlesnake Ridge homestead.

Plant: ${plant.plant_name} (${plant.class} / ${plant.species} / ${plant.variety})
Location: ${plant.location || 'Unknown'}
${plant.unconfirmed ? 'Note: Variety is unconfirmed.' : ''}

Recent history:
${historyText}

Current weather data:
${weatherText}

Provide: watering schedule, fertilization, pruning guidance, pest/disease watch, and any specific care notes for West Texas conditions. Be specific and actionable.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: 'You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. CONDITIONS: Arid, 105-115°F summer peaks, sustained high winds, alkaline soil pH 7.5-8.5, well water plus rainwater collection, mild winters with hard freezes possible below 20°F. Be direct, specific, with real product/timing recommendations.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO care_plans (plant_id, text, weather_json, generated_at) VALUES (?,?,?,?)').run(req.params.id, text, weatherJson, now);
    res.json({ text, weather_json: weatherJson, generated_at: now });
  } catch (err) {
    console.error('Care plan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Botanical Profile ---
router.get('/:id/botanical-profile', (req, res) => {
  const profile = db.prepare('SELECT * FROM botanical_profiles WHERE plant_id=?').get(req.params.id);
  res.json(profile || null);
});

router.post('/:id/botanical-profile/generate', async (req, res) => {
  try {
    const plant = db.prepare('SELECT * FROM plants WHERE id=?').get(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Plant not found' });

    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Generate a comprehensive botanical profile for ${plant.plant_name} (${plant.class} / ${plant.species} / ${plant.variety}).

Include: botanical taxonomy, origin and history, growing characteristics, fruit/flower/leaf description, flavor profile (if applicable), harvest timing, known cultivar characteristics, and any unique traits relevant to a West Texas homestead garden. Format clearly with sections.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: 'You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. Be direct and informative.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO botanical_profiles (plant_id, text, generated_at) VALUES (?,?,?)').run(req.params.id, text, now);
    res.json({ text, generated_at: now });
  } catch (err) {
    console.error('Botanical profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Harvests ---
router.get('/:id/harvests', (req, res) => {
  res.json(db.prepare('SELECT * FROM harvests WHERE plant_id=? ORDER BY date DESC').all(req.params.id));
});

router.post('/:id/harvests', (req, res) => {
  const { date, amount, notes } = req.body;
  const id = randomUUID();
  db.prepare('INSERT INTO harvests (id,plant_id,date,amount,notes) VALUES (?,?,?,?,?)').run(id, req.params.id, date, amount||null, notes||null);
  res.json(db.prepare('SELECT * FROM harvests WHERE id=?').get(id));
});

router.delete('/:plantId/harvests/:id', (req, res) => {
  db.prepare('DELETE FROM harvests WHERE id=? AND plant_id=?').run(req.params.id, req.params.plantId);
  res.json({ ok: true });
});

module.exports = router;
