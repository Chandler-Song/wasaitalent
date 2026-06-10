const express = require('express');
const { get, all, run, saveDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// 获取人才列表（支持搜索和分页）
router.get('/', authMiddleware, (req, res) => {
  try {
    const {
      search, data_source, import_method, status, open_to_work,
      education, gender, location, skills, email, phone, wechat,
      suitable_roles, job_preference,
      experience_years_min, experience_years_max,
      expected_salary_min, expected_salary_max,
      page = 1, limit = 20, sort = 'created_at', order = 'DESC'
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClauses = [];
    let params = [];

    if (search) {
      whereClauses.push('(t.name LIKE ? OR t.email LIKE ? OR t.company LIKE ? OR t.title LIKE ? OR t.skills LIKE ? OR t.phone LIKE ? OR t.location LIKE ? OR t.education LIKE ? OR t.summary LIKE ? OR t.suitable_roles LIKE ? OR t.homepage LIKE ? OR t.github_url LIKE ? OR t.google_scholar_url LIKE ? OR t.wechat LIKE ? OR t.job_preference LIKE ? OR t.tags LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term, term, term, term, term, term, term, term, term);
    }
    if (data_source) {
      whereClauses.push('t.data_source = ?');
      params.push(data_source);
    }
    if (import_method) {
      whereClauses.push('t.import_method = ?');
      params.push(import_method);
    }
    if (status) {
      whereClauses.push('t.status = ?');
      params.push(status);
    }
    if (open_to_work) {
      whereClauses.push('t.open_to_work = ?');
      params.push(open_to_work);
    }
    if (education) {
      whereClauses.push('t.education = ?');
      params.push(education);
    }
    if (gender) {
      whereClauses.push('t.gender = ?');
      params.push(gender);
    }
    if (location) {
      whereClauses.push('t.location LIKE ?');
      params.push(`%${location}%`);
    }
    if (skills) {
      whereClauses.push('t.skills LIKE ?');
      params.push(`%${skills}%`);
    }
    if (experience_years_min) {
      whereClauses.push('t.experience_years >= ?');
      params.push(parseInt(experience_years_min));
    }
    if (experience_years_max) {
      whereClauses.push('t.experience_years <= ?');
      params.push(parseInt(experience_years_max));
    }
    if (expected_salary_min) {
      whereClauses.push('CAST(REPLACE(REPLACE(t.expected_salary, ",", ""), "k", "000") AS REAL) >= ?');
      params.push(parseFloat(expected_salary_min));
    }
    if (expected_salary_max) {
      whereClauses.push('CAST(REPLACE(REPLACE(t.expected_salary, ",", ""), "k", "000") AS REAL) <= ?');
      params.push(parseFloat(expected_salary_max));
    }
    if (email) {
      whereClauses.push('t.email LIKE ?');
      params.push(`%${email}%`);
    }
    if (phone) {
      whereClauses.push('t.phone LIKE ?');
      params.push(`%${phone}%`);
    }
    if (wechat) {
      whereClauses.push('t.wechat LIKE ?');
      params.push(`%${wechat}%`);
    }
    if (suitable_roles) {
      whereClauses.push('t.suitable_roles LIKE ?');
      params.push(`%${suitable_roles}%`);
    }
    if (job_preference) {
      whereClauses.push('t.job_preference LIKE ?');
      params.push(`%${job_preference}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const allowedSorts = ['name', 'created_at', 'rating', 'experience_years', 'updated_at'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const totalResult = get(`SELECT COUNT(*) as count FROM talents t ${whereStr}`, params);
    const total = totalResult ? totalResult.count : 0;

    const talents = all(
      `SELECT t.*, (SELECT COUNT(*) FROM talent_profiles tp WHERE tp.talent_id = t.id) as profile_count,
        (SELECT COUNT(*) FROM talent_merges tm WHERE tm.primary_talent_id = t.id OR tm.merged_talent_id = t.id) as merge_count
      FROM talents t ${whereStr} ORDER BY t.${sortCol} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: talents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: '获取人才列表失败: ' + err.message });
  }
});

// 获取单个人才详情（含profiles和关联人才）
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT * FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) {
      return res.status(404).json({ error: '人才信息不存在' });
    }
    const profiles = all('SELECT * FROM talent_profiles WHERE talent_id = ? ORDER BY platform', [req.params.id]);
    const experiences = all('SELECT * FROM talent_experiences WHERE talent_id = ? ORDER BY sort_order, created_at DESC', [req.params.id]);
    const educations = all('SELECT * FROM talent_educations WHERE talent_id = ? ORDER BY sort_order, created_at DESC', [req.params.id]);
    const notes = all('SELECT n.*, u.username FROM talent_notes n JOIN users u ON n.user_id = u.id WHERE n.talent_id = ? ORDER BY n.created_at DESC', [req.params.id]);
    const followups = all('SELECT f.*, u.username FROM talent_followups f JOIN users u ON f.user_id = u.id WHERE f.talent_id = ? ORDER BY f.created_at DESC', [req.params.id]);
    const papers = all('SELECT * FROM talent_papers WHERE talent_id = ? ORDER BY year DESC, sort_order', [req.params.id]);
    const patents = all('SELECT * FROM talent_patents WHERE talent_id = ? ORDER BY filing_date DESC, sort_order', [req.params.id]);
    const conferences = all('SELECT * FROM talent_conferences WHERE talent_id = ? ORDER BY year DESC, sort_order', [req.params.id]);
    const githubRepos = all('SELECT * FROM talent_github_repos WHERE talent_id = ? ORDER BY stars DESC, sort_order', [req.params.id]);

    // 获取关联的人才（通过merge表）
    const mergedIds = all(
      `SELECT primary_talent_id as talent_id FROM talent_merges WHERE merged_talent_id = ?
       UNION
       SELECT merged_talent_id as talent_id FROM talent_merges WHERE primary_talent_id = ?`,
      [req.params.id, req.params.id]
    );
    let relatedTalents = [];
    if (mergedIds.length > 0) {
      const ids = mergedIds.map(r => r.talent_id);
      const placeholders = ids.map(() => '?').join(',');
      relatedTalents = all(`SELECT id, name, company, title, data_source, import_method FROM talents WHERE id IN (${placeholders})`, ids);
    }

    res.json({ data: talent, profiles, experiences, educations, notes, followups, papers, patents, conferences, githubRepos, relatedTalents });
  } catch (err) {
    res.status(500).json({ error: '获取人才详情失败: ' + err.message });
  }
});

