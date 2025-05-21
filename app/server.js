const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// Gmail transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error in /api/users:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', requireLogin, async (req, res) => {
  if (!req.session.isAdmin && parseInt(req.params.id) !== req.session.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, email, bio } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO users (first_name, last_name, email, bio) VALUES (\$1, \$2, \$3, \$4) RETURNING id',
      [first_name, last_name, email, bio]
    );
    res.json({ 
      message: 'User created successfully',
      userId: result.rows[0].id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { first_name, last_name, email, bio } = req.body;
  
  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET first_name = \$1, last_name = \$2, email = \$3, bio = \$4 WHERE id = \$5 RETURNING *',
      [first_name, last_name, email, bio, req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = \$1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, password, bio } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (first_name, last_name, email, bio, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, is_admin',
      [first_name, last_name, email, bio, hash]
    );
    req.session.userId = result.rows[0].id;
    req.session.isAdmin = result.rows[0].is_admin;
    res.json({ message: 'Registration successful' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await db.query('SELECT id, password_hash, is_admin FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin;
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// Get current user info
app.get('/api/me', requireLogin, async (req, res) => {
  try {
    const result = await db.query('SELECT id, first_name, last_name, email, bio, is_admin FROM users WHERE id = $1', [req.session.userId]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current user bio
app.put('/api/me', requireLogin, async (req, res) => {
  const { first_name, last_name, bio } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name required' });
  }
  try {
    const result = await db.query(
      'UPDATE users SET first_name = $1, last_name = $2, bio = $3 WHERE id = $4 RETURNING id, first_name, last_name, email, bio',
      [first_name, last_name, bio, req.session.userId]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request password reset
app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }
    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await db.query('UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3', [token, expires, userId]);
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Reset your password: ${resetUrl}`
    });
    console.log('Password reset link:', resetUrl);
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
  try {
    const result = await db.query('SELECT id, password_reset_expires FROM users WHERE password_reset_token = $1', [token]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const user = result.rows[0];
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }
    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2', [hash, user.id]);
    res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:\${PORT}`);
});
