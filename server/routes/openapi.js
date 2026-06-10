const express = require('express');
const { get, all, run, saveDb } = require('../models/database');
const { apiKeyMiddleware } = require('../middleware/auth');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(apiKeyMiddleware);

// ========== 通用人才操作 ==========

// 获取人才列表
router.get('/talents', (req, res) => {
  try {
    const { search, data_source, import_method, limit = 100, offset = 0 } = req.query;
    let whereClauses = [];
    let params = [];
    if (search) {
      whereClauses.push('(name LIKE ? OR email LIKE ? OR company LIKE ? OR skills LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (data_source) { whereClauses.push('data_source = ?'); params.push(data_source); }
    if (import_method) { whereClauses.push('import_method = ?'); params.push(import_method); }
    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    const talents = all(`SELECT * FROM talents ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    res.json({ data: talents });
  } catch (err) {
    res.status(500).json({ error: '获取人才列表失败: ' + err.message });
  }
});

// 获取单个人才
router.get('/talents/:id', (req, res) => {
  try {
    const talent = get('SELECT * FROM talents WHERE id = ?', [req.params.id]);
    if (!talent) return res.status(404).json({ error: '人才信息不存在' });
    const profiles = all('SELECT * FROM talent_profiles WHERE talent_id = ?', [req.params.id]);
    res.json({ data: talent, profiles });
  } catch (err) {
    res.status(500).json({ error: '获取人才详情失败: ' + err.message });
  }
});

// 创建人才
router.post('/talents', (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: '姓名为必填项' });
    const result = run(`
      INSERT INTO talents (name, email, phone, company, title, location, skills, education,
        experience_years, summary, data_source, import_method, tags, rating, status, avatar_url, raw_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.name, data.email || null, data.phone || null, data.company || null,
      data.title || null, data.location || null, data.skills || null,
      data.education || null, data.experience_years || null, data.summary || null,
      data.data_source || 'api', data.import_method || 'api', data.tags || null,
      data.rating || 0, data.status || 'active', data.avatar_url || null, data.raw_data || null, req.user.id]);
    const talent = get('SELECT * FROM talents WHERE id = ?', [result.lastInsertRowid]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: '创建人才信息失败: ' + err.message });
  }
});

// ========== GitHub 专用导入 ==========

router.post('/import/github', (req, res) => {
  try {
    const gh = req.body;
    if (!gh.login && !gh.name) return res.status(400).json({ error: '需要login或name字段' });

    const name = gh.name || gh.login;
    const company = gh.company || null;
    const location = gh.location || null;
    const email = gh.email || null;
    const bio = gh.bio || null;
    const avatarUrl = gh.avatar_url || null;
    const htmlUrl = gh.html_url || `https://github.com/${gh.login}`;
    const rawData = JSON.stringify(gh);

    const result = run(`
      INSERT INTO talents (name, email, company, location, summary, data_source, import_method, avatar_url, raw_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, email, company, location, bio, 'github', 'api', avatarUrl, rawData, req.user.id]);

    const talentId = result.lastInsertRowid;

    run(`
      INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, avatar_url, bio, company, location, email, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [talentId, 'github', String(gh.id || ''), htmlUrl, gh.login || null, name, avatarUrl, bio, company, location, email, rawData]);

    const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: 'GitHub导入失败: ' + err.message });
  }
});

router.post('/import/github/batch', (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ error: '请提供GitHub用户数组' });

    let imported = 0;
    let errors = [];
    for (let i = 0; i < users.length; i++) {
      try {
        const gh = users[i];
        if (!gh.login && !gh.name) { errors.push({ index: i, error: '缺少login/name' }); continue; }
        const name = gh.name || gh.login;
        const rawData = JSON.stringify(gh);
        const result = run(`
          INSERT INTO talents (name, email, company, location, summary, data_source, import_method, avatar_url, raw_data, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, gh.email || null, gh.company || null, gh.location || null, gh.bio || null,
          'github', 'api', gh.avatar_url || null, rawData, req.user.id]);
        run(`
          INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, avatar_url, bio, company, location, email, raw_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [result.lastInsertRowid, 'github', String(gh.id || ''), gh.html_url || `https://github.com/${gh.login}`,
          gh.login || null, name, gh.avatar_url || null, gh.bio || null, gh.company || null, gh.location || null, gh.email || null, rawData]);
        imported++;
      } catch (e) { errors.push({ index: i, error: e.message }); }
    }
    saveDb();
    res.json({ data: { imported, errors } });
  } catch (err) {
    res.status(500).json({ error: '批量导入失败: ' + err.message });
  }
});

