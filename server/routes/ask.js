const router = require('express').Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    // Build cross-module context
    const plants = db.prepare('SELECT plant_name, location, class, species, variety FROM plants').all();
    const projects = db.prepare("SELECT title, status, next_action FROM projects WHERE status='active'").all();
    const mealPool = db.prepare('SELECT name, components FROM meal_pool').all();
    const shoppingRooms = db.prepare('SELECT room, COUNT(*) as count FROM shopping_items GROUP BY room').all();

    const context = `
## Current Garden
${plants.length > 0 ? plants.map(p => `- ${p.plant_name} (${p.class}/${p.species}) at ${p.location || 'unknown location'}`).join('\n') : 'No plants recorded yet.'}

## Active Projects
${projects.length > 0 ? projects.map(p => `- ${p.title}: Next → ${p.next_action || 'No action set'}`).join('\n') : 'No active projects.'}

## Current Meal Pool
${mealPool.length > 0 ? mealPool.map(m => `- ${m.name} (${m.components || 'unspecified'})`).join('\n') : 'Empty meal pool.'}

## Shopping List Summary
${shoppingRooms.length > 0 ? shoppingRooms.map(r => `- ${r.room}: ${r.count} item${r.count !== 1 ? 's' : ''}`).join('\n') : 'Shopping list empty.'}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: `You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. CONDITIONS: Arid, 105-115°F summer peaks, sustained high winds, alkaline soil pH 7.5-8.5, well water plus rainwater collection, mild winters with hard freezes possible below 20°F. OWNERS: Sarah (avid home cook, experienced) and Kyle (self-sufficiency focused). Be direct, specific, and warm.

Here is the current state of Rattlesnake Ridge:
${context}`,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Ask error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