// 创建人才信息
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      name, email, phone, company, title, location, skills, education,
      experience_years, summary, data_source, import_method, tags, rating, status, avatar_url, raw_data,
      open_to_work, suitable_roles, homepage, github_url, google_scholar_url,
      gender, expected_salary, job_preference, wechat
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '姓名为必填项' });
    }

    const result = run(`
      INSERT INTO talents (name, email, phone, company, title, location, skills, education,
        experience_years, summary, data_source, import_method, tags, rating, status, avatar_url, raw_data,
        open_to_work, suitable_roles, homepage, github_url, google_scholar_url,
        gender, expected_salary, job_preference, wechat, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, email || null, phone || null, company || null, title || null,
      location || null, skills || null, education || null, experience_years || null,
      summary || null, data_source || 'manual', import_method || 'manual',
      tags || null, rating || 0, status || 'active', avatar_url || null, raw_data || null,
      open_to_work || null, suitable_roles || null, homepage || null, github_url || null, google_scholar_url || null,
      gender || null, expected_salary || null, job_preference || null, wechat || null, req.user.id
    ]);

    const talent = get('SELECT * FROM talents WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: '创建人才信息失败: ' + err.message });
  }
});

// 更新人才信息
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT * FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) {
      return res.status(404).json({ error: '人才信息不存在' });
    }

    const fields = ['name', 'email', 'phone', 'company', 'title', 'location', 'skills',
      'education', 'experience_years', 'summary', 'data_source', 'import_method',
      'tags', 'rating', 'status', 'avatar_url', 'raw_data',
      'open_to_work', 'suitable_roles', 'homepage', 'github_url', 'google_scholar_url',
      'gender', 'expected_salary', 'job_preference', 'wechat'];

    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新字段' });
    }

    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.id);

    run(`UPDATE talents SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talents WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新人才信息失败: ' + err.message });
  }
});

