"""LinkedIn 简历数据 JSON Schema 定义与校验"""

from typing import Any, Dict, List, Tuple

# ---------------------------------------------------------------------------
# JSON Schema (Draft-07)
# ---------------------------------------------------------------------------

LINKEDIN_RESUME_SCHEMA: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Resume Extraction Schema",
    "description": "用于从简历文本中提取关键信息的结构化数据格式，适用于大模型识别与转换",
    "type": "object",
    "required": [
        "name",
        "highest_degree",
        "experience_years",
        "skills",
        "suitable_job_roles",
        "experience",
        "education",
    ],
    "additionalProperties": False,
    "properties": {
        "name": {"type": "string", "description": "姓名"},
        "title": {"type": "string", "description": "当前职位名称"},
        "company": {"type": "string", "description": "当前所在公司"},
        "position": {"type": "string", "description": "具体职务（可能与 title 相同）"},
        "location": {"type": "string", "description": "工作所在地"},
        "email": {"type": "string", "description": "电子邮箱地址"},
        "phone": {"type": "string", "description": "电话号码"},
        "linkedin": {"type": "string", "description": "LinkedIn 链接"},
        "github": {"type": "string", "description": "GitHub 链接"},
        "google_scholar": {"type": "string", "description": "Google Scholar 链接"},
        "homepage": {"type": "string", "description": "个人主页"},
        "highest_degree": {
            "type": "string",
            "enum": ["未知", "专科", "本科", "硕士", "博士"],
            "description": "最高学历（枚举）",
        },
        "experience_years": {
            "type": "integer",
            "minimum": 0,
            "description": "工作总年限（非负整数）",
        },
        "summary": {
            "type": "string",
            "maxLength": 500,
            "description": "英文个人简介，不超过500个字符",
        },
        "bio_summary": {
            "type": "string",
            "maxLength": 500,
            "description": "中文个人简介",
        },
        "open_to_work": {
            "type": "string",
            "enum": ["开放机会", "在职观望", "不找工作", "暂不考虑", "其他"],
            "description": "求职状态（枚举）",
        },
        "skills": {
            "type": "array",
            "maxItems": 5,
            "items": {"type": "string"},
            "description": "最具代表性的技能，最多5个",
        },
        "suitable_job_roles": {
            "type": "array",
            "maxItems": 5,
            "items": {"type": "string"},
            "description": "最匹配的职位角色，最多5个",
        },
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["company", "title", "start_date", "end_date", "duration"],
                "additionalProperties": False,
                "properties": {
                    "company": {"type": "string", "description": "公司名称"},
                    "title": {"type": "string", "description": "职位"},
                    "start_date": {
                        "type": "string",
                        "pattern": "^[0-9]{4}-[0-9]{2}$",
                        "description": "开始日期 YYYY-MM",
                    },
                    "end_date": {
                        "type": "string",
                        "pattern": "^[0-9]{4}-[0-9]{2}$",
                        "description": "结束日期 YYYY-MM",
                    },
                    "duration": {
                        "type": "integer",
                        "minimum": 1,
                        "description": "持续年数（向上取整）",
                    },
                    "location": {"type": "string", "description": "工作地点"},
                    "is_current": {
                        "type": "integer",
                        "enum": [0, 1],
                        "description": "是否当前工作（1=是）",
                    },
                    "description": {
                        "type": "string",
                        "maxLength": 800,
                        "description": "工作内容描述",
                    },
                    "company_details": {"type": "string", "description": "公司额外信息"},
                },
            },
            "description": "工作经历列表，按时间倒序",
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["school", "degree", "field", "start_year", "end_year"],
                "additionalProperties": False,
                "properties": {
                    "school": {"type": "string", "description": "学校名称"},
                    "degree": {
                        "type": "string",
                        "enum": ["专科", "本科", "硕士", "博士"],
                        "description": "学位（枚举）",
                    },
                    "field": {"type": "string", "description": "专业领域"},
                    "start_year": {
                        "type": "integer",
                        "minimum": 1900,
                        "maximum": 2100,
                        "description": "入学年份",
                    },
                    "end_year": {
                        "type": "integer",
                        "minimum": 1900,
                        "maximum": 2100,
                        "description": "毕业年份",
                    },
                    "location": {"type": "string", "description": "学校所在地"},
                    "ranking_info": {"type": "string", "description": "C9,985,211,QSTop500,unknown"},
                    "description": {"type": "string", "description": "教育补充说明"},
                    "sort_order": {"type": "integer", "description": "排序序号"},
                },
            },
            "description": "教育经历列表，按时间倒序",
        },
    },
}


class SchemaValidationError(Exception):
    """Schema 校验失败时抛出的异常"""

    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"数据校验失败，共 {len(errors)} 个错误:\n" + "\n".join(f"  - {e}" for e in errors))


def validate_linkedin_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    校验 LinkedIn 简历数据是否符合 Schema。

    优先使用 jsonschema 库进行完整校验；若未安装则回退到轻量级手动校验。

    Args:
        data: 待校验的字典

    Returns:
        (is_valid, errors) 元组

    Raises:
        SchemaValidationError: 校验失败时抛出
    """
    try:
        import jsonschema
        validator = jsonschema.Draft7Validator(LINKEDIN_RESUME_SCHEMA)
        errors = [err.message for err in validator.iter_errors(data)]
        if errors:
            raise SchemaValidationError(errors)
        return True, []
    except ImportError:
        # 回退：轻量级手动校验
        return _manual_validate(data)


def _manual_validate(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """轻量级手动校验（jsonschema 未安装时的降级方案）"""
    errors: List[str] = []

    required_fields = ["name", "highest_degree", "experience_years", "skills",
                       "suitable_job_roles", "experience", "education"]
    for field in required_fields:
        if field not in data:
            errors.append(f"缺少必填字段: {field}")

    if not isinstance(data.get("name"), str) or not data.get("name"):
        errors.append("name 必须是非空字符串")

    if data.get("highest_degree") and data["highest_degree"] not in ["未知", "专科", "本科", "硕士", "博士"]:
        errors.append(f"highest_degree 值无效: {data['highest_degree']}")

    if not isinstance(data.get("experience_years"), int) or data.get("experience_years", 0) < 0:
        errors.append("experience_years 必须是非负整数")

    if not isinstance(data.get("skills"), list):
        errors.append("skills 必须是数组")
    elif len(data["skills"]) > 5:
        errors.append("skills 最多 5 项")

    if not isinstance(data.get("suitable_job_roles"), list):
        errors.append("suitable_job_roles 必须是数组")
    elif len(data["suitable_job_roles"]) > 5:
        errors.append("suitable_job_roles 最多 5 项")

    if not isinstance(data.get("experience"), list):
        errors.append("experience 必须是数组")
    else:
        for i, exp in enumerate(data["experience"]):
            for k in ("company", "title", "start_date", "end_date", "duration"):
                if k not in exp:
                    errors.append(f"experience[{i}] 缺少必填字段: {k}")

    if not isinstance(data.get("education"), list):
        errors.append("education 必须是数组")
    else:
        for i, edu in enumerate(data["education"]):
            for k in ("school", "degree", "field", "start_year", "end_year"):
                if k not in edu:
                    errors.append(f"education[{i}] 缺少必填字段: {k}")

    if errors:
        raise SchemaValidationError(errors)
    return True, []
