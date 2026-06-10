const { initDatabase, run, saveDb } = require('./models/database');

async function main() {
  console.log('初始化WasaiTalent数据库...');
  await initDatabase();

  // 插入示例人才数据
  const sampleTalents = [
    {
      name: '张三', email: 'zhangsan@example.com', phone: '13800138001',
      company: '华为', title: '高级工程师', location: '深圳',
      skills: 'Java,Go,Kubernetes', education: '硕士', experience_years: 8,
      summary: '10年分布式系统开发经验，擅长微服务架构',
      data_source: 'linkedin', import_method: 'api',
      tags: '架构师,后端', rating: 5
    },
    {
      name: '李四', email: 'lisi@example.com', phone: '13800138002',
      company: '腾讯', title: '技术总监', location: '深圳',
      skills: 'Python,AI/ML,TensorFlow', education: '博士', experience_years: 12,
      summary: 'AI方向技术负责人，发表多篇顶会论文',
      data_source: 'aminer', import_method: 'api',
      tags: 'AI,机器学习,技术管理', rating: 5
    },
    {
      name: '王五', email: 'wangwu@example.com', phone: '13800138003',
      company: '字节跳动', title: '前端架构师', location: '北京',
      skills: 'React,TypeScript,Node.js', education: '本科', experience_years: 7,
      summary: '前端架构设计，开源项目贡献者',
      data_source: 'github', import_method: 'api',
      tags: '前端,开源,架构', rating: 4
    },
    {
      name: '赵六', email: 'zhaoliu@example.com', phone: '13800138004',
      company: '阿里巴巴', title: '数据工程师', location: '杭州',
      skills: 'Spark,Flink,Hadoop,SQL', education: '硕士', experience_years: 6,
      summary: '大数据平台建设，实时计算方向',
      data_source: 'maimai', import_method: 'api',
      tags: '大数据,实时计算', rating: 4
    },
    {
      name: '孙七', email: 'sunqi@example.com', phone: '13800138005',
      company: '百度', title: '算法研究员', location: '北京',
      skills: 'NLP,PyTorch,DeepLearning', education: '博士', experience_years: 5,
      summary: '自然语言处理方向，ACL/EMNLP论文作者',
      data_source: 'aminer', import_method: 'manual',
      tags: 'NLP,深度学习,研究', rating: 4
    }
  ];

  const talentIds = [];
  for (const t of sampleTalents) {
    const result = run(`
      INSERT INTO talents (name, email, phone, company, title, location, skills, education,
        experience_years, summary, data_source, import_method, tags, rating, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.name, t.email, t.phone, t.company, t.title, t.location, t.skills,
      t.education, t.experience_years, t.summary, t.data_source, t.import_method,
      t.tags, t.rating, 'active', 1
    ]);
    talentIds.push(result.lastInsertRowid);
  }

  // 为人才添加平台档案
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[0], 'linkedin', 'zhangsan-li', 'https://linkedin.com/in/zhangsan', 'zhangsan', '张三', '10年分布式系统开发经验', '华为', '深圳']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[0], 'github', '39066742', 'https://github.com/zhangsan', 'zhangsan', 'Zhang San', 'Distributed systems engineer', 'Huawei', 'Shenzhen']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[1], 'aminer', 'lisi-53N', 'https://aminer.cn/profile/lisi', 'lisi', '李四', 'AI方向技术负责人', '腾讯', '深圳']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[1], 'maimai', '153558001', 'https://maimai.cn/lisi', 'lisi', '李四', 'AI技术总监', '腾讯', '深圳']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[2], 'github', '39066743', 'https://github.com/wangwu', 'wangwu', 'Wang Wu', 'Frontend architect & open source contributor', 'ByteDance', 'Beijing']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[3], 'maimai', '153558004', 'https://maimai.cn/zhaoliu', 'zhaoliu', '赵六', '大数据平台建设', '阿里巴巴', '杭州']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[4], 'aminer', 'sunqi-53N', 'https://aminer.cn/profile/sunqi', 'sunqi', '孙七', 'NLP researcher', 'Baidu', 'Beijing']);
  run(`INSERT INTO talent_profiles (talent_id, platform, platform_id, platform_url, username, display_name, bio, company, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [talentIds[4], 'github', '39066745', 'https://github.com/sunqi', 'sunqi', 'Sun Qi', 'NLP & Deep Learning', 'Baidu', 'Beijing']);

  saveDb();
  console.log(`已插入 ${sampleTalents.length} 条示例人才数据`);
  console.log('已插入 8 条平台档案数据');
  console.log('数据库初始化完成！');
}

main().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
