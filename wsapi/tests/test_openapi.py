"""OpenAPI 测试（需 API Key 认证的开放接口）"""

import responses
from wsapi import AuthenticationError, NotFoundError

BASE = "http://localhost:3001/api/open"


class TestOpenTalents:
    def test_list_talents(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/talents",
            json={"data": [{"id": 1, "name": "张三"}]},
            status=200,
        )
        result = client.open.list_talents(search="张三", limit=50)
        assert result["data"][0]["name"] == "张三"
        # 验证 X-API-Key header
        assert mock_api.calls[0].request.headers["X-API-Key"] == "fake-api-key"

    def test_get_talent(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/talents/1",
            json={"data": {"id": 1, "name": "张三"}, "profiles": [{"platform": "github"}]},
            status=200,
        )
        result = client.open.get_talent(1)
        assert result["data"]["name"] == "张三"
        assert len(result["profiles"]) == 1

    def test_get_talent_not_found(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/talents/999", json={"error": "人才信息不存在"}, status=404)
        try:
            client.open.get_talent(999)
            assert False
        except NotFoundError:
            pass

    def test_create_talent(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/talents",
            json={"data": {"id": 10, "name": "李四"}},
            status=201,
        )
        result = client.open.create_talent("李四", company="Anthropic")
        assert result["data"]["name"] == "李四"
        # 验证使用 API Key 而非 JWT
        req = mock_api.calls[0].request
        assert "X-API-Key" in req.headers
        assert "Authorization" not in req.headers


class TestGitHubImport:
    def test_import_github(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/github",
            json={"data": {"id": 5, "name": "torvalds"}},
            status=201,
        )
        result = client.open.import_github({"login": "torvalds", "name": "Linus Torvalds"})
        assert result["data"]["name"] == "torvalds"

    def test_import_github_batch(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/github/batch",
            json={"data": {"imported": 2, "errors": []}},
            status=200,
        )
        users = [
            {"login": "user1", "name": "User One"},
            {"login": "user2", "name": "User Two"},
        ]
        result = client.open.import_github_batch(users)
        assert result["data"]["imported"] == 2


class TestMaimaiImport:
    def test_import_maimai_simple(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/maimai",
            json={"data": {"id": 6, "name": "王五"}},
            status=201,
        )
        result = client.open.import_maimai({"name": "王五", "company": "字节跳动", "position": "工程师"})
        assert result["data"]["name"] == "王五"

    def test_import_maimai_batch(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/maimai/batch",
            json={"data": {"imported": 1, "errors": []}},
            status=200,
        )
        result = client.open.import_maimai_batch([{"name": "赵六", "company": "腾讯"}])
        assert result["data"]["imported"] == 1


class TestOtherImports:
    def test_import_linkedin(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/linkedin",
            json={"data": {"id": 7, "name": "Alice"}},
            status=201,
        )
        result = client.open.import_linkedin({"name": "Alice", "company": "Google", "title": "SRE"})
        assert result["data"]["name"] == "Alice"

    def test_import_wechat(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/wechat",
            json={"data": {"id": 8, "name": "微信用户"}},
            status=201,
        )
        result = client.open.import_wechat({"name": "微信用户", "wechat_id": "wx123"})
        assert result["data"]["name"] == "微信用户"

    def test_import_wechat_batch(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/wechat/batch",
            json={"data": {"imported": 3, "errors": []}},
            status=200,
        )
        result = client.open.import_wechat_batch([
            {"name": "联系人A"}, {"name": "联系人B"}, {"name": "联系人C"},
        ])
        assert result["data"]["imported"] == 3

    def test_import_arxiv(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/arxiv",
            json={"data": {"id": 9, "name": "Researcher"}},
            status=201,
        )
        result = client.open.import_arxiv({
            "name": "Researcher",
            "papers": [{"title": "Paper A", "year": 2023}],
        })
        assert result["data"]["name"] == "Researcher"

    def test_import_patent(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/patent",
            json={"data": {"id": 10, "name": "Inventor"}},
            status=201,
        )
        result = client.open.import_patent({"name": "Inventor", "company": "IBM"})
        assert result["data"]["name"] == "Inventor"

    def test_import_conference(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/import/conference",
            json={"data": {"id": 11, "name": "Speaker"}},
            status=201,
        )
        result = client.open.import_conference({
            "name": "Speaker",
            "conferences": [{"conference_name": "NeurIPS", "year": 2024}],
        })
        assert result["data"]["name"] == "Speaker"


class TestBatchAndMerge:
    def test_batch_import(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/talents/batch",
            json={"data": {"imported": 2, "errors": []}},
            status=200,
        )
        result = client.open.batch_import([
            {"name": "批量用户1"}, {"name": "批量用户2"},
        ])
        assert result["data"]["imported"] == 2

    def test_merge(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/talents/merge",
            json={"data": {"id": 1, "primary_talent_id": 1, "merged_talent_id": 2}},
            status=201,
        )
        result = client.open.merge(1, 2)
        assert result["data"]["primary_talent_id"] == 1

    def test_export_csv(self, client, mock_api):
        csv_content = "id,name,email\n1,zhangsan,zhang@test.com\n"
        mock_api.add(
            responses.GET, f"{BASE}/talents/export",
            body=csv_content,
            status=200,
            content_type="text/csv",
        )
        result = client.open.export_csv()
        assert "zhangsan" in result
        assert "id,name,email" in result


class TestAPIKeyAuth:
    def test_no_api_key_still_sends_request(self, mock_api):
        """无 API Key 时请求仍然发出（后端决定是否拒绝）"""
        from wsapi import WasaiTalentClient
        c = WasaiTalentClient(base_url="http://localhost:3001")
        mock_api.add(responses.GET, f"{BASE}/talents", json={"data": []}, status=200)
        result = c.open.list_talents()
        assert result["data"] == []
        # 无 API Key 时 header 中不含 X-API-Key
        assert "X-API-Key" not in mock_api.calls[0].request.headers

    def test_unauthorized_open_api(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/talents", json={"error": "无效的API Key"}, status=401)
        try:
            client.open.list_talents()
            assert False
        except AuthenticationError:
            pass
