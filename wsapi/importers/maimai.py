"""脉脉（Maimai）数据导入模块

将脉脉平台原始数据解析并导入到 WasaiTalent 系统中，
自动创建人才记录并填充工作经历和教育经历。
"""

import logging
from typing import Any, Dict, Optional

from .utils import safe_get, parse_int, parse_list_to_csv, parse_date, to_json_str, filter_none

logger = logging.getLogger(__name__)


def import_maimai(
    client,
    maimai_data: Dict[str, Any],
    *,
    data_source: str = "maimai",
    import_method: str = "auto_parse",
) -> Optional[int]:
    """
    从脉脉原始数据导入人才记录。

    流程：
      1. 解析脉脉 data 结构（技能、标签、职位偏好等）
      2. 创建人才主记录
      3. 逐条添加工作经历
      4. 逐条添加教育经历

    Args:
        client: WasaiTalentClient 实例（已登录）
        maimai_data: 脉脉原始数据字典，通常包含 ``data`` 顶层键
        data_source: 数据来源标记，默认 "maimai"
        import_method: 导入方式标记，默认 "auto_parse"

    Returns:
        创建成功后的人才 ID（int），失败时返回 None

    Example:
        >>> from wsapi import WasaiTalentClient
        >>> from wsapi.importers import import_maimai
        >>> client = WasaiTalentClient(base_url="http://localhost:3001")
        >>> client.auth.login("admin", "admin123")
        >>> talent_id = import_maimai(client, maimai_json_data)
    """
    profile = maimai_data.get("data", maimai_data)

    # --- 1. 数据预处理 ---
    skills_list: list = []
    tags_list: list = []

    # 提取技能
    skills_list.extend(safe_get(profile, "skills_tag", default=[]))
    skills_list.extend(safe_get(profile, "skills", default=[]))

    # 提取 job_preferences.positions
    job_prefs = safe_get(profile, "job_preferences", default={})
    positions_list = job_prefs.get("positions", []) if isinstance(job_prefs, dict) else []
    if positions_list:
        tags_list.extend(positions_list)

    # 提取原始 tags
    tags_list.extend(safe_get(profile, "tags", default=[]))

    # 去重（保持顺序）
    skills_list = list(dict.fromkeys(skills_list))
    tags_list = list(dict.fromkeys(tags_list))

    # --- 2. 构建创建参数 ---
    create_params = filter_none({
        "name": safe_get(profile, "name"),
        "email": safe_get(profile, "email"),
        "phone": safe_get(profile, "phone"),
        "company": safe_get(profile, "company"),
        "title": safe_get(profile, "position"),
        "location": safe_get(profile, "province") or safe_get(profile, "city"),

        # 技能 / 标签 → CSV
        "skills": parse_list_to_csv(skills_list),
        "tags": parse_list_to_csv(tags_list),

        "education": safe_get(profile, "sdegree"),
        "experience_years": parse_int(safe_get(profile, "work_time")),
        "summary": safe_get(profile, "summary"),

        "data_source": data_source,
        "import_method": import_method,
        "rating": 0,
        "status": "active",

        "avatar_url": safe_get(profile, "avatar"),
        "homepage": safe_get(profile, "homepage"),
        "github_url": safe_get(profile, "github_url"),
        "google_scholar_url": safe_get(profile, "scholar_url"),
        "wechat": safe_get(profile, "wechat"),
        "linkedin_url": safe_get(profile, "linkedin_url"),
        "maimai_url": safe_get(profile, "detail_url"),

        # positions → suitable_roles
        "suitable_roles": ",".join(positions_list) if positions_list else "",

        "open_to_work": safe_get(profile, "job_preferences", "looking_for_job"),
        "gender": safe_get(profile, "gender_str"),
        "expected_salary": safe_get(profile, "job_preferences", "salary"),

        # 完整保存原始数据
        "raw_data": to_json_str(maimai_data),
    })

    logger.info(f"正在创建脉脉人才记录：{create_params.get('name', '?')} ...")

    # --- 3. 创建人才 ---
    try:
        talent = client.talents.create(**create_params)
        talent_id = talent["data"]["id"]
        logger.info(
            f"✓ 人才创建成功，Talent ID: {talent_id} | "
            f"Suitable Roles: {create_params.get('suitable_roles', '-')}"
        )
    except Exception as e:
        logger.error(f"✗ 创建人才失败: {e}")
        return None

    # --- 4. 工作经历 ---
    exp_list = profile.get("exp", [])
    logger.info(f"正在添加 {len(exp_list)} 段工作经历...")
    for idx, exp in enumerate(exp_list):
        is_leave = exp.get("is_leave", 1)
        is_current = 1 if is_leave == 0 else 0

        exp_params = filter_none({
            "talent_id": talent_id,
            "company": exp.get("company"),
            "title": exp.get("position"),
            "start_date": parse_date(exp.get("start_date")),
            "end_date": parse_date(exp.get("end_date")) if is_current == 0 else None,
            "duration": exp.get("worktime"),
            "location": exp.get("location"),
            "responsibilities": exp.get("description"),
            "achievements": exp.get("achievement"),
            "is_current": is_current,
            "description": exp.get("description"),
            "data_source": data_source,
            "sort_order": idx,
        })
        try:
            client.talents.add_experience(**exp_params)
            logger.info(f"  - 添加了：{exp.get('position', '?')} @ {exp.get('company', '?')}")
        except Exception as e:
            logger.warning(f"  - 添加经历失败 ({exp.get('position', '?')}): {e}")

    # --- 5. 教育经历 ---
    edu_list = profile.get("edu", [])
    logger.info(f"正在添加 {len(edu_list)} 段教育经历...")
    for idx, edu in enumerate(edu_list):
        degree_val = safe_get(edu, "sdegree") or safe_get(edu, "degree")
        final_degree = degree_val if isinstance(degree_val, str) else str(degree_val) if degree_val else None
        is_graduated = edu.get("judge") != 0
        end_date_val = parse_date(edu.get("end_date")) if is_graduated else None

        edu_params = filter_none({
            "talent_id": talent_id,
            "school": edu.get("school"),
            "degree": final_degree,
            "field": safe_get(edu, "department") or safe_get(edu, "major"),
            "start_date": parse_date(edu.get("start_date")),
            "end_date": end_date_val,
            "dates": edu.get("v"),
            "location": edu.get("location"),
            "ranking_info": to_json_str(safe_get(edu, "hover", "ranking_info", default={})),
            "description": edu.get("description"),
            "data_source": data_source,
            "sort_order": idx,
        })
        try:
            client.talents.add_education(**edu_params)
            logger.info(f"  - 添加了：{edu.get('school', '?')} ({final_degree or '?'})")
        except Exception as e:
            logger.warning(f"  - 添加教育失败 ({edu.get('school', '?')}): {e}")

    logger.info(f"✓ 脉脉导入完成，Talent ID: {talent_id}")
    return talent_id
