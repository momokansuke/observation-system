const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// ミドルウェア設定
// ========================================
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ========================================
// データベース接続設定
// ========================================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// データベース接続確認
pool.on('error', (err) => {
  console.error('❌ データベース接続エラー:', err);
});

// ========================================
// 認証ミドルウェア
// ========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '認証トークンが必要です' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効です' });
    }
    req.user = user;
    next();
  });
};

// ========================================
// 認証API
// ========================================

// ログイン
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
// ユーザー登録API
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, company_name } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: '氏名、メールアドレス、パスワードは必須です' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, company_name, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, company_name',
      [name, email, passwordHash, company_name || null]
    );

    const newUser = result.rows[0];

    const token = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ 新規ユーザー登録成功: ${newUser.email}`);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        company_name: newUser.company_name
      }
    });
  } catch (error) {
    console.error('❌ ユーザー登録エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

  try {
    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ ログインエラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});
// ユーザー登録API
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, company_name } = req.body;

  // 入力検証
  if (!name || !email || !password) {
    return res.status(400).json({ error: '氏名、メールアドレス、パスワードは必須です' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上で設定してください' });
  }

  try {
    // メールアドレスの重複チェック
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    }

    // パスワードのハッシュ化（現在のシステムに完全対応）
    const passwordHash = await bcrypt.hash(password, 10);

    // 新規ユーザー作成
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, company_name, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, company_name',
      [name, email, passwordHash, company_name || null]
    );

    const newUser = result.rows[0];

    // JWTトークン生成（自動ログイン）
    const token = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ 新規ユーザー登録成功: ${newUser.email}`);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        company_name: newUser.company_name
      }
    });
  } catch (error) {
    console.error('❌ ユーザー登録エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// 現在のユーザー情報取得
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ ユーザー情報取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ========================================
// 部下管理API
// ========================================

// 部下一覧取得
app.get('/api/subordinates', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subordinates WHERE manager_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 部下一覧取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラーが発生しました' });
  }
});

// 部下追加
app.post('/api/subordinates', authenticateToken, async (req, res) => {
  const { name, department, position } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '氏名は必須です' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO subordinates (manager_id, name, department, position) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, department || null, position || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ 部下追加エラー:', error);
    res.status(500).json({ error: 'データ保存エラーが発生しました' });
  }
});

// ========================================
// 観察記録API
// ========================================

// 観察記録一覧取得
app.get('/api/observations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, s.name as subordinate_name, s.department, s.position 
       FROM observations o
       JOIN subordinates s ON o.subordinate_id = s.id
       WHERE s.manager_id = $1
       ORDER BY o.observation_date DESC, o.created_at DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 観察記録取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラーが発生しました' });
  }
});

// 観察記録追加
app.post('/api/observations', authenticateToken, async (req, res) => {
  const { subordinate_id, observation_date, behavior, situation, impact, category } = req.body;

  if (!subordinate_id || !behavior) {
    return res.status(400).json({ error: '部下と行動内容は必須です' });
  }

  try {
    // 部下が管理者に属しているか確認
    const subordinateCheck = await pool.query(
      'SELECT id FROM subordinates WHERE id = $1 AND manager_id = $2',
      [subordinate_id, req.user.userId]
    );

    if (subordinateCheck.rows.length === 0) {
      return res.status(403).json({ error: 'この部下の記録を作成する権限がありません' });
    }

    const result = await pool.query(
      `INSERT INTO observations 
       (subordinate_id, observation_date, behavior, situation, impact, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        subordinate_id,
        observation_date || new Date().toISOString().split('T')[0],
        behavior,
        situation || null,
        impact || null,
        category || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ 観察記録追加エラー:', error);
    res.status(500).json({ error: 'データ保存エラーが発生しました' });
  }
});

// ========================================
// ダッシュボード統計API
// ========================================
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [subordinatesResult, thisWeekResult, totalObservationsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM subordinates WHERE manager_id = $1', [req.user.userId]),
      pool.query(
        `SELECT COUNT(*) FROM observations o
         JOIN subordinates s ON o.subordinate_id = s.id
         WHERE s.manager_id = $1 
         AND o.observation_date >= DATE_TRUNC('week', CURRENT_DATE)`,
        [req.user.userId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM observations o
         JOIN subordinates s ON o.subordinate_id = s.id
         WHERE s.manager_id = $1`,
        [req.user.userId]
      )
    ]);

    res.json({
      totalSubordinates: parseInt(subordinatesResult.rows[0].count),
      thisWeekObservations: parseInt(thisWeekResult.rows[0].count),
      totalObservations: parseInt(totalObservationsResult.rows[0].count)
    });
  } catch (error) {
    console.error('❌ 統計取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラーが発生しました' });
  }
});

// ========================================
// サーバー起動
// ========================================
const startServer = async () => {
  console.log('🚀 ========================================');
  console.log('   観察記録システム サーバー起動');
  console.log('   ========================================');
  console.log(`   ポート: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('   ========================================');

  try {
    const client = await pool.connect();
    console.log(`✅ データベース接続成功: ${new Date().toISOString()}`);
    client.release();
  } catch (err) {
    console.error('❌ データベース接続失敗:', err);
  }

  app.listen(PORT, () => {
    console.log(`🌐 サーバーがポート ${PORT} で待機中...`);
  });
};

startServer();
