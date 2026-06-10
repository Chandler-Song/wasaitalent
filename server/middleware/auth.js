const jwt = require('jsonwebtoken');
const { get } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'wasai-talent-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: '未提供API密钥' });
  }
  try {
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = get('SELECT * FROM api_keys WHERE key_hash = ?', [keyHash]);
    if (!keyRecord) {
      return res.status(401).json({ error: 'API密钥无效' });
    }
    const { getDb } = require('../models/database');
    getDb().then(db => {
      db.run('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?', [keyRecord.id]);
    });
    const user = get('SELECT id, username, email, role FROM users WHERE id = ?', [keyRecord.user_id]);
    req.user = user;
    req.apiKey = keyRecord;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'API密钥验证失败' });
  }
}

module.exports = { generateToken, authMiddleware, adminMiddleware, apiKeyMiddleware, JWT_SECRET };
