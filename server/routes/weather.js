const router = require('express').Router();
const https = require('https');

// Rattlesnake Ridge approximate coords (West Texas)
const LAT = 30.5;
const LON = -104.0;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

router.get('/', async (req, res) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=America%2FChicago&forecast_days=7`;
    const data = await fetchJson(url);

    const days = data.daily.time.map((date, i) => ({
      date,
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      precip: data.daily.precipitation_sum[i],
      code: data.daily.weathercode[i],
      icon: weatherIcon(data.daily.weathercode[i]),
    }));

    res.json({ days });
  } catch (err) {
    console.error('Weather fetch error:', err.message);
    res.status(503).json({ error: 'Weather unavailable', days: [] });
  }
});

function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

module.exports = router;
