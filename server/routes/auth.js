const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run, saveDb } = require('../models/database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 用户注册
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }
    const existing = get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(409).json({ error: '用户名或邮箱已存在' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hash, 'user']);
    const user = get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user);
    saveDb();
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 用户登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码为必填项' });
    }
    const user = get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = generateToken(user);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '旧密码和新密码为必填项' });
    }
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      return res.status(401).json({ error: '旧密码错误' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    run('UPDATE users SET password_hash = ?, updated_at = datetime("now", "+8 hours") WHERE id = ?', [hash, req.user.id]);
    saveDb();
    res.json({ message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: '修改密码失败: ' + err.message });
  }
});

module.exports = router;
