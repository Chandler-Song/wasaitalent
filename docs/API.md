# WasaiTalent API 文档

> **版本**: 1.0.0  
> **基础URL**: `http://localhost:3001/api`  
> **协议**: HTTP/HTTPS  
> **数据格式**: JSON

---

## 目录

1. [认证与鉴权](#1-认证与鉴权)
2. [通用说明](#2-通用说明)
3. [/api/auth - 用户认证](#3-apiauth---用户认证)
4. [/api/talents - 人才管理](#4-apitalents---人才管理)
5. [/api/admin - 管理员功能](#5-apiadmin---管理员功能)
6. [/api/open - 开放接口](#6-apiopen---开放接口)
7. [数据库表结构](#7-数据库表结构)
8. [错误码参考](#8-错误码参考)
9. [快速上手指南](#9-快速上手指南)

---

## 1. 认证与鉴权

WasaiTalent 支持两种认证方式：

### 1.1 JWT Token 认证

用于 `/api/auth`、`/api/talents`、`/api/admin` 等内部接口。

**获取方式**：通过登录接口获取 token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**使用方式**：在请求头中携带 Bearer Token

```
Authorization: Bearer <your-jwt-token>
```

**Token 信息**：
- 有效期：7 天
- 包含字段：`id`、`username`、`role`

### 1.2 API Key 认证

用于 `/api/open/*` 开放接口。

**获取方式**：管理员通过 `/api/admin/api-keys` 创建

**使用方式**：在请求头中携带 API Key

```
X-API-Key: <your-api-key>
```

**权限级别**：
- `read`：只读访问
- `write`：读写访问

---

## 2. 通用说明

### 2.1 请求头

| Header | 值 | 说明 |
|--------|-----|------|
| Content-Type | application/json | JSON 请求体 |
| Authorization | Bearer {token} | JWT 认证 |
| X-API-Key | {api-key} | API Key 认证 |

### 2.2 分页参数

列表接口支持以下分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | integer | 1 | 页码 |
| limit | integer | 20 | 每页数量 |
| sort | string | created_at | 排序字段 |
| order | string | DESC | 排序方向 (ASC/DESC) |

### 2.3 通用响应格式

**成功响应**：
```json
{
  "data": { ... }
}
```

**列表响应**：
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**错误响应**：
```json
{
  "error": "错误描述信息"
}
```

---

## 3. /api/auth - 用户认证

### 3.1 用户注册

**POST** `/api/auth/register`

**认证**：无需认证

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，唯一，长度 1-50 |
| email | string | 是 | 邮箱，唯一 |
| password | string | 是 | 密码，至少 6 位 |

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "password": "123456"
  }'
```

**成功响应** `201 Created`：
```json
{
  "user": {
    "id": 2,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "role": "user",
    "created_at": "2024-01-15 10:30:00"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**：
- `400`：缺少必填字段 / 密码少于 6 位
- `409`：用户名或邮箱已存在
- `500`：服务器错误

---

### 3.2 用户登录

**POST** `/api/auth/login`

**认证**：无需认证

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**成功响应** `200 OK`：
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@wasai-talent.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**：
- `400`：缺少必填字段
- `401`：用户名或密码错误
- `500`：服务器错误

---

### 3.3 获取当前用户信息

**GET** `/api/auth/me`

**认证**：JWT Token

**请求示例**：
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应** `200 OK`：
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@wasai-talent.com",
    "role": "admin"
  }
}
```

**错误响应**：
- `401`：未提供令牌 / 令牌无效或已过期

---

### 3.4 修改密码

**PUT** `/api/auth/password`

**认证**：JWT Token

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码 |

**请求示例**：
```bash
curl -X PUT http://localhost:3001/api/auth/password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "newpassword456"
  }'
```

**成功响应** `200 OK`：
```json
{
  "message": "密码修改成功"
}
```

**错误响应**：
- `400`：缺少必填字段
- `401`：旧密码错误
- `500`：服务器错误

---

## 4. /api/talents - 人才管理

> 以下所有接口需要 JWT Token 认证

### 4.1 获取人才列表

**GET** `/api/talents`

**认证**：JWT Token

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 全局搜索（姓名/邮箱/公司/职位/技能/电话/地址等） |
| data_source | string | 否 | 数据来源筛选：manual/github/maimai/linkedin/wechat/arxiv/patent/conference |
| import_method | string | 否 | 导入方式：manual/api/csv_import |
| status | string | 否 | 状态：active/inactive/archived |
| open_to_work | string | 否 | 求职状态 |
| education | string | 否 | 学历：本科/硕士/博士 |
| gender | string | 否 | 性别：男/女 |
| location | string | 否 | 地区（模糊匹配） |
| skills | string | 否 | 技能（模糊匹配） |
| email | string | 否 | 邮箱（模糊匹配） |
| phone | string | 否 | 电话（模糊匹配） |
| wechat | string | 否 | 微信号（模糊匹配） |
| suitable_roles | string | 否 | 适合岗位（模糊匹配） |
| job_preference | string | 否 | 求职偏好（模糊匹配） |
| tags | string | 否 | 标签（模糊匹配） |
| linkedin_url | string | 否 | LinkedIn 链接（模糊匹配） |
| github_url | string | 否 | GitHub 链接（模糊匹配） |
| maimai_url | string | 否 | 脉脉链接（模糊匹配） |
| homepage | string | 否 | 主页链接（模糊匹配） |
| paper_title | string | 否 | 论文标题搜索（子查询） |
| patent_title | string | 否 | 专利标题搜索（子查询） |
| conference_name | string | 否 | 会议名称搜索（子查询） |
| experience_years_min | integer | 否 | 最小工作年限 |
| experience_years_max | integer | 否 | 最大工作年限 |
| expected_salary_min | string | 否 | 最低期望薪资 |
| expected_salary_max | string | 否 | 最高期望薪资 |
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 20 |
| sort | string | 否 | 排序字段：name/created_at/rating/experience_years/updated_at |
| order | string | 否 | 排序方向：ASC/DESC |

**请求示例**：
```bash
curl -X GET "http://localhost:3001/api/talents?search=工程师&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应** `200 OK`：
```json
{
  "data": [
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com",
      "phone": "13800138000",
      "company": "某科技公司",
      "title": "高级工程师",
      "location": "北京",
      "skills": "JavaScript,Node.js,Vue",
      "education": "硕士",
      "experience_years": 5,
      "summary": "全栈开发工程师",
      "data_source": "manual",
      "import_method": "manual",
      "tags": "技术专家,全栈",
      "rating": 4,
      "status": "active",
      "open_to_work": "考虑机会",
      "suitable_roles": "技术经理,架构师",
      "gender": "男",
      "expected_salary": "50k-80k",
      "job_preference": "远程",
      "wechat": "zhangsan_wx",
      "linkedin_url": "https://linkedin.com/in/zhangsan",
      "github_url": "https://github.com/zhangsan",
      "maimai_url": "https://maimai.cn/zhangsan",
      "homepage": "https://zhangsan.dev",
      "google_scholar_url": null,
      "avatar_url": null,
      "raw_data": null,
      "created_by": 1,
      "created_at": "2024-01-15 10:30:00",
      "updated_at": "2024-01-15 10:30:00",
      "profile_count": 2,
      "merge_count": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 4.2 获取人才详情

**GET** `/api/talents/:id`

**认证**：JWT Token

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 人才 ID |

**请求示例**：
```bash
curl -X GET http://localhost:3001/api/talents/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应** `200 OK`：
```json
{
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "company": "某科技公司",
    "title": "高级工程师",
    "...": "更多字段见人才列表响应"
  },
  "profiles": [
    {
      "id": 1,
      "talent_id": 1,
      "platform": "github",
      "platform_id": "12345",
      "platform_url": "https://github.com/zhangsan",
      "username": "zhangsan",
      "display_name": "张三",
      "avatar_url": null,
      "bio": "全栈开发者",
      "company": "某科技公司",
      "location": "北京",
      "email": "zhangsan@example.com",
      "title": "高级工程师"
    }
  ],
  "experiences": [
    {
      "id": 1,
      "talent_id": 1,
      "company": "某科技公司",
      "title": "高级工程师",
      "start_date": "2020-01",
      "end_date": null,
      "duration": "3年",
      "location": "北京",
      "is_current": 1,
      "description": "负责核心系统开发",
      "sort_order": 0
    }
  ],
  "educations": [
    {
      "id": 1,
      "talent_id": 1,
      "school": "北京大学",
      "degree": "硕士",
      "field": "计算机科学",
      "dates": "2015-2018",
      "location": "北京",
      "description": "研究方向：人工智能",
      "sort_order": 0
    }
  ],
  "notes": [
    {
      "id": 1,
      "talent_id": 1,
      "user_id": 1,
      "username": "admin",
      "content": "候选人非常优秀",
      "created_at": "2024-01-15 10:30:00"
    }
  ],
  "followups": [
    {
      "id": 1,
      "talent_id": 1,
      "user_id": 1,
      "username": "admin",
      "type": "call",
      "content": "电话沟通，候选人表示感兴趣",
      "next_action": "发送JD",
      "next_date": "2024-01-20",
      "created_at": "2024-01-15 10:30:00"
    }
  ],
  "papers": [
    {
      "id": 1,
      "talent_id": 1,
      "title": "Deep Learning for NLP",
      "authors": "张三, 李四",
      "venue": "ACL 2023",
      "year": 2023,
      "doi": "10.1234/example",
      "citation_count": 15
    }
  ],
  "patents": [
    {
      "id": 1,
      "talent_id": 1,
      "title": "一种智能推荐算法",
      "patent_number": "CN20231234567",
      "patent_type": "发明",
      "status": "已授权",
      "filing_date": "2023-01-01",
      "grant_date": "2024-01-01"
    }
  ],
  "conferences": [
    {
      "id": 1,
      "talent_id": 1,
      "conference_name": "QCon 2023",
      "role": "speaker",
      "title": "大规模系统架构实践",
      "year": 2023,
      "location": "北京"
    }
  ],
  "githubRepos": [
    {
      "id": 1,
      "talent_id": 1,
      "repo_name": "awesome-project",
      "full_name": "zhangsan/awesome-project",
      "url": "https://github.com/zhangsan/awesome-project",
      "language": "TypeScript",
      "stars": 1200,
      "forks": 200
    }
  ],
  "relatedTalents": [
    {
      "id": 2,
      "name": "张三(脉脉)",
      "company": "某科技公司",
      "title": "高级工程师",
      "data_source": "maimai",
      "import_method": "api"
    }
  ]
}
```

**错误响应**：
- `404`：人才信息不存在
- `500`：服务器错误

---

### 4.3 创建人才

**POST** `/api/talents`

**认证**：JWT Token

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 电话 |
| company | string | 否 | 公司 |
| title | string | 否 | 职位 |
| location | string | 否 | 地区 |
| skills | string | 否 | 技能（逗号分隔） |
| education | string | 否 | 学历：本科/硕士/博士 |
| experience_years | integer | 否 | 工作年限 |
| summary | string | 否 | 个人简介 |
| data_source | string | 否 | 数据来源，默认 manual |
| import_method | string | 否 | 导入方式，默认 manual |
| tags | string | 否 | 标签（逗号分隔） |
| rating | integer | 否 | 评分 0-5，默认 0 |
| status | string | 否 | 状态：active/inactive/archived |
| avatar_url | string | 否 | 头像 URL |
| raw_data | string | 否 | 原始数据 JSON |
| open_to_work | string | 否 | 求职状态 |
| suitable_roles | string | 否 | 适合岗位 |
| homepage | string | 否 | 个人主页 |
| github_url | string | 否 | GitHub 链接 |
| google_scholar_url | string | 否 | Google Scholar 链接 |
| gender | string | 否 | 性别 |
| expected_salary | string | 否 | 期望薪资 |
| job_preference | string | 否 | 求职偏好 |
| wechat | string | 否 | 微信号 |
| linkedin_url | string | 否 | LinkedIn 链接 |
| maimai_url | string | 否 | 脉脉链接 |

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/talents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "李四",
    "email": "lisi@example.com",
    "company": "AI科技公司",
    "title": "算法工程师",
    "location": "上海",
    "skills": "Python,PyTorch,深度学习",
    "education": "博士",
    "experience_years": 3
  }'
```

**成功响应** `201 Created`：
```json
{
  "data": {
    "id": 3,
    "name": "李四",
    "email": "lisi@example.com",
    "company": "AI科技公司",
    "title": "算法工程师",
    "location": "上海",
    "skills": "Python,PyTorch,深度学习",
    "education": "博士",
    "experience_years": 3,
    "data_source": "manual",
    "import_method": "manual",
    "status": "active",
    "rating": 0,
    "created_at": "2024-01-15 10:30:00"
  }
}
```

---

### 4.4 更新人才信息

**PUT** `/api/talents/:id`

**认证**：JWT Token

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 人才 ID |

**请求体**：同创建人才字段，只需提供要更新的字段

**请求示例**：
```bash
curl -X PUT http://localhost:3001/api/talents/3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "高级算法工程师",
    "rating": 5
  }'
```

**成功响应** `200 OK`：
```json
{
  "data": {
    "id": 3,
    "name": "李四",
    "title": "高级算法工程师",
    "rating": 5,
    "updated_at": "2024-01-15 11:00:00"
  }
}
```

---

### 4.5 删除人才

**DELETE** `/api/talents/:id`

**认证**：JWT Token

**请求示例**：
```bash
curl -X DELETE http://localhost:3001/api/talents/3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应** `200 OK`：
```json
{
  "message": "删除成功"
}
```

---

### 4.6 关联/合并人才

**POST** `/api/talents/merge`

**认证**：JWT Token

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| primary_talent_id | integer | 是 | 主人才 ID |
| merged_talent_id | integer | 是 | 被合并人才 ID |
| match_type | string | 否 | 关联类型：manual/auto，默认 manual |
| match_confidence | float | 否 | 匹配置信度 0-1，默认 1.0 |

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/talents/merge \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "primary_talent_id": 1,
    "merged_talent_id": 2
  }'
```

**成功响应** `201 Created`：
```json
{
  "data": {
    "id": 1,
    "primary_talent_id": 1,
    "merged_talent_id": 2,
    "match_type": "manual"
  }
}
```

---

### 4.7 取消关联

**DELETE** `/api/talents/merge`

**认证**：JWT Token

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| primary_talent_id | integer | 是 | 主人才 ID |
| merged_talent_id | integer | 是 | 被合并人才 ID |

---

### 4.8 备注管理

#### 获取备注列表
**GET** `/api/talents/:id/notes`

#### 添加备注
**POST** `/api/talents/:id/notes`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 备注内容 |

#### 更新备注
**PUT** `/api/talents/:id/notes/:nid`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 备注内容 |

#### 删除备注
**DELETE** `/api/talents/:id/notes/:nid`

---

### 4.9 跟盯记录管理

#### 获取跟盯记录
**GET** `/api/talents/:id/followups`

#### 添加跟盯记录
**POST** `/api/talents/:id/followups`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型：call/wechat/video/email/interview/meeting/note/other，默认 note |
| content | string | 是 | 跟盯内容 |
| next_action | string | 否 | 下一步行动 |
| next_date | string | 否 | 计划日期（YYYY-MM-DD） |

#### 更新跟盯记录
**PUT** `/api/talents/:id/followups/:fid`

#### 删除跟盯记录
**DELETE** `/api/talents/:id/followups/:fid`

---

### 4.10 工作经历管理

#### 获取工作经历
**GET** `/api/talents/:id/experiences`

#### 添加工作经历
**POST** `/api/talents/:id/experiences`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| company | string | 否 | 公司名称 |
| title | string | 否 | 职位 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| duration | string | 否 | 时长 |
| location | string | 否 | 地点 |
| responsibilities | string | 否 | 职责 |
| achievements | string | 否 | 成就 |
| is_current | integer | 否 | 是否在职 0/1 |
| description | string | 否 | 描述 |
| company_details | string | 否 | 公司详情 JSON |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新工作经历
**PUT** `/api/talents/:id/experiences/:eid`

#### 删除工作经历
**DELETE** `/api/talents/:id/experiences/:eid`

---

### 4.11 教育经历管理

#### 获取教育经历
**GET** `/api/talents/:id/educations`

#### 添加教育经历
**POST** `/api/talents/:id/educations`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| school | string | 否 | 学校名称 |
| degree | string | 否 | 学位 |
| field | string | 否 | 专业 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| dates | string | 否 | 时间段描述 |
| location | string | 否 | 地点 |
| ranking_info | string | 否 | 排名信息 |
| description | string | 否 | 详情描述（主修课程、研究方向等） |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新教育经历
**PUT** `/api/talents/:id/educations/:eid`

#### 删除教育经历
**DELETE** `/api/talents/:id/educations/:eid`

---

### 4.12 论文管理

#### 获取论文列表
**GET** `/api/talents/:id/papers`

#### 添加论文
**POST** `/api/talents/:id/papers`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 论文标题 |
| authors | string | 否 | 作者 |
| abstract | string | 否 | 摘要 |
| venue | string | 否 | 发表期刊/会议 |
| year | integer | 否 | 年份 |
| doi | string | 否 | DOI |
| arxiv_id | string | 否 | arXiv ID |
| pdf_url | string | 否 | PDF 链接 |
| categories | string | 否 | 分类 |
| citation_count | integer | 否 | 引用次数，默认 0 |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新论文
**PUT** `/api/talents/:id/papers/:pid`

#### 删除论文
**DELETE** `/api/talents/:id/papers/:pid`

---

### 4.13 专利管理

#### 获取专利列表
**GET** `/api/talents/:id/patents`

#### 添加专利
**POST** `/api/talents/:id/patents`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 专利标题 |
| patent_number | string | 否 | 专利号 |
| patent_type | string | 否 | 类型：发明/实用新型/外观设计 |
| status | string | 否 | 状态 |
| filing_date | string | 否 | 申请日期 |
| grant_date | string | 否 | 授权日期 |
| inventors | string | 否 | 发明人 |
| assignee | string | 否 | 权利人 |
| abstract | string | 否 | 摘要 |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新专利
**PUT** `/api/talents/:id/patents/:pid`

#### 删除专利
**DELETE** `/api/talents/:id/patents/:pid`

---

### 4.14 行业会议管理

#### 获取会议列表
**GET** `/api/talents/:id/conferences`

#### 添加会议
**POST** `/api/talents/:id/conferences`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conference_name | string | 是 | 会议名称 |
| role | string | 否 | 角色：speaker/attendee/organizer |
| title | string | 否 | 演讲主题 |
| year | integer | 否 | 年份 |
| location | string | 否 | 地点 |
| url | string | 否 | 会议链接 |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新会议
**PUT** `/api/talents/:id/conferences/:cid`

#### 删除会议
**DELETE** `/api/talents/:id/conferences/:cid`

---

### 4.15 GitHub 项目管理

#### 获取项目列表
**GET** `/api/talents/:id/repos`

#### 添加项目
**POST** `/api/talents/:id/repos`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| repo_name | string | 是 | 项目名称 |
| full_name | string | 否 | 完整名称（user/repo） |
| description | string | 否 | 描述 |
| url | string | 否 | 链接 |
| language | string | 否 | 编程语言 |
| stars | integer | 否 | Star 数，默认 0 |
| forks | integer | 否 | Fork 数，默认 0 |
| open_issues | integer | 否 | 开放 Issue 数 |
| is_fork | integer | 否 | 是否 Fork 0/1 |
| topics | string | 否 | 主题标签 |
| license | string | 否 | 许可证 |
| last_pushed_at | string | 否 | 最后推送时间 |
| data_source | string | 否 | 数据来源 |
| sort_order | integer | 否 | 排序 |

#### 更新项目
**PUT** `/api/talents/:id/repos/:rid`

#### 删除项目
**DELETE** `/api/talents/:id/repos/:rid`

---

### 4.16 平台档案管理

#### 添加档案
**POST** `/api/talents/:id/profiles`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| platform | string | 是 | 平台：github/maimai/linkedin/wechat/arxiv/patent/conference |
| platform_id | string | 否 | 平台用户 ID |
| platform_url | string | 否 | 平台链接 |
| username | string | 否 | 用户名 |
| display_name | string | 否 | 显示名称 |
| avatar_url | string | 否 | 头像 |
| bio | string | 否 | 简介 |
| company | string | 否 | 公司 |
| location | string | 否 | 地区 |
| email | string | 否 | 邮箱 |
| title | string | 否 | 职位 |
| raw_data | string | 否 | 原始数据 |

#### 更新档案
**PUT** `/api/talents/:talentId/profiles/:profileId`

#### 删除档案
**DELETE** `/api/talents/:talentId/profiles/:profileId`

---

### 4.17 统计接口

#### 按数据来源统计
**GET** `/api/talents/stats/sources`

**响应示例**：
```json
{
  "data": [
    { "data_source": "manual", "count": 50 },
    { "data_source": "github", "count": 30 },
    { "data_source": "maimai", "count": 20 }
  ]
}
```

#### 按导入方式统计
**GET** `/api/talents/stats/import-methods`

#### 按公司统计
**GET** `/api/talents/stats/companies`

#### 按平台档案统计
**GET** `/api/talents/stats/platforms`

---

## 5. /api/admin - 管理员功能

> 以下所有接口需要 JWT Token 认证 + 管理员权限

### 5.1 系统概览

**GET** `/api/admin/dashboard`

**请求示例**：
```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**成功响应** `200 OK`：
```json
{
  "data": {
    "totalUsers": 5,
    "totalTalents": 100,
    "totalNotes": 50,
    "totalApiKeys": 2,
    "totalProfiles": 80,
    "totalMerges": 10,
    "sourceStats": [
      { "data_source": "manual", "count": 50 },
      { "data_source": "github", "count": 30 }
    ],
    "importMethodStats": [
      { "import_method": "manual", "count": 60 },
      { "import_method": "api", "count": 40 }
    ],
    "platformStats": [
      { "platform": "github", "count": 30 },
      { "platform": "maimai", "count": 20 }
    ],
    "recentTalents": [...],
    "recentUsers": [...]
  }
}
```

---

### 5.2 用户管理

#### 获取用户列表
**GET** `/api/admin/users`

**响应示例**：
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@wasai-talent.com",
      "role": "admin",
      "created_at": "2024-01-01 00:00:00",
      "updated_at": "2024-01-01 00:00:00"
    }
  ]
}
```

#### 修改用户角色
**PUT** `/api/admin/users/:id/role`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 是 | 角色：admin/user/viewer |

**请求示例**：
```bash
curl -X PUT http://localhost:3001/api/admin/users/2/role \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{ "role": "admin" }'
```

#### 删除用户
**DELETE** `/api/admin/users/:id`

> 注意：不能删除自己

---

### 5.3 API 密钥管理

#### 创建 API 密钥
**POST** `/api/admin/api-keys`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 密钥名称，默认 "Default Key" |
| permissions | string | 否 | 权限：read/write，默认 read |

**请求示例**：
```bash
curl -X POST http://localhost:3001/api/admin/api-keys \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "生产环境密钥",
    "permissions": "write"
  }'
