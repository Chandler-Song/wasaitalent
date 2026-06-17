"""WasaiTalent API SDK 核心客户端"""

import requests
from typing import Optional, Dict, Any
from .exceptions import (
    WasaiAPIError, AuthenticationError, ForbiddenError,
    NotFoundError, ConflictError, ValidationError, ServerError
)

# HTTP 状态码 → 异常类映射
_ERROR_MAP = {
    400: ValidationError,
    401: AuthenticationError,
    403: ForbiddenError,
    404: NotFoundError,
    409: ConflictError,
}


class _BaseClient:
    """底层 HTTP 请求封装，统一处理请求头、错误映射"""

    def __init__(self, base_url: str, token: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self._token = token
        self._api_key = api_key

    # ---------- token / key 管理 ----------

    @property
    def token(self) -> Optional[str]:
        return self._token

    @token.setter
    def token(self, value: str):
        self._token = value

    @property
    def api_key(self) -> Optional[str]:
        return self._api_key

    @api_key.setter
    def api_key(self, value: str):
        self._api_key = value

    # ---------- 请求头构建 ----------

    def _build_headers(self, extra: Optional[Dict[str, str]] = None, use_api_key: bool = False) -> Dict[str, str]:
        headers: Dict[str, str] = {}
        if use_api_key and self._api_key:
            headers["X-API-Key"] = self._api_key
        elif self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        if extra:
            headers.update(extra)
        return headers

    # ---------- 响应处理 ----------

    @staticmethod
    def _raise_for_status(resp: requests.Response):
        if resp.ok:
            return
        status = resp.status_code
        try:
            body = resp.json()
            message = body.get("error", resp.text)
        except Exception:
            message = resp.text
            body = None
        exc_cls = _ERROR_MAP.get(status, ServerError if status >= 500 else WasaiAPIError)
        raise exc_cls(message=message, status_code=status, response_data=body)

    # ---------- 公共请求方法 ----------

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
        data: Optional[Any] = None,
        files: Optional[Dict] = None,
        headers: Optional[Dict[str, str]] = None,
        use_api_key: bool = False,
        raw: bool = False,
    ) -> Any:
        url = f"{self.base_url}{path}"
        req_headers = self._build_headers(headers, use_api_key=use_api_key)
        # 清理 None 值
        if params:
            params = {k: v for k, v in params.items() if v is not None}
        resp = self.session.request(
            method, url,
            params=params, json=json, data=data, files=files,
            headers=req_headers,
        )
        self._raise_for_status(resp)
        if raw:
            return resp
        # 部分接口返回纯文本（如 CSV 导出）
        ct = resp.headers.get("Content-Type", "")
        if "application/json" in ct:
            return resp.json()
        return resp.text


