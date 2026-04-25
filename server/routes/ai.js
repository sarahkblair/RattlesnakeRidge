const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are the expert AI for Rattlesnake Ridge (RR), a 44-acre homestead in West Texas, USDA Zone 8b. CONDITIONS: Arid, 105-115°F summer peaks, sustained high winds, alkaline soil pH 7.5-8.5, well water plus rainwater collection, mild winters with hard freezes possible below 20°F. Serious productive kitchen garden. OWNERS: Sarah (avid home cook, experienced, wants technique and options not rigid recipes) and Kyle (self-sufficiency focused). Be direct, specific, with real product/timing recommendations. Always filter through RR conditions.`;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

router.post('/chat', async (req, res) => {
  try {
    const { messages, system, max_tokens = 1000, stream: doStream } = req.body;
    const client = getClient();

    const systemPrompt = system ? `${SYSTEM_PROMPT}\n\n${system}` : SYSTEM_PROMPT;

    if (doStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens,
        system: systemPrompt,
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens,
        system: systemPrompt,
        messages,
      });
      res.json({ content: response.content[0].text });
    }
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/vision', async (req, res) => {
  try {
    const { imageBase64, mediaType = 'image/jpeg', prompt, max_tokens = 1000 } = req.body;
    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: prompt || 'Diagnose any issues with this plant. Be specific about what you see and recommend treatment.' },
        ],
      }],
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('AI vision error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
