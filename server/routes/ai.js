const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: key });
}

// Natural language media search
router.post('/media-search', async (req, res) => {
  const { query } = req.body;
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'Claude API key not configured', offline: true });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a research assistant. The user is looking for: "${query}"

Return 5-8 real, specific articles, podcasts, or videos that directly address this topic. For each, provide:
- title: exact title
- url: actual URL (real URLs only, no fabricated ones)
- source: publication/platform name
- type: article | podcast | video
- summary: 1-2 sentence description
- why: why this specifically matches the query

Format as JSON array. Only include content you are confident actually exists. If you cannot verify a URL, omit the url field rather than guess.`
      }]
    });

    let results = [];
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) results = JSON.parse(jsonMatch[0]);
    } catch (e) { results = []; }

    res.json({ results, query });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Daily reading suggestions powered by Claude + RSS
router.post('/daily-reading', async (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // Check if already generated today
  const existing = db.prepare('SELECT COUNT(*) as c FROM reading_suggestions WHERE date = ?').get(today).c;
  if (existing > 0) {
    return res.json({ cached: true, message: 'Already generated today' });
  }

  const client = getClient();
  if (!client) return res.status(503).json({ error: 'Claude API key not configured', offline: true });

  // Build preference context from ratings history
  const ratings = db.prepare(`
    SELECT rs.title, rs.category, rs.source, rr.rating
    FROM reading_ratings rr
    JOIN reading_suggestions rs ON rs.id = rr.suggestion_id
    ORDER BY rr.created_at DESC LIMIT 50
  `).all();

  const liked = ratings.filter(r => r.rating > 0).map(r => `${r.title} (${r.category})`).slice(0, 10);
  const disliked = ratings.filter(r => r.rating < 0).map(r => `${r.title}`).slice(0, 5);

  // Fetch some RSS content
  const feeds = db.prepare('SELECT * FROM rss_feeds WHERE active = 1 LIMIT 3').all();
  let rssHeadlines = [];
  for (const feed of feeds) {
    try {
      const Parser = require('rss-parser');
      const parser = new Parser({ timeout: 5000 });
      const result = await parser.parseURL(feed.url);
      rssHeadlines.push(...result.items.slice(0, 5).map(i => ({ title: i.title, url: i.link, source: feed.name || feed.url })));
    } catch (e) { /* skip failed feeds */ }
  }

  const dayOfWeek = new Date().getDay();
  const categories = [
    { cat: 'fiction', label: 'fiction story or literary excerpt' },
    { cat: 'nonfiction', label: 'non-fiction opinion, psychology, or personal essay' },
    { cat: 'world-affairs', label: 'world affairs, economics, or foreign policy (two balanced perspectives)' },
    { cat: 'science', label: 'science or nature piece' },
    { cat: 'food', label: 'food, cooking, or agriculture piece' },
    { cat: 'biography', label: 'biography, profile, or human interest story' },
  ];
  const todayCat = categories[dayOfWeek % categories.length];

  try {
    const prompt = `Generate today's reading suggestion for a thoughtful woman in West Texas who maintains a personal knowledge library.

Today's featured category: ${todayCat.label}

User's demonstrated preferences (liked): ${liked.length ? liked.join(', ') : 'not enough data yet'}
User has not enjoyed: ${disliked.length ? disliked.join(', ') : 'none recorded'}

Available RSS headlines to potentially surface:
${rssHeadlines.map(h => `- "${h.title}" from ${h.source} (${h.url})`).join('\n')}

Generate 6 reading suggestions total:
- 1 from the featured category above
- 2 tailored to demonstrated preferences (similar topics/styles to what she's liked)
- 1 deliberate variety pick (topic she hasn't engaged with much)
- If the category involves politics or policy, generate 2 suggestions on the same topic from balanced perspectives (labeled Perspective A and Perspective B, factual only, no far-right or far-left framing)
- 1 wildcard from culture, nature, or human interest

For each suggestion return:
{
  "category": "one of: fiction|nonfiction|world-affairs|science|food|biography|wildcard",
  "title": "exact article title",
  "url": "real URL or omit if uncertain",
  "source": "publication name",
  "summary": "2 sentence description",
  "content_type": "article|podcast|video",
  "perspective": "A or B only for world-affairs balanced pairs, otherwise null",
  "pair_id": "same string for the two balanced perspectives, otherwise null"
}

Return as JSON array. Prioritize real, verifiable content over fabricated titles.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    let suggestions = [];
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]);
    } catch (e) { suggestions = []; }

    const insertStmt = db.prepare('INSERT INTO reading_suggestions (date, category, title, url, source, summary, content_type, perspective, pair_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of suggestions) {
      insertStmt.run(today, s.category || 'nonfiction', s.title, s.url || null, s.source || null, s.summary || null, s.content_type || 'article', s.perspective || null, s.pair_id || null);
    }

    res.json({ generated: suggestions.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Personal shopper
router.post('/shopper', async (req, res) => {
  const { query } = req.body;
  const client = getClient();
  if (!client) return res.status(503).json({ error: 'Claude API key not configured', offline: true });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a personal shopper. Find actual products matching this request: "${query}"

Return 8-12 specific real products. For each product provide:
- name: product name
- brand: brand name
- price: price or price range (e.g. "$89" or "$75-$120")
- retailer: store name
- url: direct product URL if you know it (real URLs only, omit if uncertain)
- image_url: product image URL if available
- description: 1 sentence description of why it matches the request

Format as JSON array. Focus on products that genuinely match all criteria in the query including price range, color, style, and any other specifics mentioned.`
      }]
    });

    let results = [];
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) results = JSON.parse(jsonMatch[0]);
    } catch (e) { results = []; }

    // Save query to history
    const db = getDb();
    db.prepare('INSERT INTO shopper_queries (query, results_json) VALUES (?, ?)').run(query, JSON.stringify(results));

    res.json({ results, query, note: 'Links may expire as products go out of stock.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
