"""AdminAPI 测试"""

import responses
from wsapi import ForbiddenError, ValidationError

BASE = "http://localhost:3001/api/admin"


class TestDashboard:
    def test_dashboard_success(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/dashboard",
            json={
                "data": {
                    "totalUsers": 5, "totalTalents": 200, "totalNotes": 50,
                    "totalApiKeys": 3, "totalProfiles": 80, "totalMerges": 10,
                    "sourceStats": [{"data_source": "github", "count": 100}],
                    "importMethodStats": [], "platformStats": [],
                    "recentTalents": [], "recentUsers": [],
                }
            },
            status=200,
        )
        result = client.admin.dashboard()
        assert result["data"]["totalTalents"] == 200
        assert result["data"]["totalUsers"] == 5

    def test_dashboard_forbidden(self, client, mock_api):
        mock_api.add(responses.GET, f"{BASE}/dashboard", json={"error": "权限不足"}, status=403)
        try:
            client.admin.dashboard()
            assert False
        except ForbiddenError as e:
            assert e.status_code == 403


class TestUsers:
    def test_list_users(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/users",
            json={"data": [{"id": 1, "username": "admin", "role": "admin"}]},
            status=200,
        )
        result = client.admin.list_users()
        assert result["data"][0]["role"] == "admin"

    def test_update_user_role(self, client, mock_api):
        mock_api.add(responses.PUT, f"{BASE}/users/2/role", json={"message": "角色更新成功"}, status=200)
        result = client.admin.update_user_role(2, "viewer")
        assert "成功" in result["message"]
        import json
        body = json.loads(mock_api.calls[0].request.body)
        assert body["role"] == "viewer"

    def test_update_user_role_invalid(self, client, mock_api):
        mock_api.add(responses.PUT, f"{BASE}/users/2/role", json={"error": "无效的角色"}, status=400)
        try:
            client.admin.update_user_role(2, "superadmin")
            assert False
        except ValidationError:
            pass

    def test_delete_user(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/users/3", json={"message": "用户删除成功"}, status=200)
        result = client.admin.delete_user(3)
        assert "删除成功" in result["message"]

    def test_delete_self_forbidden(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/users/1", json={"error": "不能删除自己"}, status=400)
        try:
            client.admin.delete_user(1)
            assert False
        except ValidationError:
            pass


class TestAPIKeys:
    def test_create_api_key(self, client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/api-keys",
            json={"data": {"id": 1, "name": "Test Key", "key": "abc123def456", "permissions": "read"}},
            status=201,
        )
        result = client.admin.create_api_key("Test Key", "read")
        assert result["data"]["key"] == "abc123def456"
        assert result["data"]["name"] == "Test Key"

    def test_list_api_keys(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/api-keys",
            json={"data": [{"id": 1, "name": "Test Key", "permissions": "read"}]},
            status=200,
        )
        result = client.admin.list_api_keys()
        assert len(result["data"]) == 1

    def test_delete_api_key(self, client, mock_api):
        mock_api.add(responses.DELETE, f"{BASE}/api-keys/1", json={"message": "API密钥删除成功"}, status=200)
        result = client.admin.delete_api_key(1)
        assert "删除成功" in result["message"]