```

**成功响应** `201 Created`：
```json
{
  "data": {
    "id": 1,
    "name": "生产环境密钥",
    "key": "a1b2c3d4e5f6...（64位十六进制字符串）",
    "permissions": "write"
  }
}
```

> **重要**：密钥只在创建时返回一次，请妥善保存！

#### 获取 API 密钥列表
**GET** `/api/admin/api-keys`

#### 删除 API 密钥
**DELETE** `/api/admin/api-keys/:id`

---

## 6. /api/open - 开放接口

> 以下所有接口需要 API Key 认证  
> 请求头：`X-API-Key: <your-api-key>`

### 6.1 通用人才操作

#### 获取人才列表
**GET** `/api/open/talents`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| search | string | 否 | 搜索关键词 |
| data_source | string | 否 | 数据来源 |
| import_method | string | 否 | 导入方式 |
| limit | integer | 否 | 数量限制，默认 100 |
| offset | integer | 否 | 偏移量，默认 0 |

#### 获取人才详情
**GET** `/api/open/talents/:id`

#### 创建人才
**POST** `/api/open/talents`

请求体同 `/api/talents` POST

---

### 6.2 GitHub 导入

#### 单个导入
**POST** `/api/open/import/github`

**请求体**：
```json
{
  "id": 12345,
  "login": "octocat",
  "name": "The Octocat",
  "email": "octocat@github.com",
  "company": "GitHub",
  "location": "San Francisco",
  "bio": "Full stack developer",
  "avatar_url": "https://github.com/octocat.png",
  "html_url": "https://github.com/octocat"
}
```

#### 批量导入
**POST** `/api/open/import/github/batch`

**请求体**：
```json
{
  "users": [
    { "login": "user1", "name": "User One" },
    { "login": "user2", "name": "User Two" }
  ]
}
```

**响应**：
```json
{
  "data": {
    "imported": 2,
    "errors": []
  }
}
```

---

### 6.3 脉脉导入

#### 单个导入
**POST** `/api/open/import/maimai`

支持两种数据格式：

**格式1 - 详细格式**（含 basic_info）：
```json
{
  "profile_id": "123456",
  "basic_info": {
    "name": "王五",
    "current_company": "某公司",
    "current_position": "产品经理",
    "location": { "province": "北京", "city": "朝阳" },
    "tags": ["产品", "互联网"],
    "education_level": "硕士",
    "total_work_experience_years": 5,
    "gender": "男",
    "major": "计算机"
  },
  "links": {
    "avatar_url": "https://...",
    "profile_url": "https://maimai.cn/..."
  },
  "work_history": [...],
  "education_history": [...]
}
```

**格式2 - 简略格式**：
```json
{
  "name": "王五",
  "company": "某公司",
  "position": "产品经理",
  "city": "北京",
  "avatar": "https://...",
  "tag_list": ["产品", "互联网"],
  "sdegree": "硕士",
  "school": "清华大学"
}
```

#### 批量导入
**POST** `/api/open/import/maimai/batch`

**请求体**：
```json
{
  "users": [
    { "name": "用户1", "company": "公司A" },
    { "name": "用户2", "company": "公司B" }
  ]
}
```

---

### 6.4 LinkedIn 导入

**POST** `/api/open/import/linkedin`

支持完整简历数据和简略文本两种格式。

**完整格式示例**：
```json
{
  "name": "赵六",
  "email": "zhao@example.com",
  "company": "Tech Corp",
  "title": "Senior Engineer",
  "location": "Shanghai",
  "skills": ["Java", "Spring"],
  "summary": "10年经验",
  "linkedin": "https://linkedin.com/in/zhao",
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Engineer",
      "positions": [{ "start_date": "2020-01", "location": "Shanghai" }]
    }
  ],
  "education": [
    { "school": "Fudan University", "degree": "Master", "field": "CS" }
  ]
}
```

**简略格式**：
```json
{
  "name": "赵六",
  "raw_text": "LinkedIn简历原文内容..."
}
```

---

### 6.5 微信导入

#### 单个导入
**POST** `/api/open/import/wechat`

```json
{
  "name": "微信用户",
  "wechat_id": "wxid_xxx",
  "company": "某公司",
  "title": "工程师",
  "city": "北京",
  "tags": ["技术"]
}
```

#### 批量导入
**POST** `/api/open/import/wechat/batch`

```json
{
  "contacts": [
    { "name": "用户1", "wechat_id": "wxid_1" },
    { "name": "用户2", "wechat_id": "wxid_2" }
  ]
}
```

---

### 6.6 arXiv 论文导入

**POST** `/api/open/import/arxiv`

```json
{
  "name": "研究者",
  "email": "researcher@university.edu",
  "affiliation": "某大学",
  "homepage": "https://researcher.dev",
  "categories": ["cs.AI", "cs.LG"],
  "papers": [
    {
      "title": "Attention Is All You Need",
      "authors": ["Author1", "Author2"],
      "venue": "NeurIPS",
      "year": 2017,
      "arxiv_id": "1706.03762"
    }
  ]
}
```

---

### 6.7 专利导入

**POST** `/api/open/import/patent`

```json
{
  "name": "发明人",
  "company": "某公司",
  "patents": [
    {
      "title": "一种数据处理方法",
      "patent_number": "CN202312345678",
      "patent_type": "发明",
      "status": "已授权",
      "filing_date": "2023-01-01"
    }
  ]
}
```

---

### 6.8 会议导入

**POST** `/api/open/import/conference`

```json
{
  "name": "参会者",
  "email": "attendee@example.com",
  "company": "某公司",
  "conferences": [
    {
      "conference_name": "QCon 2024",
      "role": "speaker",
      "title": "架构实践分享",
      "year": 2024,
      "location": "北京"
    }
  ]
}
```

---

### 6.9 CSV 导入/导出

#### CSV 导入
**POST** `/api/open/talents/import`

**Content-Type**: `multipart/form-data`

**CSV 列名**：name, email, phone, company, title, location, skills, education, experience_years, summary, tags, rating, status

```bash
curl -X POST http://localhost:3001/api/open/talents/import \
  -H "X-API-Key: your-api-key" \
  -F "file=@talents.csv"
