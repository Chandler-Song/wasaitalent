# WasaiTalent API Python SDK

WasaiTalent 人才管理系统后端 API 的 Python 客户端封装。

## 环境准备

Python >= 3.8

### 安装 SDK（开发模式）

```bash
cd wsapi
pip install -e ".[dev]"
```

这会将 `wsapi` 以可编辑模式安装到当前 Python 环境中，安装后即可在任意目录下 `from wsapi import ...`。

### 仅安装运行时依赖

```bash
cd wsapi
pip install -r requirements.txt
```

## 快速开始

### 1. JWT 认证模式（Auth / Talents / Admin）

```python
from wsapi import WasaiTalentClient

client = WasaiTalentClient(base_url="http://localhost:3001")

# 注册
client.auth.register("admin", "admin@example.com", "password123")

# 登录（token 自动保存）
client.auth.login("admin", "password123")

# 查看当前用户
me = client.auth.me()
print(me)  # {"user": {"id": 1, "username": "admin", ...}}
```

### 2. 人才管理（需先登录）

```python
# 创建人才
talent = client.talents.create(
    "张三",
    company="OpenAI",
    email="zhang@openai.com",
    location="北京",
    skills="Python,ML",
)
tid = talent["data"]["id"]

# 查询列表（支持 25+ 个筛选参数）
result = client.talents.list(search="张三", location="北京", page=1, limit=20)
print(result["pagination"])

# 查看详情（含 profiles / experiences / notes 等子资源）
detail = client.talents.get(tid)

# 更新
client.talents.update(tid, company="Anthropic", title="Research Engineer")

# 删除
client.talents.delete(tid)
```

### 3. 子资源管理（备注 / 经历 / 论文 / 专利 等）

```python
# 备注
client.talents.add_note(tid, "优秀候选人，建议跟进")
client.talents.list_notes(tid)
client.talents.update_note(tid, note_id=1, content="已完成初试")
client.talents.delete_note(tid, note_id=1)

# 工作经历
client.talents.add_experience(tid, company="Google", title="SWE", start_date="2020-01")
client.talents.list_experiences(tid)

# 教育经历
client.talents.add_education(tid, school="清华大学", degree="硕士", field="计算机科学")

# 论文
client.talents.add_paper(tid, "Attention Is All You Need", year=2017, venue="NeurIPS")

# 专利
client.talents.add_patent(tid, "AI 辅助编程方法", patent_type="发明专利")

# 行业会议
client.talents.add_conference(tid, "NeurIPS", role="Speaker", year=2024)

# GitHub 项目
client.talents.add_repo(tid, "transformer", language="Python", stars=5000)

# 平台档案
client.talents.create_profile(tid, "github", username="zhangsan", platform_url="https://github.com/zhangsan")

# 跟盯记录
client.talents.add_followup(tid, "已发送 offer", type="offer", next_action="等待回复", next_date="2025-02-01")
```

### 4. 人才关联/取消关联

```python
# 关联两个人才
client.talents.merge(primary_talent_id=1, merged_talent_id=2, match_type="email")

# 取消关联
client.talents.unmerge(primary_talent_id=1, merged_talent_id=2)
```

### 5. 统计查询

```python
client.talents.stats_sources()        # 按数据来源
client.talents.stats_import_methods() # 按导入方式
client.talents.stats_companies()      # 按公司（Top 20）
client.talents.stats_platforms()      # 按平台档案
```

### 6. 管理员接口（需 admin 角色）

```python
# 系统概览
dashboard = client.admin.dashboard()

# 用户管理
client.admin.list_users()
client.admin.update_user_role(user_id=2, role="viewer")
client.admin.delete_user(user_id=3)

# API Key 管理
key = client.admin.create_api_key("数据导入 Key", permissions="read,write")
api_key_value = key["data"]["key"]  # 仅在创建时返回一次
client.admin.list_api_keys()
client.admin.delete_api_key(key_id=1)
```

### 7. 开放接口（API Key 认证）

```python
client = WasaiTalentClient(
    base_url="http://localhost:3001",
    api_key="your-api-key-here",
)

# 查询人才
client.open.list_talents(search="李四", limit=50)
client.open.get_talent(1)
client.open.create_talent("王五", company="腾讯")

# 多平台导入
client.open.import_github({"login": "torvalds", "name": "Linus"})
client.open.import_github_batch([{"login": "user1"}, {"login": "user2"}])

client.open.import_maimai({"name": "张三", "company": "字节跳动"})
client.open.import_maimai_batch([{"name": "用户A"}])

client.open.import_linkedin({"name": "Alice", "company": "Google", "experience": [...]})
client.open.import_wechat({"name": "微信用户", "wechat_id": "wx123"})
client.open.import_wechat_batch([{"name": "联系人A"}])

client.open.import_arxiv({"name": "Researcher", "papers": [...]})
client.open.import_patent({"name": "Inventor", "patents": [...]})
client.open.import_conference({"name": "Speaker", "conferences": [...]})

# CSV 导入/导出
client.open.import_csv("./talents.csv")
csv_text = client.open.export_csv()

# JSON 批量导入
client.open.batch_import([{"name": "批量用户1"}, {"name": "批量用户2"}])

# 人才关联
client.open.merge(primary_talent_id=1, merged_talent_id=2)
```

## API 参考文档

