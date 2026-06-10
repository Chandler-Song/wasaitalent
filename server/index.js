const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 异步启动
async function start() {
  // 初始化数据库
  await initDatabase();

  // 路由
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/talents', require('./routes/talents'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/open', require('./routes/openapi'));

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API文档信息
  app.get('/api', (req, res) => {
    res.json({
      name: 'WasaiTalent API',
      version: '1.0.0',
      description: '人才管理系统开放API',
      endpoints: {
        auth: {
          'POST /api/auth/register': '用户注册',
          'POST /api/auth/login': '用户登录',
          'GET /api/auth/me': '获取当前用户',
          'PUT /api/auth/password': '修改密码'
        },
        talents: {
          'GET /api/talents': '人才列表(搜索+分页)',
          'GET /api/talents/:id': '人才详情+档案+关联',
          'POST /api/talents': '创建人才',
          'PUT /api/talents/:id': '更新人才',
          'DELETE /api/talents/:id': '删除人才',
          'POST /api/talents/:id/notes': '添加备注',
          'POST /api/talents/:id/profiles': '添加平台档案',
          'DELETE /api/talents/:tid/profiles/:pid': '删除平台档案',
          'POST /api/talents/merge': '关联/合并人才',
          'DELETE /api/talents/merge': '取消关联',
          'GET /api/talents/stats/sources': '按数据来源统计',
          'GET /api/talents/stats/import-methods': '按导入方式统计',
          'GET /api/talents/stats/companies': '按公司统计',
          'GET /api/talents/stats/platforms': '按平台档案统计'
        },
        admin: {
          'GET /api/admin/dashboard': '系统概览(需管理员)',
          'GET /api/admin/users': '用户列表',
          'PUT /api/admin/users/:id/role': '修改用户角色',
          'DELETE /api/admin/users/:id': '删除用户',
          'POST /api/admin/api-keys': '创建API密钥',
          'GET /api/admin/api-keys': 'API密钥列表',
          'DELETE /api/admin/api-keys/:id': '删除API密钥'
        },
        openApi: {
          'GET /api/open/talents': '人才列表(需API Key)',
          'GET /api/open/talents/:id': '人才详情+档案',
          'POST /api/open/talents': '创建人才',
          'POST /api/open/import/github': 'GitHub用户导入',
          'POST /api/open/import/github/batch': 'GitHub批量导入',
          'POST /api/open/import/maimai': '脉脉用户导入',
          'POST /api/open/import/maimai/batch': '脉脉批量导入',
          'POST /api/open/import/linkedin': 'LinkedIn简历文本导入',
          'POST /api/open/talents/import': 'CSV通用导入',
          'GET /api/open/talents/export': 'CSV导出',
          'POST /api/open/talents/batch': 'JSON批量导入',
          'POST /api/open/talents/merge': '关联人才'
        }
      }
    });
  });

  // 静态文件服务（前端构建后）
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) res.status(404).json({ error: '前端未构建' });
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  WasaiTalent 人才管理系统已启动`);
    console.log(`  API地址: http://localhost:${PORT}/api`);
    console.log(`  API文档: http://localhost:${PORT}/api`);
    console.log(`  默认管理员: admin / admin123`);
    console.log(`========================================\n`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
