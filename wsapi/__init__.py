"""WasaiTalent API Python SDK"""

from .client import (
    WasaiTalentClient,
    AuthAPI,
    TalentAPI,
    AdminAPI,
    OpenAPI,
)
from .exceptions import (
    WasaiAPIError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    ServerError,
)

__all__ = [
    "WasaiTalentClient",
    "AuthAPI",
    "TalentAPI",
    "AdminAPI",
    "OpenAPI",
    "WasaiAPIError",
    "AuthenticationError",
    "ForbiddenError",
    "NotFoundError",
    "ConflictError",
    "ValidationError",
    "ServerError",
]

__version__ = "1.0.0"
