"""pytest 公共 fixtures"""

import pytest
import responses
from wsapi import WasaiTalentClient

BASE_URL = "http://localhost:3001"


@pytest.fixture
def client() -> WasaiTalentClient:
    """返回一个带预设 token 的客户端实例"""
    return WasaiTalentClient(
        base_url=BASE_URL,
        token="fake-jwt-token",
        api_key="fake-api-key",
    )


@pytest.fixture
def anon_client() -> WasaiTalentClient:
    """返回一个未认证的客户端实例（用于测试注册/登录）"""
    return WasaiTalentClient(base_url=BASE_URL)


@pytest.fixture(autouse=True)
def mock_api():
    """自动激活 responses mock，拦截所有 HTTP 请求"""
    with responses.RequestsMock() as rsps:
        yield rsps