// 删除人才信息
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) {
      return res.status(404).json({ error: '人才信息不存在' });
    }
    run('DELETE FROM talents WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除失败: ' + err.message });
  }
});

// 添加备注
router.post('/:id/notes', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: '备注内容为必填项' });
    }
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) {
      return res.status(404).json({ error: '人才信息不存在' });
    }
    const result = run('INSERT INTO talent_notes (talent_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]);
    const note = get('SELECT n.*, u.username FROM talent_notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: note });
  } catch (err) {
    res.status(500).json({ error: '添加备注失败: ' + err.message });
  }
});

// 更新备注
router.put('/:id/notes/:nid', authMiddleware, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '备注内容为必填项' });
    run('UPDATE talent_notes SET content = ? WHERE id = ? AND talent_id = ?', [content, req.params.nid, req.params.id]);
    const note = get('SELECT n.*, u.username FROM talent_notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?', [req.params.nid]);
    saveDb();
    res.json({ data: note });
  } catch (err) { res.status(500).json({ error: '更新备注失败: ' + err.message }); }
});

// 删除备注
router.delete('/:id/notes/:nid', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM talent_notes WHERE id = ? AND talent_id = ?', [req.params.nid, req.params.id]);
    saveDb();
    res.json({ message: '备注已删除' });
  } catch (err) { res.status(500).json({ error: '删除备注失败: ' + err.message }); }
});

// 添加平台档案
router.post('/:id/profiles', authMiddleware, (req, res) => {
  try {
    const { platform, platform_id, platform_url, username, display_name, avatar_url, bio, company, location, email, title, raw_data } = req.body;
    if (!platform) {
      return res.status(400).json({ error: '平台为必填项' });
    }
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) {
      return res.status(404).json({ error: '人才信息不存在' });
    }
    const result = run(`
      INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, avatar_url, bio, company, location, email, title, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.id, platform, platform_id || null, platform_url || null, username || null,
      display_name || null, avatar_url || null, bio || null, company || null, location || null, email || null, title || null, raw_data || null]);
    const profile = get('SELECT * FROM talent_profiles WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: profile });
  } catch (err) {
    res.status(500).json({ error: '添加档案失败: ' + err.message });
  }
});

// 更新平台档案
router.put('/:talentId/profiles/:profileId', authMiddleware, (req, res) => {
  try {
    const profile = get('SELECT id FROM talent_profiles WHERE id = ? AND talent_id = ?', [req.params.profileId, req.params.talentId]);
    if (!profile) return res.status(404).json({ error: '档案不存在' });
    const fields = ['platform', 'platform_id', 'platform_url', 'username', 'display_name', 'avatar_url', 'bio', 'company', 'location', 'email', 'title', 'raw_data'];
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.profileId);
    run(`UPDATE talent_profiles SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_profiles WHERE id = ?', [req.params.profileId]);
    saveDb();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新档案失败: ' + err.message });
  }
});

// 删除平台档案
router.delete('/:talentId/profiles/:profileId', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM talent_profiles WHERE id = ? AND talent_id = ?', [req.params.profileId, req.params.talentId]);
    saveDb();
    res.json({ message: '档案已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除档案失败: ' + err.message });
  }
});

// 关联/合并人才
router.post('/merge', authMiddleware, (req, res) => {
  try {
    const { primary_talent_id, merged_talent_id, match_type, match_confidence } = req.body;
    if (!primary_talent_id || !merged_talent_id) {
      return res.status(400).json({ error: '需要提供两个人才ID' });
    }
    if (primary_talent_id === merged_talent_id) {
      return res.status(400).json({ error: '不能关联同一个人' });
    }
    const existing = get(
      `SELECT id FROM talent_merges WHERE (primary_talent_id = ? AND merged_talent_id = ?) OR (primary_talent_id = ? AND merged_talent_id = ?)`,
      [primary_talent_id, merged_talent_id, merged_talent_id, primary_talent_id]
    );
    if (existing) {
      return res.status(409).json({ error: '关联已存在' });
    }
    const result = run(
      'INSERT INTO talent_merges (primary_talent_id, merged_talent_id, match_type, match_confidence, matched_by) VALUES (?, ?, ?, ?, ?)',
      [primary_talent_id, merged_talent_id, match_type || 'manual', match_confidence || 1.0, req.user.id]
    );
    saveDb();
    res.status(201).json({ data: { id: result.lastInsertRowid, primary_talent_id, merged_talent_id, match_type: match_type || 'manual' } });
  } catch (err) {
    res.status(500).json({ error: '关联失败: ' + err.message });
  }
});