```

#### CSV 导出
**GET** `/api/open/talents/export`

返回 CSV 文件下载。

---

### 6.10 JSON 批量导入

**POST** `/api/open/talents/batch`

```json
{
  "talents": [
    { "name": "人才1", "company": "公司A" },
    { "name": "人才2", "company": "公司B" }
  ]
}
```

---

### 6.11 人才关联

**POST** `/api/open/talents/merge`

```json
{
  "primary_talent_id": 1,
  "merged_talent_id": 2,
  "match_type": "api"
}
```

---

## 7. 数据库表结构

### 7.1 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 用户 ID |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| password_hash | TEXT | 密码哈希 |
| role | TEXT | 角色：admin/user/viewer |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### 7.2 人才主表 (talents)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 人才 ID |
| name | TEXT NOT NULL | 姓名 |
| email | TEXT | 邮箱 |
| phone | TEXT | 电话 |
| company | TEXT | 公司 |
| title | TEXT | 职位 |
| location | TEXT | 地区 |
| skills | TEXT | 技能 |
| education | TEXT | 学历 |
| experience_years | INTEGER | 工作年限 |
| summary | TEXT | 个人简介 |
| data_source | TEXT | 数据来源 |
| import_method | TEXT | 导入方式 |
| tags | TEXT | 标签 |
| rating | INTEGER | 评分 0-5 |
| status | TEXT | 状态 |
| avatar_url | TEXT | 头像 |
| raw_data | TEXT | 原始数据 |
| open_to_work | TEXT | 求职状态 |
| suitable_roles | TEXT | 适合岗位 |
| homepage | TEXT | 主页 |
| github_url | TEXT | GitHub |
| google_scholar_url | TEXT | Google Scholar |
| gender | TEXT | 性别 |
| expected_salary | TEXT | 期望薪资 |
| job_preference | TEXT | 求职偏好 |
| wechat | TEXT | 微信号 |
| linkedin_url | TEXT | LinkedIn |
| maimai_url | TEXT | 脉脉 |
| created_by | INTEGER | 创建者 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### 7.3 平台档案表 (talent_profiles)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 档案 ID |
| talent_id | INTEGER FK | 人才 ID |
| platform | TEXT | 平台名称 |
| platform_id | TEXT | 平台用户 ID |
| platform_url | TEXT | 平台链接 |
| username | TEXT | 用户名 |
| display_name | TEXT | 显示名称 |
| avatar_url | TEXT | 头像 |
| bio | TEXT | 简介 |
| company | TEXT | 公司 |
| location | TEXT | 地区 |
| email | TEXT | 邮箱 |
| title | TEXT | 职位 |
| raw_data | TEXT | 原始数据 |

### 7.4 工作经历表 (talent_experiences)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 经历 ID |
| talent_id | INTEGER FK | 人才 ID |
| company | TEXT | 公司 |
| title | TEXT | 职位 |
| start_date | TEXT | 开始日期 |
| end_date | TEXT | 结束日期 |
| duration | TEXT | 时长 |
| location | TEXT | 地点 |
| is_current | INTEGER | 是否在职 |
| description | TEXT | 描述 |
| company_details | TEXT | 公司详情 |
| sort_order | INTEGER | 排序 |

### 7.5 教育经历表 (talent_educations)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 经历 ID |
| talent_id | INTEGER FK | 人才 ID |
| school | TEXT | 学校 |
| degree | TEXT | 学位 |
| field | TEXT | 专业 |
| dates | TEXT | 时间段 |
| location | TEXT | 地点 |
| ranking_info | TEXT | 排名信息 |
| description | TEXT | 详情描述 |
| sort_order | INTEGER | 排序 |

### 7.6 备注表 (talent_notes)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 备注 ID |
| talent_id | INTEGER FK | 人才 ID |
| user_id | INTEGER FK | 用户 ID |
| content | TEXT | 内容 |
| created_at | TEXT | 创建时间 |

### 7.7 跟盯记录表 (talent_followups)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 记录 ID |
| talent_id | INTEGER FK | 人才 ID |
| user_id | INTEGER FK | 用户 ID |
| type | TEXT | 类型 |
| content | TEXT | 内容 |
| next_action | TEXT | 下一步行动 |
| next_date | TEXT | 计划日期 |

### 7.8 论文表 (talent_papers)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 论文 ID |
| talent_id | INTEGER FK | 人才 ID |
| title | TEXT | 标题 |
| authors | TEXT | 作者 |
| abstract | TEXT | 摘要 |
| venue | TEXT | 期刊/会议 |
| year | INTEGER | 年份 |
| doi | TEXT | DOI |
| arxiv_id | TEXT | arXiv ID |
| pdf_url | TEXT | PDF 链接 |
| categories | TEXT | 分类 |
| citation_count | INTEGER | 引用次数 |

### 7.9 专利表 (talent_patents)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 专利 ID |
| talent_id | INTEGER FK | 人才 ID |
| title | TEXT | 标题 |
| patent_number | TEXT | 专利号 |
| patent_type | TEXT | 类型 |
| status | TEXT | 状态 |
| filing_date | TEXT | 申请日期 |
| grant_date | TEXT | 授权日期 |
| inventors | TEXT | 发明人 |
| assignee | TEXT | 权利人 |
| abstract | TEXT | 摘要 |

### 7.10 会议表 (talent_conferences)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 会议 ID |
| talent_id | INTEGER FK | 人才 ID |
| conference_name | TEXT | 会议名称 |
| role | TEXT | 角色 |
| title | TEXT | 演讲主题 |
| year | INTEGER | 年份 |
| location | TEXT | 地点 |
| url | TEXT | 链接 |

### 7.11 GitHub 项目表 (talent_github_repos)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 项目 ID |
| talent_id | INTEGER FK | 人才 ID |
| repo_name | TEXT | 项目名 |
| full_name | TEXT | 完整名称 |
| description | TEXT | 描述 |
| url | TEXT | 链接 |
| language | TEXT | 语言 |
| stars | INTEGER | Star 数 |
| forks | INTEGER | Fork 数 |
| topics | TEXT | 主题 |
| license | TEXT | 许可证 |

### 7.12 人才关联表 (talent_merges)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 关联 ID |
| primary_talent_id | INTEGER FK | 主人才 ID |
| merged_talent_id | INTEGER FK | 被合并人才 ID |
| match_type | TEXT | 关联类型 |
| match_confidence | REAL | 置信度 |
| matched_by | INTEGER FK | 操作者 |

### 7.13 API 密钥表 (api_keys)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 密钥 ID |
| user_id | INTEGER FK | 创建者 ID |
| key_hash | TEXT | 密钥哈希 |
| name | TEXT | 密钥名称 |
| permissions | TEXT | 权限 |
| last_used_at | TEXT | 最后使用时间 |
| created_at | TEXT | 创建时间 |

---

## 8. 错误码参考

### 8.1 HTTP 状态码

| 状态码 | 说明 | 常见场景 |
|--------|------|----------|
| 200 | 成功 | GET/PUT 请求成功 |
| 201 | 创建成功 | POST 请求成功 |
| 400 | 请求错误 | 缺少必填字段、参数无效 |
| 401 | 未认证 | 未提供 Token/API Key、Token 过期 |
| 403 | 权限不足 | 非管理员访问管理接口 |
| 404 | 资源不存在 | ID 对应的记录不存在 |
| 409 | 资源冲突 | 用户名/邮箱重复、关联已存在 |
| 500 | 服务器错误 | 数据库错误、未知异常 |

### 8.2 错误响应格式

```json
{
  "error": "错误描述信息"
}
```

### 8.3 常见错误信息

| 错误信息 | 状态码 | 原因 | 解决方案 |
|----------|--------|------|----------|
| 未提供认证令牌 | 401 | 请求头缺少 Authorization | 添加 Bearer Token |
| 令牌无效或已过期 | 401 | Token 格式错误或已过期 | 重新登录获取新 Token |
| 未提供API密钥 | 401 | 请求头缺少 X-API-Key | 添加 API Key |
| API密钥无效 | 401 | API Key 不存在 | 检查 Key 是否正确 |
| 需要管理员权限 | 403 | 非 admin 角色访问管理接口 | 使用管理员账号 |
| 姓名为必填项 | 400 | 创建人才时未提供 name | 添加 name 字段 |
| 用户名或邮箱已存在 | 409 | 注册时用户名/邮箱重复 | 更换用户名/邮箱 |
| 人才信息不存在 | 404 | ID 对应的人才不存在 | 检查 ID 是否正确 |

---

## 9. 快速上手指南

### 9.1 首次使用流程

1. **启动服务**
   ```bash
   # 后端
   cd server && npm start
   
   # 前端（开发模式）
   cd client && npm run dev
   ```

2. **登录系统**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   ```

