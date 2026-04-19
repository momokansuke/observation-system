const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS policy violation'));
  },
  credentials: true,
}));
app.use(express.json());

let pool = null;
let dbInitialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      max: 1,
    });
  }
  return pool;
}

async function ensureDB() {
  if (dbInitialized) return;
  const client = await getPool().connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, company_name TEXT, role TEXT DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`CREATE TABLE IF NOT EXISTS subordinates (id SERIAL PRIMARY KEY, manager_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL, department TEXT, position TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await client.query(`CREATE TABLE IF NOT EXISTS observations (id SERIAL PRIMARY KEY, subordinate_id INTEGER NOT NULL REFERENCES subordinates(id), observation_date DATE NOT NULL DEFAULT CURRENT_DATE, behavior TEXT NOT NULL, situation TEXT, impact TEXT, category TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    dbInitialized = true;
  } finally {
    client.release();
  }
}

app.use(async (req, res, next) => {
  try { await ensureDB(); next(); }
  catch (err) { res.status(500).json({ error: 'データベース接続エラー' }); }
});

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: '認証トークンが必要です' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'トークンが無効です' });
    req.user = user; next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, company_name } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '氏名、メールアドレス、パスワードは必須です' });
  if (password.length < 6) return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
  try {
    const db = getPool();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, company_name) VALUES ($1, $2, $3, $4) RETURNING id, name, email, company_name, role',
      [name, email, hash, company_name || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user });
  } catch (e) { console.error(e); res.status(500).json({ error: 'サーバーエラー' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
  try {
    const result = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length || !(await bcrypt.compare(password, result.rows[0].password_hash)))
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    const u = result.rows[0];
    const token = jwt.sign({ userId: u.id, email: u.email, name: u.name, role: u.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: u.id, email: u.email, name: u.name, company_name: u.company_name, role: u.role } });
  } catch (e) { res.status(500).json({ error: 'サーバーエラー' }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await getPool().query('SELECT id, email, name, company_name, role FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: 'サーバーエラー' }); }
});

app.get('/api/subordinates', authenticateToken, async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM subordinates WHERE manager_id = $1 ORDER BY name', [req.user.userId]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: 'データ取得エラー' }); }
});

app.post('/api/subordinates', authenticateToken, async (req, res) => {
  const { name, department, position } = req.body;
  if (!name) return res.status(400).json({ error: '氏名は必須です' });
  try {
    const result = await getPool().query(
      'INSERT INTO subordinates (manager_id, name, department, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, department || null, position || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: 'データ保存エラー' }); }
});

app.delete('/api/subordinates/:id', authenticateToken, async (req, res) => {
  try {
    const result = await getPool().query('DELETE FROM subordinates WHERE id = $1 AND manager_id = $2 RETURNING id', [req.params.id, req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: '部下が見つかりません' });
    res.json({ message: '削除しました' });
  } catch (e) { res.status(500).json({ error: 'データ削除エラー' }); }
});

app.get('/api/observations', authenticateToken, async (req, res) => {
  try {
    const result = await getPool().query(
      'SELECT o.*, s.name as subordinate_name, s.department, s.position FROM observations o JOIN subordinates s ON o.subordinate_id = s.id WHERE s.manager_id = $1 ORDER BY o.observation_date DESC, o.created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: 'データ取得エラー' }); }
});

app.post('/api/observations', authenticateToken, async (req, res) => {
  const { subordinate_id, observation_date, behavior, situation, impact, category } = req.body;
  if (!subordinate_id || !behavior) return res.status(400).json({ error: '部下と行動内容は必須です' });
  try {
    const check = await getPool().query('SELECT id FROM subordinates WHERE id = $1 AND manager_id = $2', [subordinate_id, req.user.userId]);
    if (!check.rows.length) return res.status(403).json({ error: '権限がありません' });
    const result = await getPool().query(
      'INSERT INTO observations (subordinate_id, observation_date, behavior, situation, impact, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [subordinate_id, observation_date || new Date().toISOString().split('T')[0], behavior, situation || null, impact || null, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: 'データ保存エラー' }); }
});

app.delete('/api/observations/:id', authenticateToken, async (req, res) => {
  try {
    const result = await getPool().query(
      'DELETE FROM observations o USING subordinates s WHERE o.id = $1 AND o.subordinate_id = s.id AND s.manager_id = $2 RETURNING o.id',
      [req.params.id, req.user.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: '記録が見つかりません' });
    res.json({ message: '削除しました' });
  } catch (e) { res.status(500).json({ error: 'データ削除エラー' }); }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const [s, w, t] = await Promise.all([
      db.query('SELECT COUNT(*) FROM subordinates WHERE manager_id = $1', [req.user.userId]),
      db.query("SELECT COUNT(*) FROM observations o JOIN subordinates s ON o.subordinate_id = s.id WHERE s.manager_id = $1 AND o.observation_date >= DATE_TRUNC('week', CURRENT_DATE)", [req.user.userId]),
      db.query('SELECT COUNT(*) FROM observations o JOIN subordinates s ON o.subordinate_id = s.id WHERE s.manager_id = $1', [req.user.userId]),
    ]);
    res.json({ totalSubordinates: parseInt(s.rows[0].count), thisWeekObservations: parseInt(w.rows[0].count), totalObservations: parseInt(t.rows[0].count) });
  } catch (e) { res.status(500).json({ error: 'データ取得エラー' }); }
});

if (require.main === module) {
  app.listen(PORT, () => console.log('Server running on port ' + PORT));
}

module.exports = app;
