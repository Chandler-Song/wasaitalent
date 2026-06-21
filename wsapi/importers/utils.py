"""数据导入辅助工具函数"""

import json
import re
from typing import Any, Dict, List, Optional


def safe_get(data: Dict, *keys, default=None):
    """
    安全获取嵌套字典的值。

    Args:
        data: 源字典
        *keys: 逐层键路径
        default: 键不存在时的默认值

    Returns:
        目标值或 default

    Example:
        >>> safe_get({"a": {"b": 1}}, "a", "b")
        1
        >>> safe_get({"a": 1}, "x", "y", default="N/A")
        'N/A'
    """
    current = data
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return default
    return current if current is not None else default


def parse_int(val: Any) -> int:
    """
    强制转换为整数，失败返回 0。
    支持从字符串中提取首个数字序列（如 "8年" → 8）。

    Args:
        val: 待转换的值

    Returns:
        整数值，无法解析时返回 0
    """
    if val is None:
        return 0
    if isinstance(val, int):
        return val
    try:
        match = re.search(r'\d+', str(val))
        return int(match.group()) if match else 0
    except Exception:
        return 0


def parse_list_to_csv(items: List) -> str:
    """
    将列表转换为逗号分隔字符串。

    Args:
        items: 待转换的列表

    Returns:
        逗号分隔的字符串，空列表返回 ""
    """
    if not items:
        return ""
    return ",".join([str(x).strip() for x in items if x])


def parse_date(val: Any) -> Optional[str]:
    """
    标准化日期为 YYYY-MM 格式。

    Args:
        val: 日期值，支持 "YYYY-MM"、"YYYY" 等格式

    Returns:
        "YYYY-MM" 格式字符串，无法解析时返回 None
    """
    if not val:
        return None
    s_val = str(val)
    parts = s_val.split('-')
    if len(parts) >= 2:
        return f"{parts[0]}-{parts[1]}"
    if len(parts) == 1 and len(parts[0]) == 4:
        return f"{parts[0]}-01"
    return s_val


def to_json_str(obj: Any) -> Optional[str]:
    """
    将对象转换为 JSON 字符串，若为空则返回 None。

    Args:
        obj: 待序列化的对象

    Returns:
        JSON 字符串，obj 为 None 时返回 None
    """
    if obj is None:
        return None
    try:
        return json.dumps(obj, ensure_ascii=False)
    except Exception:
        return str(obj)


def filter_none(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    过滤字典中所有值为 None 的键值对。

    Args:
        d: 源字典

    Returns:
        过滤后的新字典
    """
    return {k: v for k, v in d.items() if v is not None}
