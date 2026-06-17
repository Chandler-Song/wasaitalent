"""AuthAPI 测试"""

import responses
from wsapi import AuthenticationError, ValidationError

BASE = "http://localhost:3001/api/auth"


class TestRegister:
    def test_register_success(self, anon_client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/register",
            json={"user": {"id": 1, "username": "alice"}, "token": "new-token"},
            status=201,
        )
        result = anon_client.auth.register("alice", "alice@example.com", "password123")
        assert result["user"]["username"] == "alice"
        assert anon_client.token == "new-token"  # token 自动保存

    def test_register_conflict(self, anon_client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/register",
            json={"error": "用户名或邮箱已存在"}, status=409,
        )
        from wsapi import ConflictError
        try:
            anon_client.auth.register("alice", "alice@example.com", "password123")
            assert False, "should have raised"
        except ConflictError as e:
            assert "已存在" in str(e)


class TestLogin:
    def test_login_success(self, anon_client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/login",
            json={"user": {"id": 1, "username": "admin", "role": "admin"}, "token": "jwt-token-xyz"},
            status=200,
        )
        result = anon_client.auth.login("admin", "admin123")
        assert result["token"] == "jwt-token-xyz"
        assert anon_client.token == "jwt-token-xyz"

    def test_login_wrong_password(self, anon_client, mock_api):
        mock_api.add(
            responses.POST, f"{BASE}/login",
            json={"error": "用户名或密码错误"}, status=401,
        )
        try:
            anon_client.auth.login("admin", "wrong")
            assert False
        except AuthenticationError:
            pass


class TestMe:
    def test_me_success(self, client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/me",
            json={"user": {"id": 1, "username": "admin", "role": "admin"}},
            status=200,
        )
        result = client.auth.me()
        assert result["user"]["role"] == "admin"
        # 验证 Authorization header
        assert mock_api.calls[0].request.headers["Authorization"] == "Bearer fake-jwt-token"

    def test_me_unauthorized(self, anon_client, mock_api):
        mock_api.add(
            responses.GET, f"{BASE}/me",
            json={"error": "未授权"}, status=401,
        )
        try:
            anon_client.auth.me()
            assert False
        except AuthenticationError:
            pass


class TestChangePassword:
    def test_change_password_success(self, client, mock_api):
        mock_api.add(
            responses.PUT, f"{BASE}/password",
            json={"message": "密码修改成功"}, status=200,
        )
        result = client.auth.change_password("oldpass", "newpass")
        assert result["message"] == "密码修改成功"

    def test_change_password_wrong_old(self, client, mock_api):
        mock_api.add(
            responses.PUT, f"{BASE}/password",
            json={"error": "旧密码错误"}, status=401,
        )
        try:
            client.auth.change_password("wrongold", "newpass")
            assert False
        except AuthenticationError:
            pass