// 取消关联
router.delete('/merge', authMiddleware, (req, res) => {
  try {
    const { primary_talent_id, merged_talent_id } = req.body;
    run(
      `DELETE FROM talent_merges WHERE (primary_talent_id = ? AND merged_talent_id = ?) OR (primary_talent_id = ? AND merged_talent_id = ?)`,
      [primary_talent_id, merged_talent_id, merged_talent_id, primary_talent_id]
    );
    saveDb();
    res.json({ message: '关联已取消' });
  } catch (err) {
    res.status(500).json({ error: '取消关联失败: ' + err.message });
  }
});

// 聚合查询 - 按数据来源统计
router.get('/stats/sources', authMiddleware, (req, res) => {
  try {
    const stats = all('SELECT data_source, COUNT(*) as count FROM talents GROUP BY data_source', []);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: '统计失败: ' + err.message });
  }
});

// 聚合查询 - 按导入方式统计
router.get('/stats/import-methods', authMiddleware, (req, res) => {
  try {
    const stats = all('SELECT import_method, COUNT(*) as count FROM talents GROUP BY import_method', []);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: '统计失败: ' + err.message });
  }
});

// 聚合查询 - 按公司统计
router.get('/stats/companies', authMiddleware, (req, res) => {
  try {
    const stats = all('SELECT company, COUNT(*) as count FROM talents WHERE company IS NOT NULL GROUP BY company ORDER BY count DESC LIMIT 20', []);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: '统计失败: ' + err.message });
  }
});

// 聚合查询 - 按平台档案统计
router.get('/stats/platforms', authMiddleware, (req, res) => {
  try {
    const stats = all('SELECT platform, COUNT(*) as count FROM talent_profiles GROUP BY platform', []);
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: '统计失败: ' + err.message });
  }
});

// ========== 工作经历 CRUD ==========

router.get('/:id/experiences', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const experiences = all('SELECT * FROM talent_experiences WHERE talent_id = ? ORDER BY sort_order, created_at DESC', [req.params.id]);
    res.json({ data: experiences });
  } catch (err) {
    res.status(500).json({ error: '获取工作经历失败: ' + err.message });
  }
});

router.post('/:id/experiences', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const { company, title, start_date, end_date, duration, location, responsibilities, achievements, is_current, description, company_details, data_source, sort_order } = req.body;
    const result = run(`
      INSERT INTO talent_experiences (talent_id, company, title, start_date, end_date, duration, location, responsibilities, achievements, is_current, description, company_details, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.id, company || null, title || null, start_date || null, end_date || null,
      duration || null, location || null, responsibilities || null, achievements || null,
      is_current || 0, description || null, company_details || null, data_source || 'manual', sort_order || 0]);
    const exp = get('SELECT * FROM talent_experiences WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: exp });
  } catch (err) {
    res.status(500).json({ error: '添加工作经历失败: ' + err.message });
  }
});

router.put('/:id/experiences/:eid', authMiddleware, (req, res) => {
  try {
    const exp = get('SELECT id FROM talent_experiences WHERE id = ? AND talent_id = ?', [req.params.eid, req.params.id]);
    if (!exp) return res.status(404).json({ error: '工作经历不存在' });
    const fields = ['company', 'title', 'start_date', 'end_date', 'duration', 'location', 'responsibilities', 'achievements', 'is_current', 'description', 'company_details', 'data_source', 'sort_order'];
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.eid);
    run(`UPDATE talent_experiences SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_experiences WHERE id = ?', [req.params.eid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新工作经历失败: ' + err.message });
  }
});

router.delete('/:id/experiences/:eid', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM talent_experiences WHERE id = ? AND talent_id = ?', [req.params.eid, req.params.id]);
    saveDb();
    res.json({ message: '工作经历已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除工作经历失败: ' + err.message });
  }
});