// ========== 脉脉专用导入 ==========

router.post('/import/maimai', (req, res) => {
  try {
    const mm = req.body;
    if (mm.basic_info && mm.basic_info.name) {
      const bi = mm.basic_info;
      const name = bi.name;
      const company = bi.current_company || null;
      const position = bi.current_position || null;
      const location = [bi.location && bi.location.province, bi.location && bi.location.city].filter(Boolean).join(' ') || null;
      const tagList = bi.tags ? (Array.isArray(bi.tags) ? bi.tags.join(',') : bi.tags) : null;
      const educationLevel = bi.education_level || null;
      const experienceYears = bi.total_work_experience_years || null;
      const gender = bi.gender || null;
      const expectedSalary = bi.expected_salary || null;
      const jobPreference = bi.job_preference || null;
      const avatarUrl = (mm.links && mm.links.avatar_url) || null;
      const profileUrl = (mm.links && mm.links.profile_url) || null;
      const profileId = mm.profile_id ? String(mm.profile_id) : null;
      const rawData = JSON.stringify(mm);

      let summary = '';
      if (bi.major) summary += `专业: ${bi.major}`;

      const result = run(`
        INSERT INTO talents (name, company, title, location, skills, education, experience_years, summary,
          data_source, import_method, avatar_url, raw_data, tags, gender, expected_salary, job_preference, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, company, position, location, tagList, educationLevel, experienceYears, summary || null,
        'maimai', 'api', avatarUrl, rawData, tagList, gender, expectedSalary, jobPreference, req.user.id]);

      const talentId = result.lastInsertRowid;

      run(`
        INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, display_name, avatar_url, company, title, location, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [talentId, 'maimai', profileId, profileUrl, name, avatarUrl, company, position, location, rawData]);

      if (mm.work_history && Array.isArray(mm.work_history)) {
        for (let i = 0; i < mm.work_history.length; i++) {
          const wh = mm.work_history[i];
          const whLocation = (wh.company_details && wh.company_details.location) || null;
          const whCompanyDetails = wh.company_details ? JSON.stringify(wh.company_details) : null;
          run(`
            INSERT INTO talent_experiences (talent_id, company, title, start_date, end_date, duration, location, is_current, description, company_details, data_source, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [talentId, wh.company || null, wh.position || null, wh.start_date || null, wh.end_date || null,
            wh.duration || null, whLocation, wh.is_current ? 1 : 0, wh.description || null, whCompanyDetails, 'maimai', i]);
        }
      }

      if (mm.education_history && Array.isArray(mm.education_history)) {
        for (let i = 0; i < mm.education_history.length; i++) {
          const eh = mm.education_history[i];
          const ehRankingInfo = eh.ranking_info ? JSON.stringify(eh.ranking_info) : null;
          run(`
            INSERT INTO talent_educations (talent_id, school, degree, field, dates, location, ranking_info, data_source, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [talentId, eh.school || null, eh.level || null, eh.department || null,
            eh.duration || null, eh.location || null, ehRankingInfo, 'maimai', i]);
        }
      }

      const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
      saveDb();
      res.status(201).json({ data: talent });
    } else {
      if (!mm.name) return res.status(400).json({ error: '需要name字段' });
      const name = mm.name;
      const company = mm.company || null;
      const position = mm.position || null;
      const city = mm.city || null;
      const province = mm.province || null;
      const location = [province, city].filter(Boolean).join(' ') || null;
      const avatarUrl = mm.avatar || null;
      const detailUrl = mm.detail_url || null;
      const sdegree = mm.sdegree || null;
      const school = mm.school || null;
      const worktime = mm.worktime || null;
      const salary = mm.salary || null;
      const tagList = mm.tag_list ? (Array.isArray(mm.tag_list) ? mm.tag_list.join(',') : mm.tag_list) : null;
      const rawData = JSON.stringify(mm);

      let summary = '';
      if (sdegree && school) summary += `${sdegree} - ${school}`;
      if (worktime) summary += (summary ? '；' : '') + `工作${worktime}`;
      if (salary) summary += (summary ? '；' : '') + `薪资: ${salary}`;

      const result = run(`
        INSERT INTO talents (name, company, title, location, skills, education, summary, data_source, import_method, avatar_url, raw_data, tags, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, company, position, location, tagList, sdegree, summary || null,
        'maimai', 'api', avatarUrl, rawData, tagList, req.user.id]);

      const talentId = result.lastInsertRowid;

      run(`
        INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, display_name, avatar_url, bio, company, location, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [talentId, 'maimai', String(mm.id || ''), detailUrl, mm.byname || name, avatarUrl, summary || null, company, location, rawData]);

      const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
      saveDb();
      res.status(201).json({ data: talent });
    }
  } catch (err) {
    res.status(500).json({ error: '脉脉导入失败: ' + err.message });
  }
});

router.post('/import/maimai/batch', (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ error: '请提供脉脉用户数组' });
    let imported = 0;
    let errors = [];
    for (let i = 0; i < users.length; i++) {
      try {
        const mm = users[i];
        if (!mm.name) { errors.push({ index: i, error: '缺少name' }); continue; }
        const location = [mm.province, mm.city].filter(Boolean).join(' ') || null;
        const tagList = mm.tag_list ? (Array.isArray(mm.tag_list) ? mm.tag_list.join(',') : mm.tag_list) : null;
        const rawData = JSON.stringify(mm);
        let summary = '';
        if (mm.sdegree && mm.school) summary += `${mm.sdegree} - ${mm.school}`;
        if (mm.worktime) summary += (summary ? '；' : '') + `工作${mm.worktime}`;
        const result = run(`
          INSERT INTO talents (name, company, title, location, skills, education, summary, data_source, import_method, avatar_url, raw_data, tags, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [mm.name, mm.company || null, mm.position || null, location, tagList, mm.sdegree || null,
          summary || null, 'maimai', 'api', mm.avatar || null, rawData, tagList, req.user.id]);
        run(`
          INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, display_name, avatar_url, bio, company, location, raw_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [result.lastInsertRowid, 'maimai', String(mm.id || ''), mm.detail_url || null,
          mm.byname || mm.name, mm.avatar || null, summary || null, mm.company || null, location, rawData]);
        imported++;
      } catch (e) { errors.push({ index: i, error: e.message }); }
    }
    saveDb();
    res.json({ data: { imported, errors } });
  } catch (err) {
    res.status(500).json({ error: '批量导入失败: ' + err.message });
  }
});

