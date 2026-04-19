const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { initDB, getDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: '認証トークンが必要です' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'トークンが無効です' });
    req.user = user;
    next();
  });
};

// API Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body; // role added strictly for testing/demo per plan
  if (!name || !email || !password) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }

  try {
    const db = getDB();
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'user']
    );

    const token = jwt.sign(
      { userId: result.lastID, email, name, role: role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: result.lastID, name, email, role: role || 'user' } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Log
app.post('/api/logs', authenticateToken, async (req, res) => {
  const { date, content } = req.body;
  if (!date || !content) {
    return res.status(400).json({ error: 'Date and content are required' });
  }

  try {
    const db = getDB();
    const result = await db.run(
      'INSERT INTO logs (user_id, date, content) VALUES (?, ?, ?)',
      [req.user.userId, date, content]
    );
    // Fetch the inserted log to return it
    const newLog = await db.get('SELECT * FROM logs WHERE id = ?', [result.lastID]);
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    let logs;

    if (req.user.role === 'admin') {
      // Admin sees ALL logs with user info
      logs = await db.all(`
        SELECT l.*, u.name as user_name 
        FROM logs l 
        JOIN users u ON l.user_id = u.id 
        ORDER BY l.date DESC, l.created_at DESC
      `);
    } else {
      // Regular user sees ONLY their logs
      logs = await db.all(
        'SELECT * FROM logs WHERE user_id = ? ORDER BY date DESC, created_at DESC',
        [req.user.userId]
      );
    }
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Start Server
const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
