const express = require('express');
const { get, all, run, saveDb } = require('../models/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// 获取系统概览统计
router.get('/dashboard', (req, res) => {
  try {
    const totalUsers = get('SELECT COUNT(*) as count FROM users', []).count;
    const totalTalents = get('SELECT COUNT(*) as count FROM talents', []).count;
    const totalNotes = get('SELECT COUNT(*) as count FROM talent_notes', []).count;
    const totalApiKeys = get('SELECT COUNT(*) as count FROM api_keys', []).count;
    const totalProfiles = get('SELECT COUNT(*) as count FROM talent_profiles', []).count;
    const totalMerges = get('SELECT COUNT(*) as count FROM talent_merges', []).count;
    const sourceStats = all('SELECT data_source, COUNT(*) as count FROM talents WHERE data_source IS NOT NULL GROUP BY data_source', []);
    const importMethodStats = all('SELECT import_method, COUNT(*) as count FROM talents WHERE import_method IS NOT NULL GROUP BY import_method', []);
    const platformStats = all('SELECT platform, COUNT(*) as count FROM talent_profiles GROUP BY platform', []);
    const recentTalents = all('SELECT * FROM talents ORDER BY created_at DESC LIMIT 5', []);
    const recentUsers = all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5', []);

    res.json({
      data: {
        totalUsers, totalTalents, totalNotes, totalApiKeys, totalProfiles, totalMerges,
        sourceStats, importMethodStats, platformStats, recentTalents, recentUsers
      }
    });
  } catch (err) {
    res.status(500).json({ error: '获取仪表盘数据失败: ' + err.message });
  }
});

// 用户管理 - 获取所有用户
router.get('/users', (req, res) => {
  try {
    const users = all('SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC', []);
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败: ' + err.message });
  }
});

// 用户管理 - 修改用户角色
router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }
    run('UPDATE users SET role = ?, updated_at = datetime("now", "+8 hours") WHERE id = ?', [role, req.params.id]);
    saveDb();
    res.json({ message: '角色更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新角色失败: ' + err.message });
  }
});

// 用户管理 - 删除用户
router.delete('/users/:id', (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: '不能删除自己' });
    }
    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: '用户删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除用户失败: ' + err.message });
  }
});

// API密钥管理 - 创建
router.post('/api-keys', (req, res) => {
  try {
    const crypto = require('crypto');
    const { name, permissions } = req.body;
    const apiKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = run('INSERT INTO api_keys (user_id, key_hash, name, permissions) VALUES (?, ?, ?, ?)',
      [req.user.id, keyHash, name || 'Default Key', permissions || 'read']);

    saveDb();
    res.status(201).json({
      data: { id: result.lastInsertRowid, name: name || 'Default Key', key: apiKey, permissions: permissions || 'read' }
    });
  } catch (err) {
    res.status(500).json({ error: '创建API密钥失败: ' + err.message });
  }
});

// API密钥管理 - 列表
router.get('/api-keys', (req, res) => {
  try {
    const keys = all('SELECT id, name, permissions, last_used_at, created_at FROM api_keys ORDER BY created_at DESC', []);
    res.json({ data: keys });
  } catch (err) {
    res.status(500).json({ error: '获取API密钥列表失败: ' + err.message });
  }
});

// API密钥管理 - 删除
router.delete('/api-keys/:id', (req, res) => {
  try {
    run('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: 'API密钥删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除API密钥失败: ' + err.message });
  }
});

module.exports = router;