// ========== 教育经历 CRUD ==========

router.get('/:id/educations', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const educations = all('SELECT * FROM talent_educations WHERE talent_id = ? ORDER BY sort_order, created_at DESC', [req.params.id]);
    res.json({ data: educations });
  } catch (err) {
    res.status(500).json({ error: '获取教育经历失败: ' + err.message });
  }
});

router.post('/:id/educations', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const { school, degree, field, start_date, end_date, dates, location, ranking_info, data_source, sort_order } = req.body;
    const result = run(`
      INSERT INTO talent_educations (talent_id, school, degree, field, start_date, end_date, dates, location, ranking_info, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.id, school || null, degree || null, field || null, start_date || null, end_date || null,
      dates || null, location || null, ranking_info || null, data_source || 'manual', sort_order || 0]);
    const edu = get('SELECT * FROM talent_educations WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: edu });
  } catch (err) {
    res.status(500).json({ error: '添加教育经历失败: ' + err.message });
  }
});

router.put('/:id/educations/:eid', authMiddleware, (req, res) => {
  try {
    const edu = get('SELECT id FROM talent_educations WHERE id = ? AND talent_id = ?', [req.params.eid, req.params.id]);
    if (!edu) return res.status(404).json({ error: '教育经历不存在' });
    const fields = ['school', 'degree', 'field', 'start_date', 'end_date', 'dates', 'location', 'ranking_info', 'data_source', 'sort_order'];
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.eid);
    run(`UPDATE talent_educations SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_educations WHERE id = ?', [req.params.eid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新教育经历失败: ' + err.message });
  }
});

router.delete('/:id/educations/:eid', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM talent_educations WHERE id = ? AND talent_id = ?', [req.params.eid, req.params.id]);
    saveDb();
    res.json({ message: '教育经历已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除教育经历失败: ' + err.message });
  }
});

// ========== 跟盯记录 CRUD ==========

router.get('/:id/followups', authMiddleware, (req, res) => {
  try {
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const followups = all('SELECT f.*, u.username FROM talent_followups f JOIN users u ON f.user_id = u.id WHERE f.talent_id = ? ORDER BY f.created_at DESC', [req.params.id]);
    res.json({ data: followups });
  } catch (err) {
    res.status(500).json({ error: '获取跟盯记录失败: ' + err.message });
  }
});

