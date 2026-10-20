import uuid
from collections.abc import Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.db.session import get_db
from app.models.professional import ProfessionalProfile
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    auth_header: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts authentication token from:
    1. Authorization: Bearer <token>
    2. 'access_token' HTTP-only cookie
    """
    token: str | None = None
    if auth_header and auth_header.credentials:
        token = auth_header.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise UnauthorizedException("Authentication token missing")

    payload = decode_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Token payload missing user identifier")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Malformed user identifier in token")

    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.roles),
            selectinload(User.professional_profile),
        )
    )
    user = await db.scalar(stmt)
    if not user:
        raise UnauthorizedException("User account not found")

    if user.status in ("suspended", "deactivated"):
        raise ForbiddenException(f"Account is {user.status}. Please contact support.")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures user account is active."""
    if current_user.status != "active":
        raise ForbiddenException("Account is inactive")
    return current_user


def require_roles(allowed_roles: list[str]) -> Callable:
    """Dependency factory checking that user possesses at least one of the allowed roles."""
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role_names = [r.role for r in current_user.roles]
        if "administrator" in user_role_names:
            return current_user  # Super-admin passes all checks
        if not any(role in user_role_names for role in allowed_roles):
            raise ForbiddenException(
                f"Action requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


async def get_current_admin(
    current_user: User = Depends(require_roles(["administrator"])),
) -> User:
    """Ensures current user has administrator role."""
    return current_user


async def get_current_professional(
    current_user: User = Depends(require_roles(["professional"])),
    db: AsyncSession = Depends(get_db),
) -> tuple[User, ProfessionalProfile]:
    """Ensures current user has professional role and returns (User, ProfessionalProfile)."""
    stmt = (
        select(ProfessionalProfile)
        .where(ProfessionalProfile.user_id == current_user.id)
        .options(selectinload(ProfessionalProfile.credentials))
    )
    profile = await db.scalar(stmt)
    if not profile:
        raise ForbiddenException("Professional profile not found for this account")
    return current_user, profile