// ========== LinkedIn 导入 ==========

router.post('/import/linkedin', (req, res) => {
  try {
    const data = req.body;
    if (data.experience || data.education || (data.name && (data.company || data.title || data.location))) {
      const name = data.name || '未知';
      const company = data.company || (data.experience && data.experience[0] && data.experience[0].company) || null;
      const title = data.title || data.position || (data.experience && data.experience[0] && data.experience[0].title) || null;
      const location = data.location || null;
      const skills = data.skills ? (Array.isArray(data.skills) ? data.skills.join(',') : data.skills) : null;
      const summary = data.summary || null;
      const email = data.email || null;
      const phone = data.phone || null;
      const openToWork = data.open_to_work || null;
      const suitableRoles = data.suitable_job_roles ? (Array.isArray(data.suitable_job_roles) ? data.suitable_job_roles.join(',') : data.suitable_job_roles) : null;
      const homepage = data.homepage || null;
      const githubUrl = data.github || null;
      const googleScholarUrl = data.google_scholar || null;
      const linkedinUrl = data.linkedin || null;
      const rawData = JSON.stringify(data);

      const result = run(`
        INSERT INTO talents (name, email, phone, company, title, location, skills, summary,
          data_source, import_method, raw_data, open_to_work, suitable_roles, homepage, github_url, google_scholar_url, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, email, phone, company, title, location, skills, summary,
        'linkedin', 'api', rawData, openToWork, suitableRoles, homepage, githubUrl, googleScholarUrl, req.user.id]);

      const talentId = result.lastInsertRowid;

      run(`
        INSERT INTO talent_profiles (talent_id, platform, platform_url, display_name, title, company, location, email, bio, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [talentId, 'linkedin', linkedinUrl, name, title, company, location, email, data.bio_summary || summary, rawData]);

      if (data.experience && Array.isArray(data.experience)) {
        for (let i = 0; i < data.experience.length; i++) {
          const exp = data.experience[i];
          const pos = exp.positions && exp.positions[0] || {};
          run(`
            INSERT INTO talent_experiences (talent_id, company, title, start_date, end_date, duration, location, responsibilities, achievements, data_source, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [talentId, exp.company || null, exp.title || null,
            pos.start_date || null, pos.end_date || null, exp.duration || null,
            pos.location || null,
            pos.responsibilities ? JSON.stringify(pos.responsibilities) : null,
            pos.achievements ? JSON.stringify(pos.achievements) : null,
            'linkedin', i]);
        }
      }

      if (data.education && Array.isArray(data.education)) {
        for (let i = 0; i < data.education.length; i++) {
          const edu = data.education[i];
          run(`
            INSERT INTO talent_educations (talent_id, school, degree, field, dates, data_source, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [talentId, edu.school || null, edu.degree || null, edu.field || null,
            edu.dates || null, 'linkedin', i]);
        }
      }

      const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
      saveDb();
      res.status(201).json({ data: talent });
    } else {
      const { name, raw_text, email, company, title, location, linkedin_url } = data;
      if (!name && !raw_text) return res.status(400).json({ error: '需要name或raw_text字段' });
      const result = run(`
        INSERT INTO talents (name, email, company, title, location, summary, data_source, import_method, raw_data, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name || '未知', email || null, company || null, title || null, location || null,
        raw_text ? 'LinkedIn简历原文，待解析' : null, 'linkedin', 'api', raw_text || null, req.user.id]);
      const talentId = result.lastInsertRowid;
      if (linkedin_url) {
        run(`INSERT INTO talent_profiles (talent_id, platform, platform_url, display_name) VALUES (?, ?, ?, ?)`,
          [talentId, 'linkedin', linkedin_url, name || null]);
      }
      const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
      saveDb();
      res.status(201).json({ data: talent });
    }
  } catch (err) {
    res.status(500).json({ error: 'LinkedIn导入失败: ' + err.message });
  }
});

// ========== CSV 通用导入/导出 ==========

router.post('/talents/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传CSV文件' });
    parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true }, (err, output) => {
      if (err) return res.status(400).json({ error: 'CSV解析失败: ' + err.message });
      let imported = 0;
      let errors = [];
      for (let i = 0; i < output.length; i++) {
        try {
          const row = output[i];
          if (!row.name) { errors.push({ row: i + 1, error: '姓名为空' }); continue; }
          run(`INSERT INTO talents (name, email, phone, company, title, location, skills, education,
            experience_years, summary, data_source, import_method, tags, rating, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            row.name, row.email || null, row.phone || null, row.company || null,
            row.title || null, row.location || null, row.skills || null,
            row.education || null, row.experience_years ? parseInt(row.experience_years) : null,
            row.summary || null, row.data_source || 'csv', 'csv_import',
            row.tags || null, row.rating ? parseInt(row.rating) : 0, row.status || 'active', req.user.id]);
          imported++;
        } catch (e) { errors.push({ row: i + 1, error: e.message }); }
      }
      saveDb();
      res.json({ data: { imported, errors } });
    });
  } catch (err) {
    res.status(500).json({ error: '导入失败: ' + err.message });
  }
});

