from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.exceptions import ResourceNotFoundException, UnauthorizedException
from app.core.security import generate_totp_secret, get_totp_uri, verify_totp
from app.db.session import get_db
from app.models.governance import SupportedCurrency
from app.models.user import User
from app.schemas.auth import MFASetupResponse, MFAVerifyRequest
from app.schemas.base import ResponseModel
from app.schemas.user import UserResponse, UserUpdateRequest

router = APIRouter()


@router.get("/me", response_model=ResponseModel[UserResponse])
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    user_roles = [r.role for r in current_user.roles]
    return ResponseModel(
        data=UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            status=current_user.status,
            country_code=current_user.country_code,
            preferred_currency=current_user.preferred_currency,
            roles=user_roles,
            is_mfa_enabled=current_user.is_mfa_enabled,
            email_verified_at=current_user.email_verified_at,
            created_at=current_user.created_at,
        )
    )


@router.patch("/me", response_model=ResponseModel[UserResponse])
async def update_user_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if req.first_name:
        current_user.first_name = req.first_name.strip()
    if req.last_name:
        current_user.last_name = req.last_name.strip()
    if req.preferred_currency:
        curr = await db.get(SupportedCurrency, req.preferred_currency.upper())
        if not curr or not curr.is_enabled:
            raise ResourceNotFoundException(f"Currency '{req.preferred_currency}' is not supported")
        current_user.preferred_currency = curr.code

    await db.commit()
    await db.refresh(current_user)

    user_roles = [r.role for r in current_user.roles]
    return ResponseModel(
        data=UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            status=current_user.status,
            country_code=current_user.country_code,
            preferred_currency=current_user.preferred_currency,
            roles=user_roles,
            is_mfa_enabled=current_user.is_mfa_enabled,
            email_verified_at=current_user.email_verified_at,
            created_at=current_user.created_at,
        )
    )


@router.post("/me/mfa/setup", response_model=ResponseModel[MFASetupResponse])
async def setup_mfa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    secret = generate_totp_secret()
    current_user.mfa_secret = secret
    await db.commit()

    uri = get_totp_uri(secret, current_user.email)
    return ResponseModel(data=MFASetupResponse(secret=secret, otpauth_url=uri))


@router.post("/me/mfa/enable", response_model=ResponseModel[dict])
async def enable_mfa(
    req: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.mfa_secret:
        raise UnauthorizedException("MFA setup must be initiated first")

    if not verify_totp(current_user.mfa_secret, req.totp_code):
        raise UnauthorizedException("Invalid 6-digit verification code")

    current_user.is_mfa_enabled = True
    await db.commit()

    return ResponseModel(data={"message": "Two-factor authentication enabled successfully"})
