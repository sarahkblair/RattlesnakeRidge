const router = require('express').Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

router.post('/search', async (req, res) => {
  try {
    const { query, filters, lockedMeals = [] } = req.body;
    const settings = db.prepare('SELECT value FROM settings WHERE key=?').get('google_doc_url');
    const docUrl = settings?.value || '';

    const filterText = Object.entries(filters || {})
      .filter(([, v]) => v && v.length > 0)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    const lockedText = lockedMeals.length > 0
      ? `\nAlready selected meals (new suggestions must complement these):\n${lockedMeals.join(', ')}`
      : '';

    const vaultText = docUrl
      ? `\nThe user's recipe doc is at: ${docUrl} — check it and mark recipes fromVault:true if found there.`
      : '';

    const prompt = `Find meal suggestions for a homestead kitchen.${lockedText}

Search query: ${query || 'any'}
Filters:
${filterText || 'No specific filters'}
${vaultText}

Return a JSON object with this EXACT structure (no markdown, no explanation, just JSON):
{"groups":[{"type":"Main dish","items":[{"name":"Dish Name","desc":"One appetizing sentence","fromVault":false}]}]}

One group per component type from the filters (Main dish, Side dish, Dessert, etc.), 3-5 items per group. If no component filter selected, return one "Main dish" group. Make suggestions varied and inspiring for a West Texas homestead cook.`;

    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: 'You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. Always return valid JSON only when asked for JSON.',
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content[0].text.trim();
    // Strip markdown fences if present
    text = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    // Find first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    const parsed = JSON.parse(text.slice(start, end + 1));
    res.json(parsed);
  } catch (err) {
    console.error('Compass search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/instructions', async (req, res) => {
  try {
    const { meals, type } = req.body; // type: 'technique' | 'exact'
    const client = getClient();

    let prompt;
    if (type === 'exact') {
      prompt = `Write an exact recipe with precise measurements, temperatures, timings, and step-by-step method for: ${meals.join(', ')}.

Format clearly with ingredients list and numbered steps. Include any tips for West Texas homestead cooking.`;
    } else {
      prompt = `Write cooking guidance for ${meals.join(', ')}. Sarah is an experienced home cook who wants technique and options, not rigid recipes. Explain the approach and the why, give ingredient options and variations, sequence dishes together if applicable, include West Texas homestead tips. Warm, direct, inspiring — not a list of measurements.`;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: 'You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. Be warm, direct, and inspiring.',
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Compass instructions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