router.get('/talents/export', (req, res) => {
  try {
    const talents = all('SELECT * FROM talents ORDER BY created_at DESC', []);
    const columns = ['id', 'name', 'email', 'phone', 'company', 'title', 'location',
      'skills', 'education', 'experience_years', 'summary', 'data_source', 'import_method',
      'tags', 'rating', 'status', 'created_at'];
    stringify(talents, { header: true, columns }, (err, output) => {
      if (err) return res.status(500).json({ error: 'CSV生成失败' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=talents-export.csv');
      res.send(output);
    });
  } catch (err) {
    res.status(500).json({ error: '导出失败: ' + err.message });
  }
});

// ========== JSON 通用批量导入 ==========

router.post('/talents/batch', (req, res) => {
  try {
    const { talents } = req.body;
    if (!Array.isArray(talents) || talents.length === 0) return res.status(400).json({ error: '请提供人才数据数组' });
    let imported = 0;
    let errors = [];
    for (let i = 0; i < talents.length; i++) {
      try {
        const d = talents[i];
        if (!d.name) { errors.push({ index: i, error: '姓名为空' }); continue; }
        run(`INSERT INTO talents (name, email, phone, company, title, location, skills, education,
          experience_years, summary, data_source, import_method, tags, rating, status, avatar_url, raw_data, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          d.name, d.email || null, d.phone || null, d.company || null,
          d.title || null, d.location || null, d.skills || null,
          d.education || null, d.experience_years || null, d.summary || null,
          d.data_source || 'api', d.import_method || 'api', d.tags || null,
          d.rating || 0, d.status || 'active', d.avatar_url || null, d.raw_data || null, req.user.id]);
        imported++;
      } catch (e) { errors.push({ index: i, error: e.message }); }
    }
    saveDb();
    res.json({ data: { imported, errors } });
  } catch (err) {
    res.status(500).json({ error: '批量导入失败: ' + err.message });
  }
});

// ========== 人才关联 ==========

router.post('/talents/merge', (req, res) => {
  try {
    const { primary_talent_id, merged_talent_id, match_type, match_confidence } = req.body;
    if (!primary_talent_id || !merged_talent_id) return res.status(400).json({ error: '需要提供两个人才ID' });
    if (primary_talent_id === merged_talent_id) return res.status(400).json({ error: '不能关联同一个人' });
    const existing = get(`SELECT id FROM talent_merges WHERE (primary_talent_id = ? AND merged_talent_id = ?) OR (primary_talent_id = ? AND merged_talent_id = ?)`,
      [primary_talent_id, merged_talent_id, merged_talent_id, primary_talent_id]);
    if (existing) return res.status(409).json({ error: '关联已存在' });
    const result = run('INSERT INTO talent_merges (primary_talent_id, merged_talent_id, match_type, match_confidence, matched_by) VALUES (?, ?, ?, ?, ?)',
      [primary_talent_id, merged_talent_id, match_type || 'api', match_confidence || 1.0, req.user.id]);
    saveDb();
    res.status(201).json({ data: { id: result.lastInsertRowid, primary_talent_id, merged_talent_id } });
  } catch (err) {
    res.status(500).json({ error: '关联失败: ' + err.message });
  }
});

// ========== 微信渠道导入 ==========

router.post('/import/wechat', (req, res) => {
  try {
    const data = req.body;
    if (!data.name && !data.nickname) return res.status(400).json({ error: '需要name或nickname字段' });
    const name = data.name || data.nickname;
    const wechat = data.wechat_id || data.wechat || data.username || null;
    const company = data.company || null;
    const title = data.title || data.position || null;
    const location = data.location || data.city || null;
    const phone = data.phone || null;
    const email = data.email || null;
    const avatarUrl = data.avatar_url || data.head_img_url || null;
    const tagList = data.tags ? (Array.isArray(data.tags) ? data.tags.join(',') : data.tags) : null;
    const rawData = JSON.stringify(data);

    const result = run(`
      INSERT INTO talents (name, email, phone, company, title, location, skills, wechat,
        data_source, import_method, avatar_url, raw_data, tags, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, email || null, phone || null, company, title, location, tagList, wechat,
      'wechat', 'api', avatarUrl, rawData, tagList, req.user.id]);

    const talentId = result.lastInsertRowid;

    run(`INSERT INTO talent_profiles (talent_id, platform, platform_url, display_name, avatar_url, company, title, location, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [talentId, 'wechat', data.profile_url || null, name, avatarUrl, company, title, location, rawData]);

    const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: '微信导入失败: ' + err.message });
  }
});

router.post('/import/wechat/batch', (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) return res.status(400).json({ error: '请提供微信联系人数组' });
    let imported = 0; let errors = [];
    for (let i = 0; i < contacts.length; i++) {
      try {
        const data = contacts[i];
        if (!data.name && !data.nickname) { errors.push({ index: i, error: '缺少name/nickname' }); continue; }
        const name = data.name || data.nickname;
        const wechat = data.wechat_id || data.wechat || data.username || null;
        const tagList = data.tags ? (Array.isArray(data.tags) ? data.tags.join(',') : data.tags) : null;
        const rawData = JSON.stringify(data);
        const result = run(`INSERT INTO talents (name, email, phone, company, title, location, skills, wechat, data_source, import_method, avatar_url, raw_data, tags, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, data.email || null, data.phone || null, data.company || null, data.title || data.position || null,
            data.location || data.city || null, tagList, wechat, 'wechat', 'api', data.avatar_url || null, rawData, tagList, req.user.id]);
        run(`INSERT INTO talent_profiles (talent_id, platform, display_name, avatar_url, company, title, raw_data)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [result.lastInsertRowid, 'wechat', name, data.avatar_url || null, data.company || null, data.title || null, rawData]);
        imported++;
      } catch (e) { errors.push({ index: i, error: e.message }); }
    }
    saveDb();
    res.json({ data: { imported, errors } });
  } catch (err) { res.status(500).json({ error: '微信批量导入失败: ' + err.message }); }
});

// ========== 论文渠道导入 (arXiv格式) ==========

router.post('/import/arxiv', (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: '需要name字段(作者姓名)' });
    const name = data.name;
    const email = data.email || null;
    const company = data.affiliation || data.institution || null;
    const skills = data.categories ? (Array.isArray(data.categories) ? data.categories.join(',') : data.categories) : null;
    const homepage = data.homepage || null;
    const googleScholarUrl = data.google_scholar || null;
    const rawData = JSON.stringify(data);

    const result = run(`INSERT INTO talents (name, email, company, skills, homepage, google_scholar_url, data_source, import_method, raw_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, company, skills, homepage, googleScholarUrl, 'arxiv', 'api', rawData, req.user.id]);

    const talentId = result.lastInsertRowid;

    run(`INSERT INTO talent_profiles (talent_id, platform, platform_url, display_name, company, raw_data)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [talentId, 'arxiv', data.arxiv_profile_url || null, name, company, rawData]);

    if (data.papers && Array.isArray(data.papers)) {
      for (let i = 0; i < data.papers.length; i++) {
        const p = data.papers[i];
        run(`INSERT INTO talent_papers (talent_id, title, authors, abstract, venue, year, doi, arxiv_id, pdf_url, categories, citation_count, data_source, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [talentId, p.title || 'Untitled', p.authors ? (Array.isArray(p.authors) ? p.authors.join(', ') : p.authors) : null,
            p.abstract || p.summary || null, p.venue || p.journal || null, p.year || p.published_year || null,
            p.doi || null, p.arxiv_id || p.id || null, p.pdf_url || null,
            p.categories ? (Array.isArray(p.categories) ? p.categories.join(',') : p.categories) : null,
            p.citation_count || 0, 'arxiv', i]);
      }
    }

    const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: 'arXiv导入失败: ' + err.message });
  }
});

// ========== 专利渠道导入 ==========

router.post('/import/patent', (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: '需要name字段(发明人姓名)' });
    const name = data.name;
    const company = data.company || data.assignee || null;
    const rawData = JSON.stringify(data);

    const result = run(`INSERT INTO talents (name, company, data_source, import_method, raw_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?)`, [name, company, 'patent', 'api', rawData, req.user.id]);
    const talentId = result.lastInsertRowid;

    run(`INSERT INTO talent_profiles (talent_id, platform, display_name, company, raw_data) VALUES (?, ?, ?, ?, ?)`,
      [talentId, 'patent', name, company, rawData]);

    if (data.patents && Array.isArray(data.patents)) {
      for (let i = 0; i < data.patents.length; i++) {
        const p = data.patents[i];
        run(`INSERT INTO talent_patents (talent_id, title, patent_number, patent_type, status, filing_date, grant_date, inventors, assignee, abstract, data_source, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [talentId, p.title || 'Untitled', p.patent_number || p.number || null, p.patent_type || p.type || null,
            p.status || null, p.filing_date || null, p.grant_date || null,
            p.inventors ? (Array.isArray(p.inventors) ? p.inventors.join(', ') : p.inventors) : null,
            p.assignee || company, p.abstract || null, 'patent', i]);
      }
    }

    const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: '专利导入失败: ' + err.message });
  }
});

// ========== 行业会议渠道导入 ==========

router.post('/import/conference', (req, res) => {
  try {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: '需要name字段(参会人姓名)' });
    const name = data.name;
    const company = data.company || data.affiliation || null;
    const title = data.title || null;
    const email = data.email || null;
    const rawData = JSON.stringify(data);

    const result = run(`INSERT INTO talents (name, email, company, title, data_source, import_method, raw_data, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [name, email, company, title, 'conference', 'api', rawData, req.user.id]);
    const talentId = result.lastInsertRowid;

    run(`INSERT INTO talent_profiles (talent_id, platform, display_name, company, title, raw_data) VALUES (?, ?, ?, ?, ?, ?)`,
      [talentId, 'conference', name, company, title, rawData]);

    if (data.conferences && Array.isArray(data.conferences)) {
      for (let i = 0; i < data.conferences.length; i++) {
        const c = data.conferences[i];
        run(`INSERT INTO talent_conferences (talent_id, conference_name, role, title, year, location, url, data_source, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [talentId, c.conference_name || c.name || 'Unknown', c.role || null, c.title || null,
            c.year || null, c.location || null, c.url || null, 'conference', i]);
      }
    }

    const talent = get('SELECT * FROM talents WHERE id = ?', [talentId]);
    saveDb();
    res.status(201).json({ data: talent });
  } catch (err) {
    res.status(500).json({ error: '会议导入失败: ' + err.message });
  }
});

module.exports = router;
