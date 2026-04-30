require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

function getTailscaleIP() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && addr.address.startsWith('100.')) {
        const second = parseInt(addr.address.split('.')[1], 10);
        if (second >= 64 && second <= 127) return addr.address;
      }
    }
  }
  return null;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/entries',      require('./routes/entries'));
app.use('/api/tags',         require('./routes/tags'));
app.use('/api/search',       require('./routes/search'));
app.use('/api/daily',        require('./routes/daily'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/images',       require('./routes/images'));
app.use('/api/show-folders', require('./routes/showFolders'));
app.use('/api/checklist',    require('./routes/checklist'));
app.use('/api/workout',      require('./routes/workout'));
app.use('/api/meditation',   require('./routes/meditation'));
app.use('/api/beauty',       require('./routes/beauty'));
app.use('/api/style',        require('./routes/style'));
app.use('/api/cycles',       require('./routes/cycles'));
app.use('/api/vision',       require('./routes/vision'));
app.use('/api/favorites',    require('./routes/favorites'));
app.use('/api/rss',          require('./routes/rss'));
app.use('/api/ai',           require('./routes/ai'));
app.use('/api/spotify',      require('./routes/spotify'));

// Serve React build
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log("  ✦ Sarah's Brain is running");
  console.log('');
  console.log(`  Local:     http://localhost:${PORT}`);
  const ts = getTailscaleIP();
  if (ts) console.log(`  Tailscale: http://${ts}:${PORT}  ← use this on your phone`);
  else console.log('  Tailscale: not detected');
  console.log('');
});

module.exports = app;
