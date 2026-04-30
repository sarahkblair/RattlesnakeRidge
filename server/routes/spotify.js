const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/api/spotify/callback';

function base64(str) { return Buffer.from(str).toString('base64'); }

// Start OAuth flow
router.get('/auth', (req, res) => {
  if (!CLIENT_ID) return res.status(503).json({ error: 'Spotify credentials not configured' });
  const scopes = ['streaming', 'user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private'].join(' ');
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(url);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code');

  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI })
    });
    const data = await r.json();
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('spotify_access_token', ?)").run(data.access_token);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('spotify_refresh_token', ?)").run(data.refresh_token);
    res.send('<script>window.close()</script><p>Spotify connected! You can close this window.</p>');
  } catch (e) {
    res.status(500).send('Spotify auth failed: ' + e.message);
  }
});

async function getAccessToken() {
  const db = getDb();
  let token = db.prepare("SELECT value FROM settings WHERE key = 'spotify_access_token'").get()?.value;
  const refresh = db.prepare("SELECT value FROM settings WHERE key = 'spotify_refresh_token'").get()?.value;
  if (!token || !refresh || !CLIENT_ID) return null;

  // Try to refresh if needed
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh })
    });
    const data = await r.json();
    if (data.access_token) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('spotify_access_token', ?)").run(data.access_token);
      token = data.access_token;
    }
  } catch (e) { /* use existing token */ }

  return token;
}

// Play meditation playlist on active device
router.post('/play', async (req, res) => {
  const db = getDb();
  const playlistId = db.prepare("SELECT value FROM settings WHERE key = 'spotify_playlist_id'").get()?.value;
  if (!playlistId) return res.status(400).json({ error: 'No meditation playlist configured' });

  const token = await getAccessToken();
  if (!token) return res.status(503).json({ error: 'Spotify not connected', offline: true });

  try {
    const fetch = (await import('node-fetch')).default;
    await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}`, offset: { position: Math.floor(Math.random() * 20) } })
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Pause
router.post('/pause', async (req, res) => {
  const token = await getAccessToken();
  if (!token) return res.status(503).json({ error: 'Spotify not connected' });
  const fetch = (await import('node-fetch')).default;
  await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  res.json({ ok: true });
});

// Connection status
router.get('/status', (req, res) => {
  const db = getDb();
  const token = db.prepare("SELECT value FROM settings WHERE key = 'spotify_access_token'").get()?.value;
  const playlistId = db.prepare("SELECT value FROM settings WHERE key = 'spotify_playlist_id'").get()?.value;
  res.json({ connected: !!token, hasPlaylist: !!playlistId, configured: !!(CLIENT_ID && CLIENT_SECRET) });
});

module.exports = router;
