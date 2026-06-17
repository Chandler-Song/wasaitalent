# WasaiTalent API Python SDK

WasaiTalent 人才管理系统后端 API 的 Python 客户端封装。

## 环境准备

Python >= 3.8

```bash
cd wsapi
pip install -r requirements.txt
```

## 安装

将 `wsapi` 目录作为本地包使用，或在项目 `requirements.txt` 中引用：

```
requests>=2.28.0
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
cd wsapi
pip install -r requirements.txt
pytest tests/ -v
```

## 目录结构

```
wsapi/
├── __init__.py          # 包入口，导出所有公共类
├── client.py            # 核心实现：_BaseClient + AuthAPI/TalentAPI/AdminAPI/OpenAPI + WasaiTalentClient
├── exceptions.py        # 自定义异常类
├── requirements.txt     # 依赖声明
├── README.md            # 本文档
└── tests/
    ├── conftest.py      # pytest 公共 fixtures（mock_api / client）
    ├── test_auth.py     # AuthAPI 测试
    ├── test_talents.py  # TalentAPI 测试
    ├── test_admin.py    # AdminAPI 测试
    └── test_openapi.py  # OpenAPI 测试
```