3. **保存 Token**：将响应中的 `token` 保存，后续请求使用

4. **创建第一个人才**
   ```bash
   curl -X POST http://localhost:3001/api/talents \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "张三", "company": "某公司", "title": "工程师"}'
   ```

### 9.2 使用开放接口

1. **创建 API Key**（管理员操作）
   ```bash
   curl -X POST http://localhost:3001/api/admin/api-keys \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "外部系统接入", "permissions": "write"}'
   ```

2. **使用 API Key 调用接口**
   ```bash
   curl -X GET http://localhost:3001/api/open/talents \
     -H "X-API-Key: YOUR_API_KEY"
   ```

### 9.3 常见使用场景

**场景1：从 GitHub 导入开发者**
```bash
curl -X POST http://localhost:3001/api/open/import/github \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "octocat",
    "name": "The Octocat",
    "company": "GitHub",
    "location": "San Francisco"
  }'
```

**场景2：批量导入并添加备注**
```bash
# 1. 批量创建
curl -X POST http://localhost:3001/api/open/talents/batch \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"talents": [{"name": "A"}, {"name": "B"}]}'

# 2. 添加备注
curl -X POST http://localhost:3001/api/talents/1/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "优质候选人，优先联系"}'
```

**场景3：关联重复人才**
```bash
curl -X POST http://localhost:3001/api/talents/merge \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"primary_talent_id": 1, "merged_talent_id": 5}'
```

---

## 附录：数据来源枚举值

| 值 | 说明 |
|-----|------|
| manual | 手动录入 |
| github | GitHub 导入 |
| maimai | 脉脉导入 |
| linkedin | LinkedIn 导入 |
| wechat | 微信导入 |
| arxiv | arXiv 论文导入 |
| patent | 专利导入 |
| conference | 会议导入 |
| api | 通用 API 导入 |
| csv | CSV 导入 |

## 附录：跟盯记录类型枚举值

| 值 | 说明 |
|-----|------|
| call | 电话沟通 |
| wechat | 微信沟通 |
| video | 视频沟通 |
| email | 邮件联系 |
| interview | 面试 |
| meeting | 面谈 |
| note | 备注 |
| other | 其他 |

---

*文档最后更新：2024年*
