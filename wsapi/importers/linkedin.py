"""LinkedIn 简历数据导入模块

将符合 Schema 的 JSON 简历数据导入到 WasaiTalent 系统中，
自动创建人才记录并填充工作经历和教育经历。
"""

import json
import logging
from typing import Any, Dict, Optional

from .schema import validate_linkedin_data, SchemaValidationError
from .utils import filter_none

logger = logging.getLogger(__name__)


def import_linkedin(
    client,
    data: Dict[str, Any],
    *,
    validate: bool = True,
    data_source: str = "manual",
    import_method: str = "manual",
) -> Optional[int]:
    """
    从 LinkedIn 简历 JSON 数据导入人才记录。

    流程：
      1. 校验数据（可选）
      2. 创建人才主记录
      3. 逐条添加工作经历
      4. 逐条添加教育经历

    Args:
        client: WasaiTalentClient 实例（已登录）
        data: 符合 LINKEDIN_RESUME_SCHEMA 的字典
        validate: 是否执行 Schema 校验，默认 True
        data_source: 数据来源标记，默认 "manual"
        import_method: 导入方式标记，默认 "manual"

    Returns:
        创建成功后的人才 ID（int），失败时返回 None

    Raises:
        SchemaValidationError: validate=True 且数据不符合 Schema 时
        Exception: API 调用失败时（内部 catch 并记录日志，不会向上抛出）

    Example:
        >>> from wsapi import WasaiTalentClient
        >>> from wsapi.importers import import_linkedin
        >>> client = WasaiTalentClient(base_url="http://localhost:3001")
        >>> client.auth.login("admin", "admin123")
        >>> talent_id = import_linkedin(client, linkedin_json_data)
    """
    # --- 1. Schema 校验 ---
    if validate:
        logger.info("正在校验 LinkedIn 数据...")
        validate_linkedin_data(data)
        logger.info("数据校验通过 ✓")

    # --- 2. 构建创建参数 ---
    skills_str = ",".join(data.get("skills", []))
    suitable_roles_str = ",".join(data.get("suitable_job_roles", []))

    create_kwargs = filter_none({
        "name": data["name"],
        "company": data.get("company"),
        "title": data.get("title"),
        "location": data.get("location"),
        "email": data.get("email") or None,
        "phone": data.get("phone") or None,
        "linkedin_url": data.get("linkedin"),
        "github_url": data.get("github"),
        "google_scholar_url": data.get("google_scholar"),
        "homepage": data.get("homepage"),
        "education": data.get("highest_degree"),
        "experience_years": data.get("experience_years"),
        "summary": data.get("summary"),
        "bio_summary": data.get("bio_summary"),
        "data_source": data_source,
        "import_method": import_method,
        "tags": suitable_roles_str,
        "status": "active",
        "open_to_work": data.get("open_to_work") or None,
        "suitable_roles": suitable_roles_str,
        "raw_data": json.dumps(data, ensure_ascii=False),
    })

    logger.info(f"正在创建人才记录：{data['name']} ...")

    # --- 3. 创建人才 ---
    try:
        talent = client.talents.create(**create_kwargs)
        talent_id = talent["data"]["id"]
        logger.info(f"✓ 人才创建成功，Talent ID: {talent_id}")
    except Exception as e:
        logger.error(f"✗ 创建人才失败: {e}")
        return None

    # --- 4. 添加工作经历 ---
    experiences = data.get("experience", [])
    logger.info(f"正在添加 {len(experiences)} 段工作经历...")
    for idx, exp in enumerate(experiences):
        exp_kwargs = filter_none({
            "talent_id": talent_id,
            "company": exp.get("company"),
            "title": exp.get("title"),
            "start_date": exp.get("start_date"),
            "end_date": exp.get("end_date"),
            "duration": exp.get("duration"),
            "location": exp.get("location"),
            "responsibilities": exp.get("responsibilities"),
            "achievements": exp.get("achievements"),
            "is_current": exp.get("is_current", 0),
            "description": exp.get("description"),
            "company_details": exp.get("company_details"),
            "data_source": data_source,
            "sort_order": idx + 1,
        })
        try:
            client.talents.add_experience(**exp_kwargs)
            logger.info(f"  - 添加了：{exp.get('title', '?')} @ {exp.get('company', '?')}")
        except Exception as e:
            logger.warning(f"  - 添加经历失败 ({exp.get('title', '?')}): {e}")

    # --- 5. 添加教育经历 ---
    educations = data.get("education", [])
    logger.info(f"正在添加 {len(educations)} 段教育经历...")
    for idx, edu in enumerate(educations):
        edu_kwargs = filter_none({
            "talent_id": talent_id,
            "school": edu.get("school"),
            "degree": edu.get("degree"),
            "field": edu.get("field"),
            "start_date": edu.get("start_date"),
            "end_date": edu.get("end_date"),
            "dates": edu.get("dates"),
            "location": edu.get("location"),
            "ranking_info": edu.get("ranking_info"),
            "description": edu.get("description"),
            "data_source": data_source,
            "sort_order": idx + 1,
        })
        try:
            client.talents.add_education(**edu_kwargs)
            logger.info(f"  - 添加了：{edu.get('school', '?')} ({edu.get('degree', '?')})")
        except Exception as e:
            logger.warning(f"  - 添加教育失败 ({edu.get('school', '?')}): {e}")

    logger.info(f"✓ LinkedIn 导入完成，Talent ID: {talent_id}")
    return talent_id
