# WasaiTalent 人才管理系统

<div align="center">

**一站式人才管理与多平台数据集成系统**

[![Vue 3](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.6-409EFF?logo=element)](https://element-plus.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

</div>

---

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [功能模块](#功能模块)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [部署说明](#部署说明)
- [项目结构](#项目结构)
- [文档索引](#文档索引)

---

## 项目概述

WasaiTalent 是一个面向 HR 和招聘团队的**人才管理系统**，旨在帮助团队高效地管理人才库、追踪候选人、集成多平台数据。

**核心价值**：

1. **统一管理**：将分散在 GitHub、脉脉、LinkedIn、微信等平台的人才信息集中管理
2. **多平台集成**：支持从 7+ 平台自动导入人才数据，减少手动录入
3. **智能去重**：自动识别并关联同一候选人在不同平台的档案
4. **全程追踪**：从发现到入职，完整记录每个候选人的跟进历程
5. **开放接口**：提供 RESTful API，支持与外部系统对接

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4+ | 前端框架（Composition API） |
| Element Plus | 2.6+ | UI 组件库 |
| Vue Router | 4.3+ | 路由管理（HTML5 History 模式） |
| Pinia | 2.1+ | 状态管理 |
| Axios | 1.6+ | HTTP 客户端 |
| ECharts | 6.1+ | 数据可视化图表 |
| Vite | 5.2+ | 构建工具 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.18+ | Web 框架 |
| sql.js | 1.10+ | SQLite 数据库引擎 |
| JWT | 9.0+ | 身份认证 |
| bcryptjs | 2.4+ | 密码加密 |
| csv-parse/stringify | 5.5/6.4 | CSV 导入导出 |
| multer | 1.4+ | 文件上传处理 |

### 部署

| 技术 | 用途 |
|------|------|
| Docker | 容器化打包（多阶段构建） |
| Docker Compose | 服务编排 |
| Node.js 20 Alpine | 轻量级运行环境 |

---

## 功能模块

### 1. 用户认证与权限

- 用户注册/登录（JWT Token，7 天有效期）
- 角色权限管理（admin / user / viewer）
- 密码修改
- API Key 管理

### 2. 人才信息管理

- **增删改查**：完整的人才信息 CRUD 操作
- **高级搜索**：支持姓名、邮箱、公司、技能、地区等 20+ 字段模糊搜索
- **多维筛选**：按数据来源、学历、工作年限、求职状态等条件筛选
- **分页排序**：支持自定义排序字段和方向
- **人才详情**：独立详情页，包含完整档案信息

**人才信息字段**：
- 基本信息：姓名、邮箱、电话、公司、职位、地区
- 专业信息：技能、学历、工作年限、个人简介
- 求职信息：求职状态、适合岗位、期望薪资、求职偏好
- 社交链接：GitHub、LinkedIn、脉脉、微信、个人主页、Google Scholar
- 其他：标签、评分、头像、数据来源

### 3. 多平台数据集成

支持从以下平台导入人才数据：

| 平台 | 导入方式 | 数据特点 |
|------|----------|----------|
| **GitHub** | 单个/批量 | 开发者档案、项目、技术栈 |
| **脉脉** | 单个/批量 | 职场档案、工作经历、教育背景 |
| **LinkedIn** | 单个 | 完整简历、职业经历 |
| **微信** | 单个/批量 | 联系人信息 |
| **arXiv** | 单个 | 论文、研究方向、学术档案 |
| **专利** | 单个 | 专利发明、技术成果 |
| **会议** | 单个 | 行业会议参与记录 |

**批量导入**：
- CSV 文件导入/导出
- JSON 批量导入

### 4. 人才关联与去重

- **手动关联**：将同一候选人的多个平台档案关联
- **自动匹配**：基于邮箱、姓名等字段自动识别重复
- **合并管理**：设置主档案，合并多个平台数据
- **取消关联**：支持解除已关联的档案

### 5. 备注与跟盯记录

**备注管理**：
- 为每个候选人添加备注
- 记录面试评价、沟通记录
- 支持备注的增删改查

**跟盯记录**：
- 记录类型：电话、微信、视频、邮件、面试、面谈、备注
- 下一步行动计划
- 计划日期提醒
- 完整的跟进时间线

### 6. 详细经历管理

#### 工作经历
- 公司、职位、时间段、地点
- 职责描述、成就亮点
- 支持多段工作经历排序

#### 教育经历
- 学校、学位、专业、时间段
- 排名信息、详细描述
- 支持多段教育经历

#### 论文管理
- 标题、作者、期刊/会议、年份
- DOI、arXiv ID、PDF 链接
- 引用次数统计

#### 专利管理
- 专利标题、专利号、类型
- 申请日期、授权日期、状态
- 发明人、权利人

#### 会议管理
- 会议名称、角色（演讲者/参会者/组织者）
- 演讲主题、年份、地点

#### GitHub 项目
- 项目名称、描述、编程语言
- Star 数、Fork 数、Issue 数
- 主题标签、许可证

### 7. 平台档案管理

为每个候选人管理多平台档案：
- GitHub 档案
- 脉脉档案
- LinkedIn 档案
- 微信档案
- arXiv 学术档案
- 专利档案
- 会议档案

### 8. 数据统计

- 按数据来源统计（manual/github/maimai/linkedin 等）
- 按导入方式统计（manual/api/csv_import）
- 按公司统计人才分布
- 按平台档案统计

### 9. 管理员功能

- **系统概览**：用户数、人才数、备注数、API 密钥数等
- **用户管理**：查看用户列表、修改角色、删除用户
- **API 密钥管理**：创建/删除密钥、设置权限（read/write）

### 10. 开放接口

为外部系统提供标准化 API：
- 人才数据 CRUD
- 多平台数据导入
- CSV 批量导入/导出
- JSON 批量操作
- 人才关联管理

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        WasaiTalent 系统                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    前端 (Vue 3)                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ 人才列表 │  │ 人才详情 │  │ 管理后台 │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  Element Plus UI + ECharts + Pinia + Vue Router  │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │ HTTP/REST API                     │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   后端 (Express)                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ /api/auth│  │/api/talent│  │/api/admin│              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │              /api/open (开放接口)                  │  │    │
│  │  │  GitHub │ 脉脉 │ LinkedIn │ 微信 │ arXiv │ ...   │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │         JWT 认证 │ API Key 认证 │ 权限控制        │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 SQLite (sql.js)                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  users   │  │ talents  │  │ profiles │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │experiences│ │educations│  │  papers  │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ patents  │  │conferences│ │  notes   │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流

```
外部平台 ──→ 开放接口 ──→ 数据转换 ──→ 人才主表 ──→ 关联档案
   │              │                        │
   │              ▼                        ▼
   │         CSV/JSON 导入            子表数据
   │                              (经历/论文/专利)
   │
   └──→ GitHub / 脉脉 / LinkedIn / 微信 / arXiv / 专利 / 会议
```

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 1. 克隆项目

```bash
git clone <repository-url>
cd 20260610
```

### 2. 启动后端

```bash
cd server
npm install
npm start
```

后端服务运行在 `http://localhost:3001`

### 3. 启动前端（开发模式）

```bash
cd client
npm install
npm run dev
```

前端开发服务器运行在 `http://localhost:5173`，API 请求代理到后端。

### 4. 访问系统

打开浏览器访问 `http://localhost:5173`

**默认管理员账号**：
- 用户名：`admin`
- 密码：`admin123`

> **重要**：首次登录后请立即修改默认密码。

---

## 部署说明

### Docker 部署（推荐）

项目支持 Docker 容器化部署，一键启动：

```bash
# 构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
```

服务启动后访问 `http://<服务器IP>:3333`

### 使用部署脚本

项目提供自动化部署脚本：

```bash
# 1. 配置环境变量
cp scripts/.env.example scripts/.env
vim scripts/.env

# 2. 执行部署脚本
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. SSH 登录服务器完成 Docker 构建
ssh root@<服务器IP>
cd /opt/wasaitalent
docker compose up -d --build
```

### 详细部署文档

完整的部署指南请参考：[docs/DEPLOY.md](docs/DEPLOY.md)

内容包括：
- 服务器环境要求与配置
- SSH 密钥配置
- Docker 构建与启动
- 健康检查与监控
- 常见问题排查
- 回滚步骤

---

## 项目结构

```
.
├── client/                    # 前端项目
│   ├── src/
│   │   ├── components/        # 公共组件
│   │   ├── views/             # 页面视图
│   │   │   ├── TalentList.vue    # 人才列表页
│   │   │   ├── TalentDetail.vue  # 人才详情页
│   │   │   └── ...
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # 后端项目
│   ├── routes/
│   │   ├── auth.js            # 用户认证路由
│   │   ├── talents.js         # 人才管理路由
│   │   ├── admin.js           # 管理员路由
│   │   └── openapi.js         # 开放接口路由
│   ├── middleware/
│   │   └── auth.js            # 认证中间件
│   ├── models/
│   │   └── database.js        # 数据库模型
│   ├── index.js               # 服务入口
│   └── package.json
│
├── scripts/                   # 部署脚本
│   ├── deploy.sh              # 部署脚本
│   ├── .env                   # 环境变量（不提交）
│   └── .env.example           # 环境变量示例
│
├── docs/                      # 文档
│   ├── API.md                 # API 文档
│   └── DEPLOY.md              # 部署文档
│
├── Dockerfile                 # Docker 镜像配置
├── docker-compose.yml         # Docker Compose 配置
├── .dockerignore              # Docker 忽略文件
└── .gitignore                 # Git 忽略文件
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [API 文档](docs/API.md) | 完整的 RESTful API 接口文档，包含所有端点的请求/响应格式 |
| [部署文档](docs/DEPLOY.md) | Docker 部署指南，包含环境配置、故障排查、回滚步骤 |

---

## 认证方式

### JWT Token 认证

用于内部接口（`/api/auth`、`/api/talents`、`/api/admin`）：

```bash
# 登录获取 Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 Token 调用接口
curl -X GET http://localhost:3001/api/talents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### API Key 认证

用于开放接口（`/api/open/*`）：

```bash
# 管理员创建 API Key
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"外部系统","permissions":"write"}'

# 使用 API Key 调用接口
curl -X GET http://localhost:3001/api/open/talents \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 许可证

MIT License

---

<div align="center">

**WasaiTalent** - 让人才管理更高效

</div>
