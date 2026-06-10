const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'wasai-talent.db');

let db = null;
let saveTimeout = null;

function saveDb() {
  if (!db) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('保存数据库失败:', err.message);
    }
  }, 300);
}

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON;');
  return db;
}

// Helper: run a query and return { lastInsertRowid, changes }
function run(stmt, params) {
  db.run(stmt, params);
  const res = db.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = res.length > 0 ? res[0].values[0][0] : 0;
  return { lastInsertRowid };
}

// Helper: get single row
function get(stmt, params) {
  const res = db.exec(stmt, params || []);
  if (!res.length || !res[0].values.length) return null;
  const columns = res[0].columns;
  const values = res[0].values[0];
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj;
}

// Helper: get all rows
function all(stmt, params) {
  const res = db.exec(stmt, params || []);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function initDatabase() {
  const database = await getDb();

  // 用户表
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
    );
  `);

  // 人才主表 — data_source为数据来源, import_method为导入方式
  database.run(`
    CREATE TABLE IF NOT EXISTS talents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      title TEXT,
      location TEXT,
      skills TEXT,
      education TEXT,
      experience_years INTEGER,
      summary TEXT,
      data_source TEXT DEFAULT 'manual',
      import_method TEXT DEFAULT 'manual',
      tags TEXT,
      rating INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      avatar_url TEXT,
      raw_data TEXT,
      open_to_work TEXT,
      suitable_roles TEXT,
      homepage TEXT,
      github_url TEXT,
      google_scholar_url TEXT,
      gender TEXT,
      expected_salary TEXT,
      job_preference TEXT,
      wechat TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // 为已有数据库添加新字段
  const newTalentColumns = [
    'open_to_work TEXT', 'suitable_roles TEXT', 'homepage TEXT',
    'github_url TEXT', 'google_scholar_url TEXT', 'gender TEXT',
    'expected_salary TEXT', 'job_preference TEXT', 'wechat TEXT'
  ];
  for (const col of newTalentColumns) {
    try { database.run(`ALTER TABLE talents ADD COLUMN ${col}`); } catch (e) { /* column already exists */ }
  }

  // 人才平台档案表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      platform_id TEXT,
      platform_url TEXT,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      company TEXT,
      location TEXT,
      email TEXT,
      title TEXT,
      raw_data TEXT,
      synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  try { database.run('ALTER TABLE talent_profiles ADD COLUMN title TEXT'); } catch (e) { /* column already exists */ }

  // 人才关联/合并表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_merges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      primary_talent_id INTEGER NOT NULL,
      merged_talent_id INTEGER NOT NULL,
      match_type TEXT DEFAULT 'manual',
      match_confidence REAL DEFAULT 1.0,
      matched_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (primary_talent_id) REFERENCES talents(id) ON DELETE CASCADE,
      FOREIGN KEY (merged_talent_id) REFERENCES talents(id) ON DELETE CASCADE,
      FOREIGN KEY (matched_by) REFERENCES users(id)
    );
  `);

  // 工作经历表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      company TEXT,
      title TEXT,
      start_date TEXT,
      end_date TEXT,
      duration TEXT,
      location TEXT,
      responsibilities TEXT,
      achievements TEXT,
      is_current INTEGER DEFAULT 0,
      description TEXT,
      company_details TEXT,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // 教育经历表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_educations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      school TEXT,
      degree TEXT,
      field TEXT,
      start_date TEXT,
      end_date TEXT,
      dates TEXT,
      location TEXT,
      ranking_info TEXT,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // 备注表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // API密钥表
  database.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_hash TEXT NOT NULL,
      name TEXT,
      permissions TEXT DEFAULT 'read',
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 跟盯记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'note',
      content TEXT NOT NULL,
      next_action TEXT,
      next_date TEXT,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 论文发表表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      abstract TEXT,
      venue TEXT,
      year INTEGER,
      doi TEXT,
      arxiv_id TEXT,
      pdf_url TEXT,
      categories TEXT,
      citation_count INTEGER DEFAULT 0,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // 专利表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_patents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      patent_number TEXT,
      patent_type TEXT,
      status TEXT,
      filing_date TEXT,
      grant_date TEXT,
      inventors TEXT,
      assignee TEXT,
      abstract TEXT,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // 行业会议参与表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_conferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      conference_name TEXT NOT NULL,
      role TEXT,
      title TEXT,
      year INTEGER,
      location TEXT,
      url TEXT,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // GitHub项目表
  database.run(`
    CREATE TABLE IF NOT EXISTS talent_github_repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      talent_id INTEGER NOT NULL,
      repo_name TEXT NOT NULL,
      full_name TEXT,
      description TEXT,
      url TEXT,
      language TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      open_issues INTEGER DEFAULT 0,
      is_fork INTEGER DEFAULT 0,
      topics TEXT,
      license TEXT,
      last_pushed_at TEXT,
      data_source TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', '+8 hours')),
      updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
      FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
    );
  `);

  // 创建默认管理员
  const adminExists = get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    database.run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@wasai-talent.com', hash, 'admin']);
    console.log('默认管理员已创建: admin / admin123');
  }

  saveDb();
  console.log('数据库初始化完成');
  return database;
}

module.exports = { getDb, initDatabase, saveDb, run, get, all };