> 所有方法均返回 `dict`（JSON 响应）或 `str`（CSV 导出），失败时抛出对应异常（见[异常处理](#异常处理)章节）。
> 响应结构通常为 `{"data": ...}` 或 `{"data": [...], "pagination": {...}}`。

---

### AuthAPI — 认证接口

认证相关接口，路由前缀 `/api/auth`。除 `me()` 和 `change_password()` 外，`register()` 和 `login()` 无需预先认证。

#### `register(username, email, password)`

注册新用户。成功后 **自动保存 token**，后续请求无需再手动设置。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `username` | `str` | 是 | — | 用户名，不可与已有用户重复 |
| `email` | `str` | 是 | — | 邮箱地址，不可与已有用户重复 |
| `password` | `str` | 是 | — | 密码，**至少 6 位** |

**返回值**：`{"user": {"id", "username", "email", "role", "created_at"}, "token": "..."}`

---

#### `login(username, password)`

用户登录。支持用户名或邮箱登录。成功后 **自动保存 token**。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `username` | `str` | 是 | — | 用户名或邮箱 |
| `password` | `str` | 是 | — | 密码 |

**返回值**：`{"user": {"id", "username", "email", "role"}, "token": "..."}`

---

#### `me()`

获取当前已登录用户信息。需 JWT 认证。

无参数。

**返回值**：`{"user": {"id", "username", "email", "role", "created_at", ...}}`

---

#### `change_password(old_password, new_password)`

修改当前用户密码。需 JWT 认证。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `old_password` | `str` | 是 | — | 当前密码 |
| `new_password` | `str` | 是 | — | 新密码 |

**返回值**：`{"message": "密码修改成功"}`

---

### TalentAPI — 人才管理接口

人才管理接口，路由前缀 `/api/talents`，所有方法均需 **JWT 认证**。

#### 主资源 CRUD

##### `list(**kwargs)`

获取人才列表（分页 + 多维筛选）。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `search` | `str` | 否 | — | 全局模糊搜索（匹配 name/email/company/title/skills/phone/location 等 18 个字段） |
| `data_source` | `str` | 否 | — | 数据来源精确匹配，如 `"github"`, `"linkedin"`, `"maimai"`, `"manual"`, `"csv"`, `"wechat"`, `"arxiv"`, `"patent"`, `"conference"` |
| `import_method` | `str` | 否 | — | 导入方式精确匹配，如 `"manual"`, `"api"`, `"csv_import"` |
| `status` | `str` | 否 | — | 状态枚举：`active` / `inactive` / `archived` |
| `open_to_work` | `str` | 否 | — | 是否在看机会 |
| `education` | `str` | 否 | — | 学历精确匹配，如 `"本科"`, `"硕士"`, `"博士"` |
| `gender` | `str` | 否 | — | 性别 |
| `location` | `str` | 否 | — | 地点模糊匹配 |
| `skills` | `str` | 否 | — | 技能模糊匹配，逗号分隔格式 `"Python,ML,NLP"` |
| `email` | `str` | 否 | — | 邮箱模糊匹配 |
| `phone` | `str` | 否 | — | 手机模糊匹配 |
| `wechat` | `str` | 否 | — | 微信号模糊匹配 |
| `suitable_roles` | `str` | 否 | — | 适合岗位模糊匹配 |
| `job_preference` | `str` | 否 | — | 求职偏好模糊匹配 |
| `tags` | `str` | 否 | — | 标签模糊匹配，逗号分隔格式 `"AI,Research"` |
| `linkedin_url` | `str` | 否 | — | LinkedIn URL 模糊匹配 |
| `github_url` | `str` | 否 | — | GitHub URL 模糊匹配 |
| `maimai_url` | `str` | 否 | — | 脉脉 URL 模糊匹配 |
| `homepage` | `str` | 否 | — | 个人主页 URL 模糊匹配 |
| `paper_title` | `str` | 否 | — | 论文标题模糊匹配（跨子表查询） |
| `patent_title` | `str` | 否 | — | 专利标题模糊匹配（跨子表查询） |
| `conference_name` | `str` | 否 | — | 会议名称模糊匹配（跨子表查询） |
| `experience_years_min` | `int` | 否 | — | 工作年限下限（含），非负整数 |
| `experience_years_max` | `int` | 否 | — | 工作年限上限（含），非负整数 |
| `expected_salary_min` | `float` | 否 | — | 期望薪资下限（含） |
| `expected_salary_max` | `float` | 否 | — | 期望薪资上限（含） |
| `page` | `int` | 否 | `1` | 页码，从 1 开始 |
| `limit` | `int` | 否 | `20` | 每页条数 |
| `sort` | `str` | 否 | `"created_at"` | 排序字段，可选：`name` / `created_at` / `rating` / `experience_years` / `updated_at` |
| `order` | `str` | 否 | `"DESC"` | 排序方向：`ASC` / `DESC` |

**返回值**：`{"data": [...], "pagination": {"page", "limit", "total", "totalPages"}}`

---

##### `get(talent_id)`

获取单个人才详情，包含所有子资源（profiles, experiences, educations, notes, followups, papers, patents, conferences, githubRepos）和关联人才（relatedTalents）。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

**返回值**：`{"data": {...}, "profiles": [...], "experiences": [...], "educations": [...], "notes": [...], "followups": [...], "papers": [...], "patents": [...], "conferences": [...], "githubRepos": [...], "relatedTalents": [...]}`

---

##### `create(name, **kwargs)`

创建人才记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `name` | `str` | 是 | — | 姓名 |
| `email` | `str` | 否 | `None` | 邮箱 |
| `phone` | `str` | 否 | `None` | 手机号 |
| `company` | `str` | 否 | `None` | 公司 |
| `title` | `str` | 否 | `None` | 职位 |
| `location` | `str` | 否 | `None` | 所在地 |
| `skills` | `str` | 否 | `None` | 技能，逗号分隔格式 `"Python,ML,NLP"` |
| `education` | `str` | 否 | `None` | 学历，如 `"本科"`, `"硕士"`, `"博士"` |
| `experience_years` | `int` | 否 | `None` | 工作年限，非负整数 |
| `summary` | `str` | 否 | `None` | 简介/摘要 |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `import_method` | `str` | 否 | `"manual"` | 导入方式 |
| `tags` | `str` | 否 | `None` | 标签，逗号分隔格式 `"AI,Research"` |
| `rating` | `int` | 否 | `0` | 评分，范围 0–5 |
| `status` | `str` | 否 | `"active"` | 状态枚举：`active` / `inactive` / `archived` |
| `avatar_url` | `str` | 否 | `None` | 头像 URL，需为合法 URL |
| `raw_data` | `str` | 否 | `None` | 原始数据（JSON 字符串） |
| `open_to_work` | `str` | 否 | `None` | 是否在看机会 |
| `suitable_roles` | `str` | 否 | `None` | 适合岗位 |
| `homepage` | `str` | 否 | `None` | 个人主页 URL，需为合法 URL |
| `github_url` | `str` | 否 | `None` | GitHub 主页 URL，需为合法 URL |
| `google_scholar_url` | `str` | 否 | `None` | Google Scholar URL，需为合法 URL |
| `gender` | `str` | 否 | `None` | 性别 |
| `expected_salary` | `str` | 否 | `None` | 期望薪资 |
| `job_preference` | `str` | 否 | `None` | 求职偏好 |
| `wechat` | `str` | 否 | `None` | 微信号 |
| `linkedin_url` | `str` | 否 | `None` | LinkedIn URL，需为合法 URL |
| `maimai_url` | `str` | 否 | `None` | 脉脉 URL，需为合法 URL |

**返回值**：`{"data": {...}}`

---

##### `update(talent_id, **kwargs)`

更新人才信息。可更新字段与 `create()` 相同（`name` 不再是必填）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段（同 `create()` 中的可选参数） |

**返回值**：`{"data": {...}}`

---

##### `delete(talent_id)`

删除人才及其所有关联子资源。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

**返回值**：`{"message": "删除成功"}`

---

#### 关联操作

##### `merge(primary_talent_id, merged_talent_id, match_type="manual", match_confidence=1.0)`

关联/合并两个人才记录。若已存在关联则返回 409 Conflict。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `primary_talent_id` | `int` | 是 | — | 主人才 ID |
| `merged_talent_id` | `int` | 是 | — | 被合并人才 ID，不能与主人才 ID 相同 |
| `match_type` | `str` | 否 | `"manual"` | 匹配类型，如 `"manual"`, `"email"`, `"phone"`, `"api"` |
| `match_confidence` | `float` | 否 | `1.0` | 匹配置信度，范围 0.0–1.0 |

**返回值**：`{"data": {"id", "primary_talent_id", "merged_talent_id", "match_type"}}`

---

##### `unmerge(primary_talent_id, merged_talent_id)`

取消两个人才之间的关联。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `primary_talent_id` | `int` | 是 | — | 主人才 ID |
| `merged_talent_id` | `int` | 是 | — | 被合并人才 ID |

**返回值**：`{"message": "关联已取消"}`

---

#### 统计接口

##### `stats_sources()`

按数据来源统计人才数量。无参数。

**返回值**：`{"data": [{"data_source": "github", "count": 10}, ...]}`

##### `stats_import_methods()`

按导入方式统计人才数量。无参数。

**返回值**：`{"data": [{"import_method": "manual", "count": 5}, ...]}`

##### `stats_companies()`

按公司统计人才数量（Top 20）。无参数。

**返回值**：`{"data": [{"company": "Google", "count": 3}, ...]}`

##### `stats_platforms()`

按平台档案统计数量。无参数。

**返回值**：`{"data": [{"platform": "github", "count": 15}, ...]}`

---

#### 子资源管理

> 所有子资源的 `_list` 方法返回 `{"data": [...]}`，`_create` 方法返回 `{"data": {...}}`，`_update` 方法返回 `{"data": {...}}`，`_delete` 方法返回 `{"message": "..."}`。

##### 备注（Notes）

###### `list_notes(talent_id)`

获取指定人才的所有备注。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_note(talent_id, content)`

添加备注。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `content` | `str` | 是 | — | 备注内容 |

###### `update_note(talent_id, note_id, content)`

更新备注。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `note_id` | `int` | 是 | — | 备注 ID |
| `content` | `str` | 是 | — | 新备注内容 |

###### `delete_note(talent_id, note_id)`

删除备注。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `note_id` | `int` | 是 | — | 备注 ID |

---

##### 平台档案（Profiles）

###### `create_profile(talent_id, platform, **kwargs)`

添加平台档案。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `platform` | `str` | 是 | — | 平台名称，如 `"github"`, `"linkedin"`, `"maimai"`, `"wechat"`, `"arxiv"`, `"patent"`, `"conference"` |
| `platform_id` | `str` | 否 | `None` | 平台用户 ID |
| `platform_url` | `str` | 否 | `None` | 平台主页 URL，需为合法 URL |
| `username` | `str` | 否 | `None` | 平台用户名 |
| `display_name` | `str` | 否 | `None` | 显示名称 |
| `avatar_url` | `str` | 否 | `None` | 头像 URL，需为合法 URL |
| `bio` | `str` | 否 | `None` | 个人简介 |
| `company` | `str` | 否 | `None` | 公司 |
| `location` | `str` | 否 | `None` | 所在地 |
| `email` | `str` | 否 | `None` | 邮箱 |
| `title` | `str` | 否 | `None` | 职位 |
| `raw_data` | `str` | 否 | `None` | 原始数据（JSON 字符串） |

###### `update_profile(talent_id, profile_id, **kwargs)`

更新平台档案。可更新字段同 `create_profile()` 中的可选参数（含 `platform`）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `profile_id` | `int` | 是 | — | 档案 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_profile(talent_id, profile_id)`

删除平台档案。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `profile_id` | `int` | 是 | — | 档案 ID |

---

##### 工作经历（Experiences）

###### `list_experiences(talent_id)`

获取指定人才的所有工作经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_experience(talent_id, **kwargs)`

添加工作经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `company` | `str` | 否 | `None` | 公司名称 |
| `title` | `str` | 否 | `None` | 职位 |
| `start_date` | `str` | 否 | `None` | 开始日期，格式 `YYYY-MM` 或 `YYYY-MM-DD` |
| `end_date` | `str` | 否 | `None` | 结束日期，格式 `YYYY-MM` 或 `YYYY-MM-DD`；在职中可不填 |
| `duration` | `str` | 否 | `None` | 在职时长描述，如 `"2年3个月"` |
| `location` | `str` | 否 | `None` | 工作地点 |
| `responsibilities` | `str` | 否 | `None` | 职责描述 |
| `achievements` | `str` | 否 | `None` | 业绩描述 |
| `is_current` | `int` | 否 | `0` | 是否在职：`0` 否 / `1` 是 |
| `description` | `str` | 否 | `None` | 工作描述 |
| `company_details` | `str` | 否 | `None` | 公司详情（JSON 字符串） |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_experience(talent_id, exp_id, **kwargs)`

更新工作经历。可更新字段同 `add_experience()` 中的可选参数。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `exp_id` | `int` | 是 | — | 经历 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_experience(talent_id, exp_id)`

删除工作经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `exp_id` | `int` | 是 | — | 经历 ID |

---

##### 教育经历（Educations）

###### `list_educations(talent_id)`

获取指定人才的所有教育经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_education(talent_id, **kwargs)`

添加教育经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `school` | `str` | 否 | `None` | 学校名称 |
| `degree` | `str` | 否 | `None` | 学位/学历，如 `"本科"`, `"硕士"`, `"博士"` |
| `field` | `str` | 否 | `None` | 专业方向 |
| `start_date` | `str` | 否 | `None` | 开始日期，格式 `YYYY-MM` 或 `YYYY-MM-DD` |
| `end_date` | `str` | 否 | `None` | 结束日期，格式 `YYYY-MM` 或 `YYYY-MM-DD` |
| `dates` | `str` | 否 | `None` | 日期描述（替代 start/end_date），如 `"2018-2022"` |
| `location` | `str` | 否 | `None` | 学校所在地 |
| `ranking_info` | `str` | 否 | `None` | 排名信息（JSON 字符串） |
| `description` | `str` | 否 | `None` | 描述 |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_education(talent_id, edu_id, **kwargs)`

更新教育经历。可更新字段同 `add_education()` 中的可选参数。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `edu_id` | `int` | 是 | — | 教育经历 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_education(talent_id, edu_id)`

删除教育经历。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `edu_id` | `int` | 是 | — | 教育经历 ID |

---

##### 跟盯记录（Followups）

###### `list_followups(talent_id)`

获取指定人才的所有跟盯记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_followup(talent_id, content, **kwargs)`

添加跟盯记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `content` | `str` | 是 | — | 跟盯内容 |
| `type` | `str` | 否 | `"note"` | 记录类型，如 `"note"`, `"call"`, `"email"`, `"meeting"`, `"offer"` |
| `next_action` | `str` | 否 | `None` | 下一步行动 |
| `next_date` | `str` | 否 | `None` | 下次行动日期，格式 `YYYY-MM-DD` |

###### `update_followup(talent_id, fid, **kwargs)`

更新跟盯记录。可更新字段：`type`, `content`, `next_action`, `next_date`。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `fid` | `int` | 是 | — | 跟盯记录 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_followup(talent_id, fid)`

删除跟盯记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `fid` | `int` | 是 | — | 跟盯记录 ID |

---

##### 论文（Papers）

###### `list_papers(talent_id)`

获取指定人才的所有论文。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_paper(talent_id, title, **kwargs)`

添加论文。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `title` | `str` | 是 | — | 论文标题 |
| `authors` | `str` | 否 | `None` | 作者列表，逗号分隔 `"Author1, Author2"` |
| `abstract` | `str` | 否 | `None` | 摘要 |
| `venue` | `str` | 否 | `None` | 发表期刊/会议，如 `"NeurIPS"`, `"Nature"` |
| `year` | `int` | 否 | `None` | 发表年份，如 `2024` |
| `doi` | `str` | 否 | `None` | DOI 编号，如 `"10.1000/xyz123"` |
| `arxiv_id` | `str` | 否 | `None` | arXiv ID，如 `"2301.12345"` |
| `pdf_url` | `str` | 否 | `None` | PDF 链接 URL，需为合法 URL |
| `categories` | `str` | 否 | `None` | 分类，逗号分隔 `"cs.AI,cs.CL"` |
| `citation_count` | `int` | 否 | `0` | 引用次数，非负整数 |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_paper(talent_id, paper_id, **kwargs)`

更新论文。可更新字段同 `add_paper()` 中的可选参数（含 `title`）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `paper_id` | `int` | 是 | — | 论文 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_paper(talent_id, paper_id)`

删除论文。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `paper_id` | `int` | 是 | — | 论文 ID |

---

##### 专利（Patents）

###### `list_patents(talent_id)`

获取指定人才的所有专利。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_patent(talent_id, title, **kwargs)`

添加专利。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `title` | `str` | 是 | — | 专利标题 |
| `patent_number` | `str` | 否 | `None` | 专利号，如 `"CN202310001234.5"` |
| `patent_type` | `str` | 否 | `None` | 专利类型，如 `"发明专利"`, `"实用新型"`, `"外观设计"` |
| `status` | `str` | 否 | `None` | 状态，如 `"已授权"`, `"申请中"`, `"已公开"` |
| `filing_date` | `str` | 否 | `None` | 申请日期，格式 `YYYY-MM-DD` |
| `grant_date` | `str` | 否 | `None` | 授权日期，格式 `YYYY-MM-DD` |
| `inventors` | `str` | 否 | `None` | 发明人列表，逗号分隔 `"Inventor1, Inventor2"` |
| `assignee` | `str` | 否 | `None` | 专利权人/受让人 |
| `abstract` | `str` | 否 | `None` | 专利摘要 |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_patent(talent_id, patent_id, **kwargs)`

更新专利。可更新字段同 `add_patent()` 中的可选参数（含 `title`）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `patent_id` | `int` | 是 | — | 专利 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_patent(talent_id, patent_id)`

删除专利。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `patent_id` | `int` | 是 | — | 专利 ID |

---

##### 行业会议（Conferences）

###### `list_conferences(talent_id)`

获取指定人才的所有会议记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_conference(talent_id, conference_name, **kwargs)`

添加会议记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `conference_name` | `str` | 是 | — | 会议名称，如 `"NeurIPS 2024"` |
| `role` | `str` | 否 | `None` | 参会角色，如 `"Speaker"`, `"Attendee"`, `"Organizer"` |
| `title` | `str` | 否 | `None` | 演讲/报告标题 |
| `year` | `int` | 否 | `None` | 年份，如 `2024` |
| `location` | `str` | 否 | `None` | 会议地点 |
| `url` | `str` | 否 | `None` | 会议官网 URL，需为合法 URL |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_conference(talent_id, conf_id, **kwargs)`

更新会议记录。可更新字段同 `add_conference()` 中的可选参数（含 `conference_name`）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `conf_id` | `int` | 是 | — | 会议记录 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_conference(talent_id, conf_id)`

删除会议记录。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `conf_id` | `int` | 是 | — | 会议记录 ID |

---

##### GitHub 项目（Repos）

###### `list_repos(talent_id)`

获取指定人才的所有 GitHub 项目。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

###### `add_repo(talent_id, repo_name, **kwargs)`

添加 GitHub 项目。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `repo_name` | `str` | 是 | — | 仓库名称，如 `"transformer"` |
| `full_name` | `str` | 否 | `None` | 完整仓库名，如 `"user/transformer"` |
| `description` | `str` | 否 | `None` | 项目描述 |
| `url` | `str` | 否 | `None` | 仓库 URL，需为合法 URL |
| `language` | `str` | 否 | `None` | 主要编程语言，如 `"Python"`, `"JavaScript"` |
| `stars` | `int` | 否 | `0` | Star 数，非负整数 |
| `forks` | `int` | 否 | `0` | Fork 数，非负整数 |
| `open_issues` | `int` | 否 | `0` | 开放 Issue 数，非负整数 |
| `is_fork` | `int` | 否 | `0` | 是否为 Fork：`0` 否 / `1` 是 |
| `topics` | `str` | 否 | `None` | 项目标签，逗号分隔 `"ai,nlp,transformer"` |
| `license` | `str` | 否 | `None` | 开源协议，如 `"MIT"`, `"Apache-2.0"` |
| `last_pushed_at` | `str` | 否 | `None` | 最后推送时间，格式 `YYYY-MM-DD` 或 ISO 8601 |
| `data_source` | `str` | 否 | `"manual"` | 数据来源 |
| `sort_order` | `int` | 否 | `0` | 排序序号 |

###### `update_repo(talent_id, repo_id, **kwargs)`

更新 GitHub 项目。可更新字段同 `add_repo()` 中的可选参数（含 `repo_name`）。至少提供一个字段。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `repo_id` | `int` | 是 | — | 项目 ID |
| `**kwargs` | — | 是 | — | 至少一个可更新字段 |

###### `delete_repo(talent_id, repo_id)`

删除 GitHub 项目。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |
| `repo_id` | `int` | 是 | — | 项目 ID |

---

### AdminAPI — 管理员接口

管理员接口，路由前缀 `/api/admin`，所有方法均需 **JWT 认证 + admin 角色**。

#### `dashboard()`

获取系统概览统计。无参数。

**返回值**：`{"data": {"totalUsers", "totalTalents", "totalNotes", "totalApiKeys", "totalProfiles", "totalMerges", "sourceStats", "importMethodStats", "platformStats", "recentTalents", "recentUsers"}}`

---

#### `list_users()`

获取所有用户列表。无参数。

**返回值**：`{"data": [{"id", "username", "email", "role", "created_at", "updated_at"}, ...]}`

---

#### `update_user_role(user_id, role)`

修改用户角色。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `user_id` | `int` | 是 | — | 用户 ID |
| `role` | `str` | 是 | — | 角色枚举：`admin` / `user` / `viewer` |

**返回值**：`{"message": "角色更新成功"}`

---

#### `delete_user(user_id)`

删除用户（不能删除自己）。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `user_id` | `int` | 是 | — | 用户 ID，不能是当前登录用户的 ID |

**返回值**：`{"message": "用户删除成功"}`

---

#### `create_api_key(name="Default Key", permissions="read")`

创建 API 密钥。**密钥值仅在创建时返回一次**。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `name` | `str` | 否 | `"Default Key"` | 密钥名称/用途描述 |
| `permissions` | `str` | 否 | `"read"` | 权限，逗号分隔，如 `"read"`, `"read,write"` |

**返回值**：`{"data": {"id", "name", "key", "permissions"}}`

---

#### `list_api_keys()`

获取 API 密钥列表（不含密钥值）。无参数。

**返回值**：`{"data": [{"id", "name", "permissions", "last_used_at", "created_at"}, ...]}`

---

#### `delete_api_key(key_id)`

删除 API 密钥。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `key_id` | `int` | 是 | — | 密钥 ID |

**返回值**：`{"message": "API密钥删除成功"}`

---

### OpenAPI — 开放接口

开放接口，路由前缀 `/api/open`，所有方法均需 **API Key 认证**（通过 `X-API-Key` 请求头传递）。

#### 通用人才操作

##### `list_talents(**kwargs)`

获取人才列表（简化版，无分页包装）。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `search` | `str` | 否 | — | 全局模糊搜索（匹配 name/email/company/skills） |
| `data_source` | `str` | 否 | — | 数据来源精确匹配 |
| `import_method` | `str` | 否 | — | 导入方式精确匹配 |
| `limit` | `int` | 否 | `100` | 返回条数上限 |
| `offset` | `int` | 否 | `0` | 偏移量，用于翻页 |

**返回值**：`{"data": [...]}`

---

##### `get_talent(talent_id)`

获取单个人才详情 + profiles。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talent_id` | `int` | 是 | — | 人才 ID |

**返回值**：`{"data": {...}, "profiles": [...]}`

---

##### `create_talent(name, **kwargs)`

创建人才。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `name` | `str` | 是 | — | 姓名 |
| `email` | `str` | 否 | `None` | 邮箱 |
| `phone` | `str` | 否 | `None` | 手机号 |
| `company` | `str` | 否 | `None` | 公司 |
| `title` | `str` | 否 | `None` | 职位 |
| `location` | `str` | 否 | `None` | 所在地 |
| `skills` | `str` | 否 | `None` | 技能，逗号分隔 `"Python,ML"` |
| `education` | `str` | 否 | `None` | 学历 |
| `experience_years` | `int` | 否 | `None` | 工作年限，非负整数 |
| `summary` | `str` | 否 | `None` | 简介 |
| `data_source` | `str` | 否 | `"api"` | 数据来源 |
| `import_method` | `str` | 否 | `"api"` | 导入方式 |
| `tags` | `str` | 否 | `None` | 标签，逗号分隔 |
| `rating` | `int` | 否 | `0` | 评分，范围 0–5 |
| `status` | `str` | 否 | `"active"` | 状态：`active` / `inactive` / `archived` |
| `avatar_url` | `str` | 否 | `None` | 头像 URL |
| `raw_data` | `str` | 否 | `None` | 原始数据（JSON 字符串） |

**返回值**：`{"data": {...}}`

---

#### 平台导入

##### `import_github(data)`

GitHub 单条导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | GitHub 用户数据。需包含 `login` 或 `name` 至少一个。可选字段：`login`, `name`, `id`, `company`, `location`, `email`, `bio`, `avatar_url`, `html_url` |

**返回值**：`{"data": {...}}`

---

##### `import_github_batch(users)`

GitHub 批量导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `users` | `list[dict]` | 是 | — | GitHub 用户列表，每个元素需含 `login` 或 `name`。字段同 `import_github()` |

**返回值**：`{"data": {"imported": int, "errors": [...]}}`

---

##### `import_maimai(data)`

脉脉单条导入。支持两种格式：
- **详细格式**：含 `basic_info` 对象（字段：`name`, `current_company`, `current_position`, `location`, `tags`, `education_level`, `total_work_experience_years`, `gender`, `expected_salary`, `job_preference`, `major`）+ 可选 `work_history` 数组 + 可选 `education_history` 数组 + `links` 对象 + `profile_id`
- **简略格式**：含 `name`, `company`, `position`, `province`, `city`, `avatar`, `detail_url`, `sdegree`, `school`, `worktime`, `salary`, `tag_list`

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | 脉脉用户数据，详细格式需含 `basic_info.name`；简略格式需含 `name` |

**返回值**：`{"data": {...}}`

---

##### `import_maimai_batch(users)`

脉脉批量导入（使用简略格式）。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `users` | `list[dict]` | 是 | — | 脉脉用户列表，每个元素需含 `name`。字段同简略格式 |

**返回值**：`{"data": {"imported": int, "errors": [...]}}`

---

##### `import_linkedin(data)`

LinkedIn 导入。支持两种格式：
- **完整简历格式**：含 `name` + `experience` 数组 + `education` 数组 + 可选 `skills`、`open_to_work`、`suitable_job_roles`、`homepage`、`github`、`google_scholar`、`linkedin`、`bio_summary`
- **简略文本格式**：含 `name` 或 `raw_text` + 可选 `email`、`company`、`title`、`location`、`linkedin_url`

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | LinkedIn 用户数据。完整格式需含 `name` 且同时含 `experience`/`education` 或 `company`/`title`/`location`；简略格式需含 `name` 或 `raw_text` |

**返回值**：`{"data": {...}}`

---

##### `import_wechat(data)`

微信单条导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | 微信用户数据。需含 `name` 或 `nickname` 至少一个。可选字段：`wechat_id`/`wechat`/`username`, `company`, `title`/`position`, `location`/`city`, `phone`, `email`, `avatar_url`/`head_img_url`, `tags`, `profile_url` |

**返回值**：`{"data": {...}}`

---

##### `import_wechat_batch(contacts)`

微信批量导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `contacts` | `list[dict]` | 是 | — | 微信联系人数组，每个元素需含 `name` 或 `nickname`。字段同 `import_wechat()` |

**返回值**：`{"data": {"imported": int, "errors": [...]}}`

---

##### `import_arxiv(data)`

arXiv 论文作者导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | 作者数据。需含 `name`（作者姓名）。可选字段：`email`, `affiliation`/`institution`, `categories`（逗号或数组）, `homepage`, `google_scholar`, `arxiv_profile_url`, `papers`（论文数组，每个含 `title`, `authors`, `abstract`/`summary`, `venue`/`journal`, `year`/`published_year`, `doi`, `arxiv_id`/`id`, `pdf_url`, `categories`, `citation_count`） |

**返回值**：`{"data": {...}}`

---

##### `import_patent(data)`

专利导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | 发明人数据。需含 `name`。可选字段：`company`/`assignee`, `patents`（专利数组，每个含 `title`, `patent_number`/`number`, `patent_type`/`type`, `status`, `filing_date`, `grant_date`, `inventors`, `assignee`, `abstract`） |

**返回值**：`{"data": {...}}`

---

##### `import_conference(data)`

行业会议导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `data` | `dict` | 是 | — | 参会人数据。需含 `name`。可选字段：`company`/`affiliation`, `title`, `email`, `conferences`（会议数组，每个含 `conference_name`/`name`, `role`, `title`, `year`, `location`, `url`） |

**返回值**：`{"data": {...}}`

---

#### CSV / 批量操作

##### `import_csv(file_path)`

CSV 文件上传导入（`multipart/form-data`）。CSV 文件需含 `name` 列（表头），可选列：`email`, `phone`, `company`, `title`, `location`, `skills`, `education`, `experience_years`, `summary`, `data_source`, `tags`, `rating`, `status`。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `file_path` | `str` | 是 | — | 本地 CSV 文件路径，文件大小不超过 10MB |

**返回值**：`{"data": {"imported": int, "errors": [...]}}`

---

##### `export_csv()`

导出所有人才数据为 CSV 文件。

无参数。

**返回值**：`str` — CSV 文本内容，包含列：`id`, `name`, `email`, `phone`, `company`, `title`, `location`, `skills`, `education`, `experience_years`, `summary`, `data_source`, `import_method`, `tags`, `rating`, `status`, `created_at`

---

##### `batch_import(talents)`

JSON 批量导入。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `talents` | `list[dict]` | 是 | — | 人才数据数组，每个元素需含 `name`。可选字段同 `create_talent()` |

**返回值**：`{"data": {"imported": int, "errors": [...]}}`

---

##### `merge(primary_talent_id, merged_talent_id, match_type="api", match_confidence=1.0)`

人才关联。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `primary_talent_id` | `int` | 是 | — | 主人才 ID |
| `merged_talent_id` | `int` | 是 | — | 被合并人才 ID，不能与主人才 ID 相同 |
| `match_type` | `str` | 否 | `"api"` | 匹配类型 |
| `match_confidence` | `float` | 否 | `1.0` | 匹配置信度，范围 0.0–1.0 |

**返回值**：`{"data": {"id", "primary_talent_id", "merged_talent_id"}}`

---

## 数据导入工具（importers）

`wsapi.importers` 子模块提供 LinkedIn 简历和脉脉平台数据的标准化导入功能，内置 Schema 校验、字段映射和逐条子资源导入。

### 安装额外依赖

```bash
pip install jsonschema>=4.0.0
```

> `jsonschema` 已包含在 `pyproject.toml` 的 dependencies 中，使用 `pip install -e ".[dev]"` 会自动安装。

### LinkedIn 简历导入

接受符合 JSON Schema 的结构化简历数据（通常由大模型从原始简历中提取），自动创建人才记录并填充工作经历和教育经历。

```python
from wsapi import WasaiTalentClient
from wsapi.importers import import_linkedin

client = WasaiTalentClient(base_url="http://localhost:3001")
client.auth.login("user", "user123")

# 符合 Schema 的简历数据
linkedin_data = {
    "name": "张三",
    "title": "Senior Engineer",
    "company": "Microsoft",
    "location": "Beijing",
    "email": "zhang@example.com",
    "linkedin": "https://linkedin.com/in/zhangsan",
    "github": "https://github.com/zhangsan",
    "highest_degree": "硕士",
    "experience_years": 5,
    "skills": ["Python", "Go", "Kubernetes"],
    "suitable_job_roles": ["Backend Engineer", "SRE"],
    "experience": [
        {
            "company": "Microsoft",
            "title": "Senior Engineer",
            "start_date": "2020-03",
            "end_date": "2025-06",
            "duration": 5,
            "is_current": 0,
            "description": "Cloud infrastructure..."
        }
    ],
    "education": [
        {
            "school": "清华大学",
            "degree": "硕士",
            "field": "计算机科学",
            "start_year": 2017,
            "end_year": 2020
        }
    ]
}

# 导入（自动校验 Schema → 创建人才 → 添加经历 → 添加教育）
talent_id = import_linkedin(client, linkedin_data)
print(f"Created talent: {talent_id}")

# 跳过 Schema 校验（不推荐）
talent_id = import_linkedin(client, linkedin_data, validate=False)

# 自定义数据来源标记
talent_id = import_linkedin(client, linkedin_data, data_source="linkedin", import_method="ai_extract")
```

**`import_linkedin` 参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `client` | `WasaiTalentClient` | 必填 | SDK 客户端实例（已登录） |
| `data` | `dict` | 必填 | 符合 Schema 的简历数据 |
| `validate` | `bool` | `True` | 是否执行 Schema 校验 |
| `data_source` | `str` | `"manual"` | 数据来源标记 |
| `import_method` | `str` | `"manual"` | 导入方式标记 |

### 脉脉数据导入

解析脉脉平台原始 JSON 数据，自动提取技能、标签、职位偏好等信息并导入。

```python
from wsapi import WasaiTalentClient
from wsapi.importers import import_maimai

client = WasaiTalentClient(base_url="http://localhost:3001")
client.auth.login("admin", "admin123")

# 脉脉原始数据（通常从 API 或爬虫获取）
maimai_data = {
    "code": 0,
    "msg": "success",
    "data": {
        "name": "李四",
        "email": "lisi@test.com",
        "phone": "13900000000",
        "company": "字节跳动",
        "position": "后端架构师",
        "province": "北京",
        "skills_tag": ["Java", "SpringBoot", "Docker"],
        "tags": ["架构", "高并发"],
        "work_time": "8年",
        "sdegree": "硕士",
        "summary": "8年架构经验...",
        "job_preferences": {
            "positions": ["技术总监", "架构师"],
            "salary": "80w-120w",
            "looking_for_job": 0
        },
        "exp": [
            {
                "company": "字节跳动",
                "position": "架构师",
                "start_date": "2019-07",
                "is_leave": 0,
                "worktime": "至今",
                "description": "负责广告系统架构..."
            }
        ],
        "edu": [
            {
                "school": "上海交通大学",
                "sdegree": "硕士",
                "department": "计算机科学",
                "start_date": "2013-09",
                "end_date": "2016-06",
                "judge": 1
            }
        ]
    }
}

# 导入
talent_id = import_maimai(client, maimai_data)
print(f"Created talent: {talent_id}")
```

**`import_maimai` 参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `client` | `WasaiTalentClient` | 必填 | SDK 客户端实例（已登录） |
| `maimai_data` | `dict` | 必填 | 脉脉原始数据（含 `data` 键） |
| `data_source` | `str` | `"maimai"` | 数据来源标记 |
| `import_method` | `str` | `"auto_parse"` | 导入方式标记 |

### Schema 校验

LinkedIn 导入内置 JSON Schema（Draft-07）校验，也可单独使用：

```python
from wsapi.importers import validate_linkedin_data, SchemaValidationError, LINKEDIN_RESUME_SCHEMA

# 单独校验数据
try:
    validate_linkedin_data(my_data)
    print("数据合法 ✓")
except SchemaValidationError as e:
    print(f"校验失败: {e.errors}")

# 访问 Schema 定义
print(LINKEDIN_RESUME_SCHEMA["required"])
```

### 辅助工具函数

```python
from wsapi.importers import (
    safe_get,          # 安全获取嵌套字典值
    parse_int,         # 字符串转整数（"8年" → 8）
    parse_list_to_csv, # 列表转 CSV（["a","b"] → "a,b"）
    parse_date,        # 标准化日期为 YYYY-MM
    to_json_str,       # 对象转 JSON 字符串
    filter_none,       # 过滤字典中的 None 值
)

# 使用示例
val = safe_get({"a": {"b": 1}}, "a", "b")  # → 1
years = parse_int("8年")                    # → 8
csv = parse_list_to_csv(["Python", "Go"])   # → "Python,Go"
date = parse_date("2024-03")                # → "2024-03"
```

## 异常处理

```python
from wsapi import (
    WasaiAPIError,       # 基础异常
    AuthenticationError, # 401
    ForbiddenError,      # 403
    NotFoundError,       # 404
    ConflictError,       # 409
    ValidationError,     # 400
    ServerError,         # 500
)

try:
    client.talents.get(999)
except NotFoundError as e:
    print(e.status_code, e.message)
except WasaiAPIError as e:
    print(f"API 错误: {e}")
```

## 运行测试

```bash
# 推荐方式：在 wsapi/ 目录下执行 pytest（会自动发现 tests/ 目录）
cd wsapi
pytest -v

# 也可以从项目根目录执行
cd project-root
pytest wsapi/tests/ -v

# 运行单个测试文件
cd wsapi
pytest tests/test_admin.py -v
```

## 目录结构

```
wsapi/
├── __init__.py          # 包入口，导出所有公共类 + 导入函数
├── client.py            # 核心实现：_BaseClient + AuthAPI/TalentAPI/AdminAPI/OpenAPI + WasaiTalentClient
├── exceptions.py        # 自定义异常类
├── importers/           # 数据导入工具集
│   ├── __init__.py      # 导出 import_linkedin / import_maimai + 工具函数
│   ├── linkedin.py      # LinkedIn 简历导入实现
│   ├── maimai.py        # 脉脉数据导入实现
│   ├── schema.py        # JSON Schema 定义与校验
│   └── utils.py         # 辅助函数（safe_get / parse_int / parse_date 等）
├── pyproject.toml      # 包构建配置 & pytest 配置
├── requirements.txt     # 依赖声明（兼容旧方式）
├── README.md            # 本文档
├── demo/                # 原始示例脚本（供参考）
└── tests/
    ├── conftest.py      # pytest 公共 fixtures（mock_api / client）
    ├── test_auth.py     # AuthAPI 测试
    ├── test_talents.py  # TalentAPI 测试
    ├── test_admin.py    # AdminAPI 测试
    └── test_openapi.py  # OpenAPI 测试
```
