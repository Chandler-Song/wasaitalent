/**
 * WasaiTalent 测试数据初始化脚本
 * 生成 100 条覆盖各种场景的测试数据
 * 用法: cd server && node scripts/seed-test-data.js [--clear]
 *   --clear  先清空已有测试数据再插入
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDatabase, run, get, all, saveDb } = require('../models/database');

const CLEAR = process.argv.includes('--clear');

// ==================== 基础数据池 ====================

const SURNAMES = ['张','李','王','赵','刘','陈','杨','黄','周','吴','徐','孙','马','朱','胡','郭','何','林','罗','高','梁','郑','谢','韩','唐','冯','于','董','萧','程','曹','袁','邓','许','傅','沈','曾','彭','吕','苏','卢','蒋','蔡','贾','丁','魏','薛','叶','阎','余','潘','杜','戴','夏','钟','汪','田','任','姜','范','方','石','姚','谭','廖','邹','熊','金','陆','郝','孔','白','崔','康','毛','邱','秦','江','史','顾','侯','邵','龙','万','段','雷','钱'];
const GIVEN_NAMES = ['伟','芳','娜','秀英','敏','静','丽','强','磊','洋','勇','艳','杰','军','峰','超','明','霞','平','刚','桂英','文','华','军','玲','婷','宇','飞','鑫','浩','凯','鹏','俊','晨','辰','睿','琳','博','宁','乐','薇','欣','悦','佳','雪','冰','旭','辉','阳','帆','宏','松','岩','柏','涛','彬','斌','翔','威','毅','豪','哲','瀚','渊','泽','然','恒','嘉','瑞','思','雨','晓','梦','紫','萱','昊','天','元','子','小','一','若','云','诗','妍','彤','倩','蕊','璐','璇','颖','蕾','佳','怡','瑾','萱'];
const EN_FIRST = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Nancy','Daniel','Lisa','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Emily','Paul','Donna','Andrew','Michelle','Joshua','Dorothy','Kenneth','Carol','Kevin','Amanda','Brian','Melissa','George','Deborah','Timothy','Stephanie','Wei','Lei','Chen','Jing','Yong','Fang','Tao','Min','Xin','Hui','Lin','Qing','Jun','Ying','Ping','Ling','Hong','Bin','Zhen','Yi','Xiao','Rui','Hao','Kai','Zhi','Wen','Na','Bo','Peng','Fei','Gang','Qiang','Ming','Xia','Yan','Chao','Feng','Di','Shen','Zheng','Han','Sun','Ma'];
const EN_LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Chen','Wang','Li','Zhang','Liu','Yang','Huang','Wu','Zhou','Xu','Sun','Ma','Zhu','Hu','Lin','Guo','He','Luo','Zheng','Tang','Xie','Han','Feng','Deng','Cao','Peng','Zeng','Xiao','Cheng','Shi','Ren','Yu','Pan','Du','Dai','Xia','Zhong','Wei','Tian','Dong','Yuan','Lv','Su','Jiang','Cai','Jia','Ding','Shen','Qiu','Qin','Tan','Lu','Fan','Meng','Wen','Song','Fu','Zou','Xiong','Jin','Lu','Cui','Kang','Mao','Bai','Ge','Long','Duan'];

const COMPANIES = [
  { name: '华为技术有限公司', loc: '深圳', type: 'tech' },
  { name: '腾讯科技', loc: '深圳', type: 'tech' },
  { name: '字节跳动', loc: '北京', type: 'tech' },
  { name: '阿里巴巴集团', loc: '杭州', type: 'tech' },
  { name: '百度在线', loc: '北京', type: 'tech' },
  { name: '京东科技', loc: '北京', type: 'ecommerce' },
  { name: '美团', loc: '北京', type: 'tech' },
  { name: '网易', loc: '杭州', type: 'tech' },
  { name: '小米科技', loc: '北京', type: 'tech' },
  { name: '快手科技', loc: '北京', type: 'tech' },
  { name: '微软亚洲研究院', loc: '北京', type: 'research' },
  { name: 'Google中国', loc: '北京', type: 'tech' },
  { name: '亚马逊中国', loc: '上海', type: 'tech' },
  { name: '苹果中国', loc: '上海', type: 'tech' },
  { name: '特斯拉中国', loc: '上海', type: 'auto' },
  { name: '商汤科技', loc: '北京', type: 'ai' },
  { name: '旷视科技', loc: '北京', type: 'ai' },
  { name: '科大讯飞', loc: '合肥', type: 'ai' },
  { name: '寒武纪', loc: '北京', type: 'chip' },
  { name: '大疆创新', loc: '深圳', type: 'drone' },
  { name: '比亚迪', loc: '深圳', type: 'auto' },
  { name: '宁德时代', loc: '宁德', type: 'energy' },
  { name: '中兴通讯', loc: '深圳', type: 'telecom' },
  { name: '联想集团', loc: '北京', type: 'tech' },
  { name: 'OPPO', loc: '东莞', type: 'tech' },
  { name: 'vivo', loc: '东莞', type: 'tech' },
  { name: '海康威视', loc: '杭州', type: 'security' },
  { name: '三一重工', loc: '长沙', type: 'manufacture' },
  { name: '中国平安', loc: '深圳', type: 'finance' },
  { name: '招商银行', loc: '深圳', type: 'finance' },
  { name: '清华大学', loc: '北京', type: 'academic' },
  { name: '北京大学', loc: '北京', type: 'academic' },
  { name: '中国科学院', loc: '北京', type: 'research' },
  { name: '上海交通大学', loc: '上海', type: 'academic' },
  { name: '浙江大学', loc: '杭州', type: 'academic' },
  { name: '斯坦福大学', loc: 'Stanford, CA', type: 'academic' },
  { name: 'MIT', loc: 'Cambridge, MA', type: 'academic' },
  { name: 'OpenAI', loc: 'San Francisco', type: 'ai' },
  { name: 'DeepMind', loc: 'London', type: 'ai' },
  { name: 'Anthropic', loc: 'San Francisco', type: 'ai' },
];

const TITLES = [
  '软件工程师','高级工程师','资深工程师','技术专家','架构师',
  '技术经理','技术总监','CTO','VP of Engineering',
  '前端工程师','后端工程师','全栈工程师','算法工程师','机器学习工程师',
  '数据工程师','数据科学家','NLP工程师','计算机视觉工程师','AI研究员',
  '首席科学家','研究员','副研究员','博士后','教授','副教授',
  '产品经理','高级产品经理','技术产品经理',
  'DevOps工程师','SRE工程师','安全工程师','测试开发工程师',
  '移动端开发工程师','iOS工程师','Android工程师','嵌入式工程师',
  '区块链工程师','云计算工程师','大数据工程师',
];

const SKILL_POOL = [
  ['Java','Spring Boot','MyBatis','Redis','MySQL','Kafka','Dubbo'],
  ['Python','Django','Flask','FastAPI','PostgreSQL','Celery'],
  ['JavaScript','TypeScript','React','Vue','Angular','Node.js','Next.js'],
  ['Go','gRPC','Protobuf','Kubernetes','Docker','Prometheus'],
  ['Rust','WebAssembly','Systems Programming','Performance Optimization'],
  ['C++','CUDA','TensorRT','ONNX','高性能计算'],
  ['PyTorch','TensorFlow','Keras','Hugging Face','Transformers'],
  ['NLP','BERT','GPT','LLM','RAG','LangChain','ChatGLM'],
  ['Computer Vision','YOLO','OpenCV','3D Vision','OCR'],
  ['Reinforcement Learning','Multi-Agent','Robot Learning'],
  ['Spark','Flink','Hadoop','Hive','ClickHouse','StarRocks'],
  ['AWS','Azure','GCP','Terraform','CI/CD','Jenkins'],
  ['iOS','Swift','SwiftUI','Objective-C'],
  ['Android','Kotlin','Jetpack Compose'],
  ['Flutter','React Native','跨平台开发'],
  ['Blockchain','Solidity','Web3','Smart Contract'],
  ['Linux','Shell','Nginx','Apache'],
  ['PostgreSQL','MongoDB','Elasticsearch','TiDB','OceanBase'],
  ['GraphQL','REST API','微服务架构','领域驱动设计'],
  ['Figma','Sketch','产品设计','用户体验'],
];

const SCHOOLS = [
  { name: '清华大学', loc: '北京', rank: 'Top 1 中国' },
  { name: '北京大学', loc: '北京', rank: 'Top 2 中国' },
  { name: '浙江大学', loc: '杭州', rank: 'Top 3 中国' },
  { name: '上海交通大学', loc: '上海', rank: 'Top 5 中国' },
  { name: '复旦大学', loc: '上海', rank: 'Top 5 中国' },
  { name: '中国科学技术大学', loc: '合肥', rank: 'Top 10 中国' },
  { name: '南京大学', loc: '南京', rank: 'Top 10 中国' },
  { name: '华中科技大学', loc: '武汉', rank: 'Top 10 中国' },
  { name: '西安交通大学', loc: '西安', rank: 'Top 10 中国' },
  { name: '哈尔滨工业大学', loc: '哈尔滨', rank: 'Top 10 中国' },
  { name: '北京航空航天大学', loc: '北京', rank: '985' },
  { name: '电子科技大学', loc: '成都', rank: '985' },
  { name: 'MIT', loc: 'Cambridge, MA', rank: 'Top 1 全球' },
  { name: 'Stanford University', loc: 'Stanford, CA', rank: 'Top 2 全球' },
  { name: 'Carnegie Mellon University', loc: 'Pittsburgh, PA', rank: 'Top CS 全球' },
  { name: 'UC Berkeley', loc: 'Berkeley, CA', rank: 'Top 5 全球' },
  { name: 'University of Oxford', loc: 'Oxford, UK', rank: 'Top 5 全球' },
  { name: 'ETH Zurich', loc: 'Zurich', rank: 'Top 10 全球' },
  { name: 'NUS', loc: 'Singapore', rank: 'Top 20 全球' },
  { name: 'Tsinghua University', loc: 'Beijing', rank: 'Top 20 全球' },
];

const FIELDS = ['计算机科学','人工智能','软件工程','电子工程','自动化','数学','物理学','统计学','数据科学','信息安全','通信工程','机械工程','生物信息学','工商管理','经济学'];
const DEGREES = ['本科','硕士','博士','MBA','EMBA'];

const PLATFORMS = ['linkedin','maimai','github','aminer','wechat','google_scholar','twitter','orcid'];

const PAPER_VENUES = ['NeurIPS','ICML','ICLR','CVPR','ECCV','ACL','EMNLP','NAACL','AAAI','IJCAI','KDD','SIGIR','WWW','Nature','Science','PNAS','IEEE TPAMI','JMLR','ACM TOG','SIGGRAPH'];
const CONF_NAMES = ['NeurIPS 2024','ICML 2024','CVPR 2024','ACL 2024','KDD 2024','AAAI 2024','QCon北京','ArchSummit','GMTC','VueConf','ReactConf','PyCon China','GopherChina','GMTC','DIVE Conference','世界人工智能大会','中国国际大数据产业博览会'];

const FOLLOWUP_TYPES = ['note','call','email','meeting','interview','offer','rejected','onboarding'];
const NOTE_TEMPLATES = [
  '该候选人技术能力突出，尤其在{n}方向有深厚积累',
  '沟通顺畅，对{n}有独到见解，建议重点关注',
  '已在{n}领域发表多篇论文，学术背景强',
  '有{n}年团队管理经验，适合Tech Lead岗位',
  '对{n}方向有浓厚兴趣，愿意转型',
  '曾在{n}公司主导核心项目，实战经验丰富',
  '薪资预期较高，需要进一步沟通预算匹配',
  '已接受竞品offer，暂时无法推进',
  '面试反馈优秀，算法基础和系统设计均出色',
  '推荐进入终面环节，技术总监已确认',
];

// ==================== 工具函数 ====================

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randSubset(arr, min, max) {
  const n = randInt(min, Math.min(max, arr.length));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function genDate(startYear, endYear) {
  const y = randInt(startYear, endYear);
  const m = String(randInt(1, 12)).padStart(2, '0');
  return `${y}-${m}`;
}
function genCNName() { return rand(SURNAMES) + rand(GIVEN_NAMES) + (Math.random() > 0.7 ? rand(GIVEN_NAMES) : ''); }
function genENName() { return rand(EN_FIRST) + ' ' + rand(EN_LAST); }

// ==================== 主逻辑 ====================

async function main() {
  console.log('====================================');
  console.log('  WasaiTalent 测试数据生成脚本');
  console.log('  目标: 100 条覆盖多场景的人才数据');
  console.log('====================================\n');

  await initDatabase();

  // 获取管理员用户 ID
  const adminUser = get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminUser) { console.error('未找到admin用户，请先运行init-db.js'); process.exit(1); }
  const adminId = adminUser.id;

  // 创建额外测试用户（不同角色）
  const testUsers = [
    { username: 'recruiter01', email: 'recruiter01@wasai.com', password: 'test123456', role: 'user' },
    { username: 'recruiter02', email: 'recruiter02@wasai.com', password: 'test123456', role: 'user' },
    { username: 'viewer01',   email: 'viewer01@wasai.com',   password: 'test123456', role: 'viewer' },
    { username: 'hr_manager', email: 'hr_manager@wasai.com', password: 'test123456', role: 'user' },
  ];
  const userIds = [adminId];
  for (const u of testUsers) {
    const existing = get('SELECT id FROM users WHERE username = ?', [u.username]);
    if (existing) { userIds.push(existing.id); continue; }
    const hash = bcrypt.hashSync(u.password, 10);
    const r = run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.username, u.email, hash, u.role]);
    userIds.push(r.lastInsertRowid);
    console.log(`  + 用户: ${u.username} (${u.role})`);
  }

  // 清空旧测试数据（保留 admin 和上面创建的用户）
  if (CLEAR) {
    console.log('\n[clear] 清空旧测试数据...');
    run('DELETE FROM talent_followups WHERE talent_id > 5');
    run('DELETE FROM talent_notes WHERE talent_id > 5');
    run('DELETE FROM talent_github_repos WHERE talent_id > 5');
    run('DELETE FROM talent_conferences WHERE talent_id > 5');
    run('DELETE FROM talent_patents WHERE talent_id > 5');
    run('DELETE FROM talent_papers WHERE talent_id > 5');
    run('DELETE FROM talent_educations WHERE talent_id > 5');
    run('DELETE FROM talent_experiences WHERE talent_id > 5');
    run('DELETE FROM talent_profiles WHERE talent_id > 5');
    run('DELETE FROM talent_merges');
    run('DELETE FROM talents WHERE id > 5');
  }

  console.log('\n开始生成 100 条人才数据...\n');

  // 数据分布设计:
  // - 40 条: 国内大厂技术人才 (linkedin/maimai/github)
  // - 20 条: AI/学术研究方向 (aminer/arxiv/google_scholar)
  // - 15 条: 海外人才 (linkedin/github)
  // - 10 条: 产品/管理方向
  // -  8 条: 开源贡献者 (github为主)
  // -  5 条: 数据不全/特殊情况
  // -  2 条: 待合并的重复记录

  const talentIds = [];
  const stats = { profiles: 0, experiences: 0, educations: 0, notes: 0, followups: 0,
                  papers: 0, patents: 0, conferences: 0, repos: 0, merges: 0 };

  for (let i = 0; i < 100; i++) {
    const scenario = getScenario(i);
    const talent = buildTalent(i, scenario);
    const creatorId = rand(userIds);

    const result = run(`
      INSERT INTO talents (name, email, phone, company, title, location, skills, education,
        experience_years, summary, data_source, import_method, tags, rating, status, avatar_url,
        open_to_work, suitable_roles, homepage, github_url, google_scholar_url, gender,
        expected_salary, job_preference, wechat, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      talent.name, talent.email, talent.phone, talent.company, talent.title, talent.location,
      talent.skills, talent.education, talent.experience_years, talent.summary,
      talent.data_source, talent.import_method, talent.tags, talent.rating, talent.status,
      talent.avatar_url, talent.open_to_work, talent.suitable_roles, talent.homepage,
      talent.github_url, talent.google_scholar_url, talent.gender, talent.expected_salary,
      talent.job_preference, talent.wechat, creatorId
    ]);
    const tid = result.lastInsertRowid;
    talentIds.push(tid);

    // ---- 平台档案 ----
    const profileCount = scenario.profiles || randInt(1, 3);
    for (let p = 0; p < profileCount; p++) {
      const plat = scenario.platforms ? scenario.platforms[p % scenario.platforms.length] : rand(PLATFORMS);
      insertProfile(tid, plat, talent);
      stats.profiles++;
    }

    // ---- 工作经历 ----
    const expCount = scenario.experiences != null ? scenario.experiences : randInt(1, 4);
    for (let e = 0; e < expCount; e++) {
      insertExperience(tid, e, talent);
      stats.experiences++;
    }

    // ---- 教育经历 ----
    const eduCount = scenario.educations != null ? scenario.educations : randInt(1, 2);
    for (let e = 0; e < eduCount; e++) {
      insertEducation(tid, e);
      stats.educations++;
    }

    // ---- 论文 (学术方向) ----
    if (scenario.papers != null) {
      for (let p = 0; p < scenario.papers; p++) { insertPaper(tid, talent); stats.papers++; }
    } else if (Math.random() < 0.25) {
      insertPaper(tid, talent); stats.papers++;
    }

    // ---- 专利 ----
    if (scenario.patents != null) {
      for (let p = 0; p < scenario.patents; p++) { insertPatent(tid, talent); stats.patents++; }
    } else if (Math.random() < 0.1) {
      insertPatent(tid, talent); stats.patents++;
    }

    // ---- 会议 ----
    if (scenario.conferences != null) {
      for (let c = 0; c < scenario.conferences; c++) { insertConference(tid, talent); stats.conferences++; }
    } else if (Math.random() < 0.2) {
      insertConference(tid, talent); stats.conferences++;
    }

    // ---- GitHub 项目 ----
    if (scenario.repos != null) {
      for (let r = 0; r < scenario.repos; r++) { insertRepo(tid, talent); stats.repos++; }
    } else if (scenario.data_source === 'github' || Math.random() < 0.3) {
      insertRepo(tid, talent); stats.repos++;
    }

    // ---- 备注 ----
    if (Math.random() < 0.5) {
      const noteCount = randInt(1, 3);
      for (let n = 0; n < noteCount; n++) {
        const tpl = rand(NOTE_TEMPLATES);
        const content = tpl.replace('{n}', rand(SKILL_POOL)[0]);
        run('INSERT INTO talent_notes (talent_id, user_id, content) VALUES (?, ?, ?)',
          [tid, rand(userIds), content]);
        stats.notes++;
      }
    }

    // ---- 跟盯记录 ----
    if (Math.random() < 0.4) {
      const fCount = randInt(1, 3);
      for (let f = 0; f < fCount; f++) {
        const ftype = rand(FOLLOWUP_TYPES);
        const nextActions = ['发送技术面试题','安排技术面试','跟进offer进度','等待回复','准备合同','发送资料包','安排团队见面','无'];
        run(`INSERT INTO talent_followups (talent_id, user_id, type, content, next_action, next_date)
             VALUES (?, ?, ?, ?, ?, ?)`, [
          tid, rand(userIds), ftype,
          `${ftype}跟进：与${talent.name}沟通顺利`,
          rand(nextActions),
          `2025-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`
        ]);
        stats.followups++;
      }
    }

    // 进度输出
    if ((i + 1) % 20 === 0) console.log(`  已生成 ${i+1}/100 条...`);
  }

  // ---- 创建人才合并关系 (3对) ----
  if (talentIds.length >= 6) {
    const pairs = [[talentIds[0], talentIds[1]], [talentIds[10], talentIds[11]], [talentIds[50], talentIds[51]]];
    for (const [a, b] of pairs) {
      run('INSERT INTO talent_merges (primary_talent_id, merged_talent_id, match_type, match_confidence, matched_by) VALUES (?, ?, ?, ?, ?)',
        [a, b, rand(['manual','auto','email_match']), parseFloat((0.7 + Math.random()*0.3).toFixed(2)), adminId]);
      stats.merges++;
    }
  }

  saveDb();

  console.log('\n====================================');
  console.log('  数据生成完成！统计如下：');
  console.log('====================================');
  console.log(`  人才记录:     100 条`);
  console.log(`  平台档案:     ${stats.profiles} 条`);
  console.log(`  工作经历:     ${stats.experiences} 条`);
  console.log(`  教育经历:     ${stats.educations} 条`);
  console.log(`  论文发表:     ${stats.papers} 条`);
  console.log(`  专利记录:     ${stats.patents} 条`);
  console.log(`  会议参与:     ${stats.conferences} 条`);
  console.log(`  GitHub项目:   ${stats.repos} 条`);
  console.log(`  备注记录:     ${stats.notes} 条`);
  console.log(`  跟盯记录:     ${stats.followups} 条`);
  console.log(`  合并关系:     ${stats.merges} 条`);
  console.log(`  新增用户:     ${testUsers.length} 个`);
  console.log('====================================\n');

  // 验证
  verify();
}

// ==================== 场景定义 ====================

function getScenario(i) {
  // 0-39: 国内大厂技术人才
  if (i < 40) return {
    type: 'cn_tech',
    data_sources: ['linkedin','maimai','github','manual'],
    platforms: ['linkedin','maimai','github'],
    profiles: randInt(1,3), experiences: randInt(2,5), educations: randInt(1,2),
    repos: Math.random() < 0.4 ? randInt(1,4) : null,
    papers: Math.random() < 0.1 ? 1 : null,
    patents: Math.random() < 0.08 ? 1 : null,
    conferences: Math.random() < 0.15 ? 1 : null,
  };
  // 40-59: AI/学术方向
  if (i < 60) return {
    type: 'academic',
    data_sources: ['aminer','arxiv','google_scholar','manual'],
    platforms: ['aminer','google_scholar','github'],
    profiles: randInt(2,3), experiences: randInt(1,3), educations: randInt(2,3),
    papers: randInt(2,6), patents: Math.random() < 0.3 ? randInt(1,2) : 0,
    conferences: randInt(1,4), repos: randInt(0,3),
  };
  // 60-74: 海外人才
  if (i < 75) return {
    type: 'overseas',
    data_sources: ['linkedin','github','manual'],
    platforms: ['linkedin','github','twitter'],
    profiles: randInt(2,3), experiences: randInt(2,4), educations: randInt(1,2),
    repos: randInt(1,5), papers: Math.random() < 0.3 ? 1 : null,
  };
  // 75-84: 产品/管理方向
  if (i < 85) return {
    type: 'pm_mgmt',
    data_sources: ['linkedin','maimai','manual'],
    platforms: ['linkedin','maimai'],
    profiles: randInt(1,2), experiences: randInt(3,6), educations: randInt(1,2),
    papers: 0, patents: 0, conferences: Math.random() < 0.3 ? 1 : 0,
  };
  // 85-92: 开源贡献者
  if (i < 93) return {
    type: 'opensource',
    data_sources: ['github','manual'],
    platforms: ['github','twitter'],
    profiles: randInt(1,2), experiences: randInt(1,3), educations: randInt(1,2),
    repos: randInt(5,12), conferences: randInt(0,2),
  };
  // 93-97: 数据不全/特殊情况
  if (i < 98) return {
    type: 'sparse',
    data_sources: ['manual'],
    platforms: ['wechat'],
    profiles: Math.random() < 0.5 ? 1 : 0, experiences: Math.random() < 0.5 ? 1 : 0,
    educations: Math.random() < 0.5 ? 1 : 0, papers: 0, patents: 0, conferences: 0, repos: 0,
  };
  // 98-99: 待合并的重复记录（与 0-1 同名）
  return {
    type: 'duplicate',
    data_sources: ['manual'],
    platforms: ['linkedin'],
    profiles: 1, experiences: 1, educations: 1,
  };
}

// ==================== 构建人才数据 ====================

function buildTalent(i, scenario) {
  const isOverseas = scenario.type === 'overseas';
  const name = isOverseas ? genENName() : (scenario.type === 'duplicate' ? (i===98?'张伟':'李芳') : genCNName());
  const company = isOverseas ? rand(COMPANIES.filter(c=>c.type==='academic'||c.type==='ai'||c.type==='tech')) : rand(COMPANIES);
  const companyName = typeof company === 'object' ? company.name : company;
  const location = typeof company === 'object' ? company.loc : (isOverseas ? rand(['San Francisco','New York','London','Berlin','Singapore','Toronto','Tokyo']) : rand(['北京','上海','深圳','杭州','广州','成都','南京','武汉','西安','合肥']));
  const title = isOverseas ? rand(TITLES.filter(t=>/[a-zA-Z]/.test(t))) : rand(TITLES);
  const skills = randSubset(SKILL_POOL, 1, 3).flat().join(',');
  const edu = rand(DEGREES);
  const expYears = randInt(1, 20);
  const data_source = rand(scenario.data_sources);
  const import_method = rand(['api','manual','csv_import','batch']);
  const tags = randSubset(['架构师','全栈','AI专家','开源贡献者','技术管理','算法','数据','安全','移动端','DevOps','区块链','研究','产品','云计算','大数据','NLP','CV','推荐系统','分布式','芯片'], 1, 4).join(',');
  const rating = randInt(1, 5);
  const statuses = ['active','active','active','active','inactive','pending','active','active'];
  const status = rand(statuses);
  const gender = rand(['male','female','other','']);
  const openToWork = rand(['yes','no','yes','no','no','maybe','']);
  const suitableRoles = randSubset(TITLES, 1, 3).join(',');
  const githubUser = isOverseas ? rand(EN_FIRST).toLowerCase()+randInt(100,999) : 'user'+randInt(10000,99999);
  const hasGithub = Math.random() < 0.6;
  const hasScholar = scenario.type === 'academic' || Math.random() < 0.2;
  const salaryOptions = ['面议','30-50k','50-80k','80-120k','120k+','60-90k','年薪100万+','年薪50万',''];
  const jobPref = rand(['远程优先','混合办公','到岗办公','不限','远程优先,可出差']);
  const avatarNum = randInt(1, 99);

  return {
    name, email: `${name.toLowerCase().replace(/\s+/g,'.')}${randInt(10,999)}@${rand(['gmail.com','outlook.com','qq.com','163.com','foxmail.com','company.com'])}`,
    phone: isOverseas ? `+1${randInt(200,999)}${randInt(1000000,9999999)}` : `1${randInt(30,99)}${randInt(10000000,99999999)}`,
    company: companyName, title, location, skills, education: edu,
    experience_years: expYears,
    summary: `${expYears}年${title}经验，擅长${skills.split(',').slice(0,3).join('/')}。${isOverseas?'海外工作背景，英语流利。':''}`,
    data_source, import_method, tags, rating, status,
    avatar_url: `https://i.pravatar.cc/150?img=${avatarNum}`,
    open_to_work: openToWork, suitable_roles: suitableRoles,
    homepage: hasGithub ? `https://${githubUser}.github.io` : '',
    github_url: hasGithub ? `https://github.com/${githubUser}` : '',
    google_scholar_url: hasScholar ? `https://scholar.google.com/citations?user=${randInt(100000,999999)}` : '',
    gender, expected_salary: rand(salaryOptions), job_preference: jobPref,
    wechat: isOverseas ? '' : `wx_${randInt(100000,999999)}`,
  };
}

// ==================== 插入子记录 ====================

function insertProfile(tid, platform, talent) {
  const usernames = {
    linkedin: talent.name.toLowerCase().replace(/\s+/g,'-'),
    maimai: talent.name.toLowerCase().replace(/\s+/g,''),
    github: talent.github_url ? talent.github_url.split('/').pop() : 'gh_'+randInt(10000,99999),
    aminer: 'aminer_'+randInt(100000,999999),
    wechat: talent.wechat || 'wx_'+randInt(100000,999999),
    google_scholar: 'scholar_'+randInt(100000,999999),
    twitter: '@'+talent.name.toLowerCase().replace(/\s+/g,'')+'_'+randInt(10,99),
    orcid: `0000-000${randInt(1,9)}-${randInt(1000,9999)}-${randInt(1000,9999)}`,
  };
  const urls = {
    linkedin: `https://linkedin.com/in/${usernames.linkedin}`,
    maimai: `https://maimai.cn/web/profile/${randInt(100000,999999)}`,
    github: `https://github.com/${usernames.github}`,
    aminer: `https://aminer.cn/profile/${usernames.aminer}`,
    wechat: '',
    google_scholar: talent.google_scholar_url || `https://scholar.google.com/citations?user=${randInt(100000,999999)}`,
    twitter: `https://twitter.com/${usernames.twitter}`,
    orcid: `https://orcid.org/${usernames.orcid}`,
  };
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location, title)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, platform, usernames[platform] || '', urls[platform] || '',
    usernames[platform] || '', talent.name,
    `${talent.title} @ ${talent.company}`, talent.company, talent.location, talent.title
  ]);
}

function insertExperience(tid, order, talent) {
  const co = rand(COMPANIES);
  const startYear = randInt(2005, 2022);
  const endYear = order === 0 ? 2025 : randInt(startYear+1, 2024);
  const isCurrent = order === 0 ? 1 : 0;
  const responsibilities = [
    `负责${rand(['核心系统','用户增长','AI平台','基础架构','数据平台','移动端','安全','商业化'])}方向的${rand(['技术设计','架构演进','团队管理','产品研发'])}`,
    `主导${rand(['微服务改造','性能优化','技术中台建设','AI模型落地','数据仓库搭建'])}项目`,
    `带领${randInt(3,30)}人团队，负责${rand(['技术规划','人员招聘','项目管理'])}`,
  ].join('；');
  const achievements = [
    `系统性能提升${randInt(20,300)}%`,
    `团队规模从${randInt(3,10)}人扩展到${randInt(15,50)}人`,
    `项目营收增长${randInt(30,500)}%`,
    `获得公司级${rand(['技术突破奖','最佳团队奖','创新奖','优秀员工'])}`,
    `开源项目获得${randInt(100,10000)}+ Stars`,
  ].slice(0, randInt(1,3)).join('；');
  run(`INSERT INTO talent_experiences (talent_id, company, title, start_date, end_date, duration, location, responsibilities, achievements, is_current, description, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, co.name, rand(TITLES), `${startYear}-${String(randInt(1,12)).padStart(2,'0')}`,
    isCurrent ? '' : `${endYear}-${String(randInt(1,12)).padStart(2,'0')}`,
    `${endYear - startYear}年`, co.loc, responsibilities, achievements, isCurrent,
    `${rand(TITLES)}，${co.name}`, rand(['linkedin','maimai','manual','github']), order
  ]);
}

function insertEducation(tid, order) {
  const school = rand(SCHOOLS);
  const degree = order === 0 ? rand(DEGREES) : rand(DEGREES.filter(d=>d!=='MBA'&&d!=='EMBA'));
  const field = rand(FIELDS);
  const startYear = randInt(2000, 2020);
  const duration = degree === '博士' ? randInt(4,6) : degree === '硕士' ? randInt(2,3) : randInt(3,4);
  const endYear = startYear + duration;
  run(`INSERT INTO talent_educations (talent_id, school, degree, field, start_date, end_date, dates, location, ranking_info, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, school.name, degree, field,
    `${startYear}-09`, `${endYear}-06`, `${startYear}-${endYear}`,
    school.loc, school.rank, rand(['aminer','linkedin','manual','maimai']), order
  ]);
}

function insertPaper(tid, talent) {
  const topics = ['深度学习模型压缩','大规模语言模型训练','图神经网络在推荐系统中的应用','多模态视觉语言模型','强化学习在机器人控制中的应用','联邦学习隐私保护','知识图谱补全','时间序列预测','自动驾驶感知','医学图像分割','代码生成与理解','对话系统','情感分析','目标检测','三维重建','语义搜索','异常检测','因果推断','元学习','持续学习'];
  const year = randInt(2018, 2024);
  const venue = rand(PAPER_VENUES);
  const title = `${rand(topics)}：基于${rand(['Transformer','图注意力','对比学习','扩散模型','多任务学习','元优化'])}的方法`;
  const authors = `${talent.name}, ${genENName()}, ${genENName()}`;
  run(`INSERT INTO talent_papers (talent_id, title, authors, abstract, venue, year, doi, arxiv_id, pdf_url, categories, citation_count, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, title, authors,
    `本文提出了${title.split('：')[0]}的新方法，在${rand(['ImageNet','COCO','GLUE','SQuAD','CIFAR'])}数据集上取得了SOTA效果，${rand(['准确率提升','F1值提升','推理速度提升'])}${randInt(5,30)}%。`,
    venue, year,
    `10.${randInt(1000,9999)}/${rand(['ieee','acm','springer','nature'])}.${year}.${randInt(1000000,9999999)}`,
    `${year}.${randInt(10000,99999)}`,
    `https://arxiv.org/pdf/${year}.${randInt(10000,99999)}`,
    rand(['cs.AI','cs.CL','cs.CV','cs.LG','cs.SE','stat.ML']),
    randInt(0, 500), rand(['arxiv','aminer','google_scholar','manual']), 0
  ]);
}

function insertPatent(tid, talent) {
  const topics = ['智能推荐系统','图像识别装置','自然语言处理方法','分布式计算框架','自动驾驶控制系统','语音合成装置','区块链数据存储','机器学习模型部署','边缘计算设备','数据加密方法'];
  const status = rand(['已授权','实审中','已公开','已申请','PCT国际']);
  const patentTypes = ['发明专利','实用新型','外观设计','PCT国际专利'];
  const year = randInt(2018, 2024);
  run(`INSERT INTO talent_patents (talent_id, title, patent_number, patent_type, status, filing_date, grant_date, inventors, assignee, abstract, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, `一种${rand(topics)}`,
    `CN${year}${randInt(1000000,9999999)}.${randInt(1,9)}`,
    rand(patentTypes), status,
    `${year}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
    status==='已授权' ? `${year+randInt(1,3)}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}` : '',
    `${talent.name}, ${genCNName()}, ${genCNName()}`,
    rand(COMPANIES).name,
    `本发明涉及${rand(topics)}领域，提供了一种高效、可靠的技术方案，具有广泛的应用前景。`,
    rand(['manual','aminer','linkedin']), 0
  ]);
}

function insertConference(tid, talent) {
  const year = randInt(2020, 2024);
  const conf = rand(CONF_NAMES);
  const roles = ['Speaker','Panelist','Organizer','Attendee','Workshop Chair','Tutorial Presenter','Program Committee'];
  run(`INSERT INTO talent_conferences (talent_id, conference_name, role, title, year, location, url, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, `${conf}`, rand(roles),
    `${rand(['特邀报告','技术分享','圆桌讨论','Workshop','Tutorial','Poster展示'])}：${rand(['AI工程化实践','大规模系统架构','前沿算法应用','开源生态建设','技术团队管理'])}`,
    year,
    rand(['北京','上海','深圳','杭州','San Francisco','London','Singapore','线上']),
    `https://conf.example.com/${conf.toLowerCase().replace(/\s+/g,'-')}/${year}`,
    rand(['manual','aminer','linkedin']), 0
  ]);
}

function insertRepo(tid, talent) {
  const repoTopics = [
    { name: 'llm-inference', desc: '高性能大语言模型推理框架，支持vLLM/TensorRT后端', lang: 'Python', stars: randInt(100,15000) },
    { name: 'distributed-training', desc: '分布式训练框架，支持数据并行和模型并行', lang: 'Python', stars: randInt(50,8000) },
    { name: 'fastapi-template', desc: '基于FastAPI的生产级微服务模板', lang: 'Python', stars: randInt(200,5000) },
    { name: 'react-admin-panel', desc: 'React后台管理系统，支持权限管理和数据可视化', lang: 'TypeScript', stars: randInt(100,6000) },
    { name: 'rust-web-server', desc: 'Rust实现的高性能Web服务器', lang: 'Rust', stars: randInt(50,4000) },
    { name: 'go-microservices', desc: 'Go微服务框架，包含服务发现、负载均衡', lang: 'Go', stars: randInt(200,9000) },
    { name: 'ml-pipeline', desc: '端到端机器学习流水线工具', lang: 'Python', stars: randInt(100,3000) },
    { name: 'vue-component-lib', desc: 'Vue3组件库，包含30+常用业务组件', lang: 'Vue', stars: randInt(300,7000) },
    { name: 'data-analysis-toolkit', desc: '数据分析工具集，支持多种数据源', lang: 'Python', stars: randInt(50,2000) },
    { name: 'k8s-operator', desc: 'Kubernetes自定义控制器，自动化运维', lang: 'Go', stars: randInt(100,4000) },
    { name: 'transformer-from-scratch', desc: '从零实现Transformer，含详细注释', lang: 'Python', stars: randInt(500,20000) },
    { name: 'cpp-algorithm', desc: 'C++算法实现，覆盖常见面试题型', lang: 'C++', stars: randInt(100,5000) },
  ];
  const repo = rand(repoTopics);
  const user = talent.github_url ? talent.github_url.split('/').pop() : 'user'+randInt(10000,99999);
  run(`INSERT INTO talent_github_repos (talent_id, repo_name, full_name, description, url, language, stars, forks, open_issues, is_fork, topics, license, last_pushed_at, data_source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    tid, repo.name, `${user}/${repo.name}`, repo.desc,
    `https://github.com/${user}/${repo.name}`, repo.lang,
    repo.stars, Math.floor(repo.stars * (0.05 + Math.random()*0.2)),
    randInt(0, 50), Math.random() < 0.15 ? 1 : 0,
    randSubset([repo.lang.toLowerCase(),'machine-learning','web','api','framework','toolkit','tutorial','production-ready'], 2, 5).join(','),
    rand(['MIT','Apache-2.0','GPL-3.0','BSD-2-Clause','']),
    `2024-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
    'github', 0
  ]);
}

// ==================== 验证函数 ====================

function verify() {
  console.log('验证数据完整性...\n');
  const checks = [
    { label: '人才总数',       sql: 'SELECT COUNT(*) as c FROM talents' },
    { label: '用户总数',       sql: 'SELECT COUNT(*) as c FROM users' },
    { label: '平台档案',       sql: 'SELECT COUNT(*) as c FROM talent_profiles' },
    { label: '工作经历',       sql: 'SELECT COUNT(*) as c FROM talent_experiences' },
    { label: '教育经历',       sql: 'SELECT COUNT(*) as c FROM talent_educations' },
    { label: '论文发表',       sql: 'SELECT COUNT(*) as c FROM talent_papers' },
    { label: '专利记录',       sql: 'SELECT COUNT(*) as c FROM talent_patents' },
    { label: '会议参与',       sql: 'SELECT COUNT(*) as c FROM talent_conferences' },
    { label: 'GitHub项目',     sql: 'SELECT COUNT(*) as c FROM talent_github_repos' },
    { label: '备注记录',       sql: 'SELECT COUNT(*) as c FROM talent_notes' },
    { label: '跟盯记录',       sql: 'SELECT COUNT(*) as c FROM talent_followups' },
    { label: '合并关系',       sql: 'SELECT COUNT(*) as c FROM talent_merges' },
  ];
  let allPassed = true;
  for (const { label, sql } of checks) {
    const row = get(sql);
    const count = row ? row.c : 0;
    const ok = count > 0 ? '✓' : '✗';
    if (count === 0) allPassed = false;
    console.log(`  ${ok} ${label}: ${count}`);
  }

  // 检查数据分布
  console.log('\n数据分布统计:');
  const dsDist = all('SELECT data_source, COUNT(*) as c FROM talents GROUP BY data_source ORDER BY c DESC');
  for (const r of dsDist) console.log(`  - ${r.data_source}: ${r.c} 条`);

  const statusDist = all('SELECT status, COUNT(*) as c FROM talents GROUP BY status ORDER BY c DESC');
  console.log('\n状态分布:');
  for (const r of statusDist) console.log(`  - ${r.status}: ${r.c} 条`);

  const roleDist = all('SELECT role, COUNT(*) as c FROM users GROUP BY role');
  console.log('\n用户角色分布:');
  for (const r of roleDist) console.log(`  - ${r.role}: ${r.c} 个`);

  console.log(`\n验证${allPassed ? '全部通过 ✓' : '存在问题，请检查 ✗'}`);
}

main().catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
