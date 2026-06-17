"""WasaiTalent API SDK 自定义异常"""


class WasaiAPIError(Exception):
    """WasaiTalent API 基础异常"""

    def __init__(self, message: str, status_code: int = None, response_data: dict = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)

    def __str__(self):
        if self.status_code:
            return f"[{self.status_code}] {self.message}"
        return self.message


class AuthenticationError(WasaiAPIError):
    """认证失败 (401)"""
    pass


class ForbiddenError(WasaiAPIError):
    """权限不足 (403)"""
    pass


class NotFoundError(WasaiAPIError):
    """资源不存在 (404)"""
    pass


class ConflictError(WasaiAPIError):
    """资源冲突 (409)"""
    pass


class ValidationError(WasaiAPIError):
    """请求参数错误 (400)"""
    pass


class ServerError(WasaiAPIError):
    """服务器错误 (500)"""
    pass
