"""TalentAPI 测试"""

import responses
from wsapi import NotFoundError, ConflictError, ValidationError

BASE = "http://localhost:3001/api/talents"


class TestTalentList:
    def test_list_default(self, client, mock_api):
        mock_api.add(
            responses.GET, BASE,
            json={"data": [{"id": 1, "name": "张三"}], "pagination": {"page": 1, "limit": 20, "total": 1, "totalPages": 1}},
            status=200,
        )
        result = client.talents.list()
        assert len(result["data"]) == 1
        assert result["pagination"]["total"] == 1

    def test_list_with_filters(self, client, mock_api):
        mock_api.add(responses.GET, BASE, json={"data": [], "pagination": {"total": 0}}, status=200)
        result = client.talents.list(search="张三", location="北京", page=2, limit=10)
        # 验证查询参数被正确传递
        req = mock_api.calls[0].request
        assert "search=" in req.url
        assert "page=2" in req.url


class TestTalentCRUD:
    def test_get(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/42",
            json={
                "data": {"id": 42, "name": "张三"},
                "profiles": [], "experiences": [], "educations": [],
                "notes": [], "followups": [], "papers": [],
                "patents": [], "conferences": [], "githubRepos": [],
                "relatedTalents": [],
            },
            status=200,
        )
        result = client.talents.get(42)
        assert result["data"]["name"] == "张三"
        assert "profiles" in result

    def test_get_not_found(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/999", json={"error": "人才信息不存在"}, status=404)
        try:
            client.talents.get(999)
            assert False
        except NotFoundError as e:
            assert e.status_code == 404

    def test_create(self, client, mock_api):
        mock_api.add(
            responses.POST, BASE,
            json={"data": {"id": 10, "name": "李四", "company": "OpenAI"}},
            status=201,
        )
        result = client.talents.create("李四", company="OpenAI", email="li@openai.com")
        assert result["data"]["name"] == "李四"
        # 验证请求体
        import json
        body = json.loads(mock_api.calls[0].request.body)
        assert body["name"] == "李四"
        assert body["company"] == "OpenAI"
        assert body["email"] == "li@openai.com"

    def test_create_no_name(self, client, mock_api):
        mock_api.add(responses.POST, BASE, json={"error": "姓名为必填项"}, status=400)
        # SDK 层不强制校验，交给后端
        try:
            client.talents.create("")
            assert False
        except ValidationError:
            pass

    def test_update(self, client, mock_api):
        mock_api.add(
            responses.PUT, f"{BASE}/10",
            json={"data": {"id": 10, "name": "李四", "company": "Anthropic"}},
            status=200,
        )
        result = client.talents.update(10, company="Anthropic")
        assert result["data"]["company"] == "Anthropic"

    def test_delete(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/10", json={"message": "删除成功"}, status=200)
        result = client.talents.delete(10)
        assert "删除成功" in result["message"]


class TestMerge:
    def test_merge_success(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/merge",
            json={"data": {"id": 1, "primary_talent_id": 1, "merged_talent_id": 2, "match_type": "manual"}},
            status=201,
        )
        result = client.talents.merge(1, 2)
        assert result["data"]["match_type"] == "manual"

    def test_merge_conflict(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/merge", json={"error": "关联已存在"}, status=409)
        try:
            client.talents.merge(1, 2)
            assert False
        except ConflictError:
            pass

    def test_unmerge(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/merge", json={"message": "关联已取消"}, status=200)
        result = client.talents.unmerge(1, 2)
        assert "取消" in result["message"]


class TestStats:
    def test_stats_sources(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/stats/sources", json={"data": [{"data_source": "github", "count": 50}]}, status=200)
        result = client.talents.stats_sources()
        assert result["data"][0]["count"] == 50

    def test_stats_import_methods(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/stats/import-methods", json={"data": [{"import_method": "api", "count": 30}]}, status=200)
        result = client.talents.stats_import_methods()
        assert result["data"][0]["import_method"] == "api"

    def test_stats_companies(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/stats/companies", json={"data": [{"company": "Google", "count": 10}]}, status=200)
        result = client.talents.stats_companies()
        assert result["data"][0]["company"] == "Google"

    def test_stats_platforms(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/stats/platforms", json={"data": [{"platform": "github", "count": 100}]}, status=200)
        result = client.talents.stats_platforms()
        assert result["data"][0]["platform"] == "github"


class TestSubResources:
    """测试子资源 CRUD（以 notes、experiences、papers 为代表）"""

    # ---- 备注 ----

    def test_list_notes(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/1/notes", json={"data": [{"id": 1, "content": "优秀候选人"}]}, status=200)
        result = client.talents.list_notes(1)
        assert result["data"][0]["content"] == "优秀候选人"

    def test_add_note(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/1/notes", json={"data": {"id": 2, "content": "待跟进"}}, status=201)
        result = client.talents.add_note(1, "待跟进")
        assert result["data"]["content"] == "待跟进"

    def test_update_note(self, client, mock_api):
        mock_api.add(responses.PUT, f"{BASE}/1/notes/2", json={"data": {"id": 2, "content": "已更新"}}, status=200)
        result = client.talents.update_note(1, 2, "已更新")
        assert result["data"]["content"] == "已更新"

    def test_delete_note(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/1/notes/2", json={"message": "备注已删除"}, status=200)
        result = client.talents.delete_note(1, 2)
        assert "删除" in result["message"]

    # ---- 工作经历 ----

    def test_list_experiences(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/1/experiences", json={"data": [{"id": 1, "company": "Google"}]}, status=200)
        result = client.talents.list_experiences(1)
        assert result["data"][0]["company"] == "Google"

    def test_add_experience(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/1/experiences", json={"data": {"id": 1, "company": "Meta"}}, status=201)
        result = client.talents.add_experience(1, company="Meta", title="SWE")
        assert result["data"]["company"] == "Meta"

    def test_delete_experience(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/1/experiences/1", json={"message": "工作经历已删除"}, status=200)
        result = client.talents.delete_experience(1, 1)
        assert "删除" in result["message"]

    # ---- 论文 ----

    def test_add_paper(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/1/papers", json={"data": {"id": 1, "title": "Attention Is All You Need"}}, status=201)
        result = client.talents.add_paper(1, "Attention Is All You Need", year=2017)
        assert result["data"]["title"] == "Attention Is All You Need"

    # ---- 平台档案 ----

    def test_create_profile(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/1/profiles", json={"data": {"id": 1, "platform": "github"}}, status=201)
        result = client.talents.create_profile(1, "github", username="alice")
        assert result["data"]["platform"] == "github"

    def test_delete_profile(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/1/profiles/1", json={"message": "档案已删除"}, status=200)
        result = client.talents.delete_profile(1, 1)
        assert "删除" in result["message"]

    # ---- GitHub 项目 ----

    def test_add_repo(self, client, mock_api):
        mock_api.add(responses.POST, f"{BASE}/1/repos", json={"data": {"id": 1, "repo_name": "wasai"}}, status=201)
        result = client.talents.add_repo(1, "wasai", language="Python", stars=100)
        assert result["data"]["repo_name"] == "wasai"