router.post('/:id/followups', authMiddleware, (req, res) => {
  try {
    const { type, content, next_action, next_date } = req.body;
    if (!content) return res.status(400).json({ error: '跟盯内容为必填项' });
    const talent = get('SELECT id FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const result = run('INSERT INTO talent_followups (talent_id, user_id, type, content, next_action, next_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, type || 'note', content, next_action || null, next_date || null]);
    const followup = get('SELECT f.*, u.username FROM talent_followups f JOIN users u ON f.user_id = u.id WHERE f.id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: followup });
  } catch (err) {
    res.status(500).json({ error: '添加跟盯记录失败: ' + err.message });
  }
});

router.put('/:id/followups/:fid', authMiddleware, (req, res) => {
  try {
    const f = get('SELECT id FROM talent_followups WHERE id = ? AND talent_id = ?', [req.params.fid, req.params.id]);
    if (!f) return res.status(404).json({ error: '跟盯记录不存在' });
    const fields = ['type', 'content', 'next_action', 'next_date'];
    const updates = [];
    const values = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    values.push(req.params.fid);
    run(`UPDATE talent_followups SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT f.*, u.username FROM talent_followups f JOIN users u ON f.user_id = u.id WHERE f.id = ?', [req.params.fid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新跟盯记录失败: ' + err.message });
  }
});

router.delete('/:id/followups/:fid', authMiddleware, (req, res) => {
  try {
    run('DELETE FROM talent_followups WHERE id = ? AND talent_id = ?', [req.params.fid, req.params.id]);
    saveDb();
    res.json({ message: '跟盯记录已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除跟盯记录失败: ' + err.message });
  }
});

// ========== 论文 CRUD ==========

router.get('/:id/papers', authMiddleware, (req, res) => {
  try {
    const papers = all('SELECT * FROM talent_papers WHERE talent_id = ? ORDER BY year DESC, sort_order', [req.params.id]);
    res.json({ data: papers });
  } catch (err) { res.status(500).json({ error: '获取论文失败: ' + err.message }); }
});

router.post('/:id/papers', authMiddleware, (req, res) => {
  try {
    const { title, authors, abstract, venue, year, doi, arxiv_id, pdf_url, categories, citation_count, data_source, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: '论文标题为必填项' });
    const result = run(`INSERT INTO talent_papers (talent_id, title, authors, abstract, venue, year, doi, arxiv_id, pdf_url, categories, citation_count, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, title, authors || null, abstract || null, venue || null, year || null, doi || null, arxiv_id || null, pdf_url || null, categories || null, citation_count || 0, data_source || 'manual', sort_order || 0]);
    const paper = get('SELECT * FROM talent_papers WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: paper });
  } catch (err) { res.status(500).json({ error: '添加论文失败: ' + err.message }); }
});

router.put('/:id/papers/:pid', authMiddleware, (req, res) => {
  try {
    const fields = ['title', 'authors', 'abstract', 'venue', 'year', 'doi', 'arxiv_id', 'pdf_url', 'categories', 'citation_count', 'data_source', 'sort_order'];
    const updates = []; const values = [];
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.pid);
    run(`UPDATE talent_papers SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_papers WHERE id = ?', [req.params.pid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: '更新论文失败: ' + err.message }); }
});

router.delete('/:id/papers/:pid', authMiddleware, (req, res) => {
  try { run('DELETE FROM talent_papers WHERE id = ? AND talent_id = ?', [req.params.pid, req.params.id]); saveDb(); res.json({ message: '论文已删除' }); }
  catch (err) { res.status(500).json({ error: '删除论文失败: ' + err.message }); }
});

// ========== 专利 CRUD ==========

router.get('/:id/patents', authMiddleware, (req, res) => {
  try {
    const patents = all('SELECT * FROM talent_patents WHERE talent_id = ? ORDER BY filing_date DESC, sort_order', [req.params.id]);
    res.json({ data: patents });
  } catch (err) { res.status(500).json({ error: '获取专利失败: ' + err.message }); }
});

router.post('/:id/patents', authMiddleware, (req, res) => {
  try {
    const { title, patent_number, patent_type, status, filing_date, grant_date, inventors, assignee, abstract, data_source, sort_order } = req.body;
    if (!title) return res.status(400).json({ error: '专利标题为必填项' });
    const result = run(`INSERT INTO talent_patents (talent_id, title, patent_number, patent_type, status, filing_date, grant_date, inventors, assignee, abstract, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, title, patent_number || null, patent_type || null, status || null, filing_date || null, grant_date || null, inventors || null, assignee || null, abstract || null, data_source || 'manual', sort_order || 0]);
    const patent = get('SELECT * FROM talent_patents WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: patent });
  } catch (err) { res.status(500).json({ error: '添加专利失败: ' + err.message }); }
});

router.put('/:id/patents/:pid', authMiddleware, (req, res) => {
  try {
    const fields = ['title', 'patent_number', 'patent_type', 'status', 'filing_date', 'grant_date', 'inventors', 'assignee', 'abstract', 'data_source', 'sort_order'];
    const updates = []; const values = [];
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.pid);
    run(`UPDATE talent_patents SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_patents WHERE id = ?', [req.params.pid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: '更新专利失败: ' + err.message }); }
});

router.delete('/:id/patents/:pid', authMiddleware, (req, res) => {
  try { run('DELETE FROM talent_patents WHERE id = ? AND talent_id = ?', [req.params.pid, req.params.id]); saveDb(); res.json({ message: '专利已删除' }); }
  catch (err) { res.status(500).json({ error: '删除专利失败: ' + err.message }); }
});

// ========== 行业会议 CRUD ==========

router.get('/:id/conferences', authMiddleware, (req, res) => {
  try {
    const conferences = all('SELECT * FROM talent_conferences WHERE talent_id = ? ORDER BY year DESC, sort_order', [req.params.id]);
    res.json({ data: conferences });
  } catch (err) { res.status(500).json({ error: '获取会议记录失败: ' + err.message }); }
});

router.post('/:id/conferences', authMiddleware, (req, res) => {
  try {
    const { conference_name, role, title, year, location, url, data_source, sort_order } = req.body;
    if (!conference_name) return res.status(400).json({ error: '会议名称为必填项' });
    const result = run(`INSERT INTO talent_conferences (talent_id, conference_name, role, title, year, location, url, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, conference_name, role || null, title || null, year || null, location || null, url || null, data_source || 'manual', sort_order || 0]);
    const conf = get('SELECT * FROM talent_conferences WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: conf });
  } catch (err) { res.status(500).json({ error: '添加会议记录失败: ' + err.message }); }
});

router.put('/:id/conferences/:cid', authMiddleware, (req, res) => {
  try {
    const fields = ['conference_name', 'role', 'title', 'year', 'location', 'url', 'data_source', 'sort_order'];
    const updates = []; const values = [];
    for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } }
    if (updates.length === 0) return res.status(400).json({ error: '没有提供更新字段' });
    updates.push('updated_at = datetime("now", "+8 hours")');
    values.push(req.params.cid);
    run(`UPDATE talent_conferences SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_conferences WHERE id = ?', [req.params.cid]);
    saveDb();
    res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: '更新会议记录失败: ' + err.message }); }
});

router.delete('/:id/conferences/:cid', authMiddleware, (req, res) => {
  try { run('DELETE FROM talent_conferences WHERE id = ? AND talent_id = ?', [req.params.cid, req.params.id]); saveDb(); res.json({ message: '会议记录已删除' }); }
  catch (err) { res.status(500).json({ error: '删除会议记录失败: ' + err.message }); }
});

// ========== GitHub项目 CRUD ==========

router.get('/:id/repos', authMiddleware, (req, res) => {
  try { const repos = all('SELECT * FROM talent_github_repos WHERE talent_id = ? ORDER BY stars DESC, sort_order', [req.params.id]); res.json({ data: repos }); }
  catch (err) { res.status(500).json({ error: '获取GitHub项目失败: ' + err.message }); }
});

router.post('/:id/repos', authMiddleware, (req, res) => {
  try {
    const { repo_name, full_name, description, url, language, stars, forks, open_issues, is_fork, topics, license, last_pushed_at, data_source, sort_order } = req.body;
    if (!repo_name) return res.status(400).json({ error: '项目名称为必填项' });
    const result = run(`INSERT INTO talent_github_repos (talent_id, repo_name, full_name, description, url, language, stars, forks, open_issues, is_fork, topics, license, last_pushed_at, data_source, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, repo_name, full_name || null, description || null, url || null, language || null, stars || 0, forks || 0, open_issues || 0, is_fork || 0, topics || null, license || null, last_pushed_at || null, data_source || 'manual', sort_order || 0]);
    const repo = get('SELECT * FROM talent_github_repos WHERE id = ?', [result.lastInsertRowid]);
    saveDb(); res.status(201).json({ data: repo });
  } catch (err) { res.status(500).json({ error: '添加GitHub项目失败: ' + err.message }); }
});

router.put('/:id/repos/:rid', authMiddleware, (req, res) => {
  try {
    const fields = ['repo_name', 'full_name', 'description', 'url', 'language', 'stars', 'forks', 'open_issues', 'is_fork', 'topics', 'license', 'last_pushed_at', 'data_source', 'sort_order'];
    const updates = []; const values = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); } });
    if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
    updates.push("updated_at = datetime('now', '+8 hours')");
    values.push(req.params.rid);
    run(`UPDATE talent_github_repos SET ${updates.join(', ')} WHERE id = ?`, values);
    const updated = get('SELECT * FROM talent_github_repos WHERE id = ?', [req.params.rid]);
    saveDb(); res.json({ data: updated });
  } catch (err) { res.status(500).json({ error: '更新GitHub项目失败: ' + err.message }); }
});

router.delete('/:id/repos/:rid', authMiddleware, (req, res) => {
  try { run('DELETE FROM talent_github_repos WHERE id = ? AND talent_id = ?', [req.params.rid, req.params.id]); saveDb(); res.json({ message: 'GitHub项目已删除' }); }
  catch (err) { res.status(500).json({ error: '删除GitHub项目失败: ' + err.message }); }
});

module.exports = router;
