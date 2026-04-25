const router = require('express').Router();

const APP_PASSWORD = process.env.APP_PASSWORD || 'RR234';

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/check', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

module.exports = router;
