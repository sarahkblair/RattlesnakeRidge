require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'rr-homestead-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Auth middleware (excludes auth routes and uploads)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/auth') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/assets') ||
    req.path === '/' ||
    req.path.endsWith('.html') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.ico') ||
    req.path.endsWith('.svg') ||
    req.path.endsWith('.png')
  ) {
    return next();
  }
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/images', require('./routes/images'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/wish-list', require('./routes/wishlist'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/meal-pool', require('./routes/mealpool'));
app.use('/api/grocery', require('./routes/grocery'));
app.use('/api/compass', require('./routes/compass'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ask', require('./routes/ask'));
app.use('/api/export', require('./routes/export'));

// Serve React app in production
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RR Homestead Hub server running on http://0.0.0.0:${PORT}`);
});
