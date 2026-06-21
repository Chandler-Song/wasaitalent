"""wsapi.importers — 数据导入工具集

提供 LinkedIn 简历和脉脉平台数据的标准化导入功能。

Usage:
    from wsapi.importers import import_linkedin, import_maimai

    result = import_linkedin(client, linkedin_json_data)
    result = import_maimai(client, maimai_json_data)
"""

from .linkedin import import_linkedin
from .maimai import import_maimai
from .schema import (
    LINKEDIN_RESUME_SCHEMA,
    SchemaValidationError,
    validate_linkedin_data,
)
from .utils import (
    safe_get,
    parse_int,
    parse_list_to_csv,
    parse_date,
    to_json_str,
    filter_none,
)

__all__ = [
    # 核心导入函数
    "import_linkedin",
    "import_maimai",
    # Schema
    "LINKEDIN_RESUME_SCHEMA",
    "SchemaValidationError",
    "validate_linkedin_data",
    # 工具函数
    "safe_get",
    "parse_int",
    "parse_list_to_csv",
    "parse_date",
    "to_json_str",
    "filter_none",
]
