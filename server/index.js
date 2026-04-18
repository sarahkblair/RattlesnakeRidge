const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

function getTailscaleIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      // Tailscale assigns addresses in the 100.64.0.0/10 range
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

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/entries', require('./routes/entries'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/search', require('./routes/search'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/images', require('./routes/images'));
app.use('/api/show-folders', require('./routes/showFolders'));

// Serve React build in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log("  ✦ Sarah's Brain is running");
  console.log('');
  console.log(`  Local:     http://localhost:${PORT}`);

  const tailscaleIP = getTailscaleIP();
  if (tailscaleIP) {
    console.log(`  Tailscale: http://${tailscaleIP}:${PORT}  ← use this on your phone`);
  } else {
    console.log('  Tailscale: not detected (install Tailscale to access from your phone)');
  }

  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});

module.exports = app;