class AuthAPI:
    """认证相关接口（/api/auth）"""

    def __init__(self, client: _BaseClient):
        self._c = client

    def register(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """注册新用户，返回 {user, token}"""
        result = self._c.request("POST", "/api/auth/register", json={
            "username": username, "email": email, "password": password
        })
        # 自动保存 token
        if result and "token" in result:
            self._c.token = result["token"]
        return result

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """登录，返回 {user, token}"""
        result = self._c.request("POST", "/api/auth/login", json={
            "username": username, "password": password
        })
        if result and "token" in result:
            self._c.token = result["token"]
        return result

    def me(self) -> Dict[str, Any]:
        """获取当前用户信息"""
        return self._c.request("GET", "/api/auth/me")

    def change_password(self, old_password: str, new_password: str) -> Dict[str, Any]:
        """修改密码"""
        return self._c.request("PUT", "/api/auth/password", json={
            "oldPassword": old_password, "newPassword": new_password
        })


class TalentAPI:
    """人才管理接口（/api/talents），需 JWT 认证"""

    def __init__(self, client: _BaseClient):
        self._c = client

    # ---------- 主资源 CRUD ----------

    def list(self, **kwargs) -> Dict[str, Any]:
        """
        获取人才列表（分页）。支持的查询参数：
        search, data_source, import_method, status, open_to_work,
        education, gender, location, skills, email, phone, wechat,
        suitable_roles, job_preference, tags, linkedin_url, github_url,
        maimai_url, homepage, paper_title, patent_title, conference_name,
        experience_years_min, experience_years_max,
        expected_salary_min, expected_salary_max,
        page, limit, sort, order
        """
        return self._c.request("GET", "/api/talents", params=kwargs)

    def get(self, talent_id: int) -> Dict[str, Any]:
        """获取人才详情（含 profiles, experiences, educations, notes 等）"""
        return self._c.request("GET", f"/api/talents/{talent_id}")

    def create(self, name: str, **kwargs) -> Dict[str, Any]:
        """创建人才，name 必填"""
        body = {"name": name, **kwargs}
        return self._c.request("POST", "/api/talents", json=body)

    def update(self, talent_id: int, **kwargs) -> Dict[str, Any]:
        """更新人才信息"""
        return self._c.request("PUT", f"/api/talents/{talent_id}", json=kwargs)

    def delete(self, talent_id: int) -> Dict[str, Any]:
        """删除人才"""
        return self._c.request("DELETE", f"/api/talents/{talent_id}")

    # ---------- 合并/关联 ----------

    def merge(self, primary_talent_id: int, merged_talent_id: int,
              match_type: str = "manual", match_confidence: float = 1.0) -> Dict[str, Any]:
        """关联/合并两个人才"""
        return self._c.request("POST", "/api/talents/merge", json={
            "primary_talent_id": primary_talent_id,
            "merged_talent_id": merged_talent_id,
            "match_type": match_type,
            "match_confidence": match_confidence,
        })

    def unmerge(self, primary_talent_id: int, merged_talent_id: int) -> Dict[str, Any]:
        """取消关联"""
        return self._c.request("DELETE", "/api/talents/merge", json={
            "primary_talent_id": primary_talent_id,
            "merged_talent_id": merged_talent_id,
        })

    # ---------- 统计 ----------

    def stats_sources(self) -> Dict[str, Any]:
        """按数据来源统计"""
        return self._c.request("GET", "/api/talents/stats/sources")

    def stats_import_methods(self) -> Dict[str, Any]:
        """按导入方式统计"""
        return self._c.request("GET", "/api/talents/stats/import-methods")

    def stats_companies(self) -> Dict[str, Any]:
        """按公司统计（Top 20）"""
        return self._c.request("GET", "/api/talents/stats/companies")

    def stats_platforms(self) -> Dict[str, Any]:
        """按平台档案统计"""
        return self._c.request("GET", "/api/talents/stats/platforms")

    # ---------- 子资源通用方法 ----------

    def _sub_list(self, talent_id: int, resource: str) -> Dict[str, Any]:
        return self._c.request("GET", f"/api/talents/{talent_id}/{resource}")

    def _sub_create(self, talent_id: int, resource: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._c.request("POST", f"/api/talents/{talent_id}/{resource}", json=body)

    def _sub_update(self, talent_id: int, resource: str, rid: int, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._c.request("PUT", f"/api/talents/{talent_id}/{resource}/{rid}", json=body)

    def _sub_delete(self, talent_id: int, resource: str, rid: int) -> Dict[str, Any]:
        return self._c.request("DELETE", f"/api/talents/{talent_id}/{resource}/{rid}")

    # ---------- 备注 ----------

    def list_notes(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "notes")

    def add_note(self, talent_id: int, content: str) -> Dict[str, Any]:
        return self._sub_create(talent_id, "notes", {"content": content})

    def update_note(self, talent_id: int, note_id: int, content: str) -> Dict[str, Any]:
        return self._sub_update(talent_id, "notes", note_id, {"content": content})

    def delete_note(self, talent_id: int, note_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "notes", note_id)

    # ---------- 平台档案 ----------

    def create_profile(self, talent_id: int, platform: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "profiles", {"platform": platform, **kwargs})

    def update_profile(self, talent_id: int, profile_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "profiles", profile_id, kwargs)

    def delete_profile(self, talent_id: int, profile_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "profiles", profile_id)

    # ---------- 工作经历 ----------

    def list_experiences(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "experiences")

    def add_experience(self, talent_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "experiences", kwargs)

    def update_experience(self, talent_id: int, exp_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "experiences", exp_id, kwargs)

    def delete_experience(self, talent_id: int, exp_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "experiences", exp_id)

    # ---------- 教育经历 ----------

    def list_educations(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "educations")

    def add_education(self, talent_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "educations", kwargs)

    def update_education(self, talent_id: int, edu_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "educations", edu_id, kwargs)

    def delete_education(self, talent_id: int, edu_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "educations", edu_id)

    # ---------- 跟盯记录 ----------

    def list_followups(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "followups")

    def add_followup(self, talent_id: int, content: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "followups", {"content": content, **kwargs})

    def update_followup(self, talent_id: int, fid: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "followups", fid, kwargs)

    def delete_followup(self, talent_id: int, fid: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "followups", fid)

    # ---------- 论文 ----------

    def list_papers(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "papers")

    def add_paper(self, talent_id: int, title: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "papers", {"title": title, **kwargs})

    def update_paper(self, talent_id: int, paper_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "papers", paper_id, kwargs)

    def delete_paper(self, talent_id: int, paper_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "papers", paper_id)

    # ---------- 专利 ----------

    def list_patents(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "patents")

    def add_patent(self, talent_id: int, title: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "patents", {"title": title, **kwargs})

    def update_patent(self, talent_id: int, patent_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "patents", patent_id, kwargs)

    def delete_patent(self, talent_id: int, patent_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "patents", patent_id)

    # ---------- 行业会议 ----------

    def list_conferences(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "conferences")

    def add_conference(self, talent_id: int, conference_name: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "conferences", {"conference_name": conference_name, **kwargs})

    def update_conference(self, talent_id: int, conf_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "conferences", conf_id, kwargs)

    def delete_conference(self, talent_id: int, conf_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "conferences", conf_id)

    # ---------- GitHub 项目 ----------

    def list_repos(self, talent_id: int) -> Dict[str, Any]:
        return self._sub_list(talent_id, "repos")

    def add_repo(self, talent_id: int, repo_name: str, **kwargs) -> Dict[str, Any]:
        return self._sub_create(talent_id, "repos", {"repo_name": repo_name, **kwargs})

    def update_repo(self, talent_id: int, repo_id: int, **kwargs) -> Dict[str, Any]:
        return self._sub_update(talent_id, "repos", repo_id, kwargs)

    def delete_repo(self, talent_id: int, repo_id: int) -> Dict[str, Any]:
        return self._sub_delete(talent_id, "repos", repo_id)


class AdminAPI:
    """管理员接口（/api/admin），需 JWT + admin 权限"""

    def __init__(self, client: _BaseClient):
        self._c = client

    def dashboard(self) -> Dict[str, Any]:
        """获取系统概览统计"""
        return self._c.request("GET", "/api/admin/dashboard")

    def list_users(self) -> Dict[str, Any]:
        """获取所有用户"""
        return self._c.request("GET", "/api/admin/users")

    def update_user_role(self, user_id: int, role: str) -> Dict[str, Any]:
        """修改用户角色 (admin / user / viewer)"""
        return self._c.request("PUT", f"/api/admin/users/{user_id}/role", json={"role": role})

    def delete_user(self, user_id: int) -> Dict[str, Any]:
        """删除用户（不能删除自己）"""
        return self._c.request("DELETE", f"/api/admin/users/{user_id}")

    def create_api_key(self, name: str = "Default Key", permissions: str = "read") -> Dict[str, Any]:
        """创建 API 密钥，返回 {id, name, key, permissions}"""
        return self._c.request("POST", "/api/admin/api-keys", json={"name": name, "permissions": permissions})

    def list_api_keys(self) -> Dict[str, Any]:
        """获取 API 密钥列表"""
        return self._c.request("GET", "/api/admin/api-keys")

    def delete_api_key(self, key_id: int) -> Dict[str, Any]:
        """删除 API 密钥"""
        return self._c.request("DELETE", f"/api/admin/api-keys/{key_id}")


class OpenAPI:
    """开放接口（/api/open），需 API Key"""

    def __init__(self, client: _BaseClient):
        self._c = client

    # ---------- 通用人才操作 ----------

    def list_talents(self, **kwargs) -> Dict[str, Any]:
        """获取人才列表（search, data_source, import_method, limit, offset）"""
        return self._c.request("GET", "/api/open/talents", params=kwargs, use_api_key=True)

    def get_talent(self, talent_id: int) -> Dict[str, Any]:
        """获取人才详情 + profiles"""
        return self._c.request("GET", f"/api/open/talents/{talent_id}", use_api_key=True)

    def create_talent(self, name: str, **kwargs) -> Dict[str, Any]:
        """创建人才"""
        return self._c.request("POST", "/api/open/talents", json={"name": name, **kwargs}, use_api_key=True)

    # ---------- 平台导入 ----------

    def import_github(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """GitHub 单条导入"""
        return self._c.request("POST", "/api/open/import/github", json=data, use_api_key=True)

    def import_github_batch(self, users: list) -> Dict[str, Any]:
        """GitHub 批量导入"""
        return self._c.request("POST", "/api/open/import/github/batch", json={"users": users}, use_api_key=True)

    def import_maimai(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """脉脉单条导入（支持详细格式 basic_info 和简略格式）"""
        return self._c.request("POST", "/api/open/import/maimai", json=data, use_api_key=True)

    def import_maimai_batch(self, users: list) -> Dict[str, Any]:
        """脉脉批量导入"""
        return self._c.request("POST", "/api/open/import/maimai/batch", json={"users": users}, use_api_key=True)

    def import_linkedin(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """LinkedIn 导入（完整简历 / 简略文本两种格式）"""
        return self._c.request("POST", "/api/open/import/linkedin", json=data, use_api_key=True)

    def import_wechat(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """微信单条导入"""
        return self._c.request("POST", "/api/open/import/wechat", json=data, use_api_key=True)

    def import_wechat_batch(self, contacts: list) -> Dict[str, Any]:
        """微信批量导入"""
        return self._c.request("POST", "/api/open/import/wechat/batch", json={"contacts": contacts}, use_api_key=True)

    def import_arxiv(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """arXiv 论文导入"""
        return self._c.request("POST", "/api/open/import/arxiv", json=data, use_api_key=True)

    def import_patent(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """专利导入"""
        return self._c.request("POST", "/api/open/import/patent", json=data, use_api_key=True)

    def import_conference(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """行业会议导入"""
        return self._c.request("POST", "/api/open/import/conference", json=data, use_api_key=True)

    # ---------- CSV 导入/导出 ----------

    def import_csv(self, file_path: str) -> Dict[str, Any]:
        """CSV 文件上传导入（multipart/form-data）"""
        with open(file_path, "rb") as f:
            return self._c.request(
                "POST", "/api/open/talents/import",
                files={"file": ("talents.csv", f, "text/csv")},
                use_api_key=True,
            )

    def export_csv(self) -> str:
        """CSV 导出，返回 CSV 文本"""
        return self._c.request("GET", "/api/open/talents/export", use_api_key=True, raw=False)

    # ---------- 批量导入 & 关联 ----------

    def batch_import(self, talents: list) -> Dict[str, Any]:
        """JSON 批量导入"""
        return self._c.request("POST", "/api/open/talents/batch", json={"talents": talents}, use_api_key=True)

    def merge(self, primary_talent_id: int, merged_talent_id: int,
              match_type: str = "api", match_confidence: float = 1.0) -> Dict[str, Any]:
        """人才关联"""
        return self._c.request("POST", "/api/open/talents/merge", json={
            "primary_talent_id": primary_talent_id,
            "merged_talent_id": merged_talent_id,
            "match_type": match_type,
            "match_confidence": match_confidence,
        }, use_api_key=True)


class WasaiTalentClient:
    """
    WasaiTalent API 统一客户端入口。

    用法:
        # JWT 认证模式
        client = WasaiTalentClient(base_url="http://localhost:3001")
        client.auth.login("admin", "password123")
        talents = client.talents.list(search="张三")

        # API Key 模式（Open API）
        client = WasaiTalentClient(base_url="http://localhost:3001", api_key="your-api-key")
        result = client.open.list_talents(search="李四")
    """

    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        token: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self._client = _BaseClient(base_url=base_url, token=token, api_key=api_key)
        self.auth = AuthAPI(self._client)
        self.talents = TalentAPI(self._client)
        self.admin = AdminAPI(self._client)
        self.open = OpenAPI(self._client)

    @property
    def token(self) -> Optional[str]:
        return self._client.token

    @token.setter
    def token(self, value: str):
        self._client.token = value

    @property
    def api_key(self) -> Optional[str]:
        return self._client.api_key

    @api_key.setter
    def api_key(self, value: str):
        self._client.api_key = value
