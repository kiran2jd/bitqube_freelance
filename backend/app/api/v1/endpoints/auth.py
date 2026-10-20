from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import ConflictException, ResourceNotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
    verify_totp,
)
from app.db.session import get_db
from app.models.governance import SupportedCountry, SupportedCurrency
from app.models.professional import ProfessionalProfile
from app.models.user import EmailVerificationToken, PasswordResetToken, Session, User, UserRole
from app.schemas.auth import (
    EmailVerifyRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserSummary,
)
from app.schemas.base import ResponseModel

router = APIRouter()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Sets secure, HTTP-only SameSite cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clears authentication cookies."""
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")


@router.post("/register", response_model=ResponseModel[TokenResponse], status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate email
    existing_user = await db.scalar(select(User).where(User.email == req.email.lower()))
    if existing_user:
        raise ConflictException("An account with this email address already exists")

    # Validate country & currency
    country = await db.scalar(
        select(SupportedCountry).where(
            SupportedCountry.country_code == req.country_code.upper(),
            SupportedCountry.is_enabled.is_(True),
        )
    )
    if not country:
        raise ResourceNotFoundException(f"Country '{req.country_code}' is not supported")

    currency = await db.scalar(
        select(SupportedCurrency).where(
            SupportedCurrency.code == req.preferred_currency.upper(),
            SupportedCurrency.is_enabled.is_(True),
        )
    )
    if not currency:
        raise ResourceNotFoundException(f"Currency '{req.preferred_currency}' is not supported")

    # Create User
    new_user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip(),
        status="active",
        country_code=country.country_code,
        preferred_currency=currency.code,
        is_mfa_enabled=False,
    )
    db.add(new_user)
    await db.flush()

    # Assign Role
    user_role = UserRole(user_id=new_user.id, role=req.role)
    db.add(user_role)

    # If professional, initialize default profile
    if req.role == "professional":
        profile = ProfessionalProfile(
            user_id=new_user.id,
            display_name=f"{new_user.first_name} {new_user.last_name}",
            title="Independent Consultant",
            biography="Professional consultant ready for business opportunities on BitQube.",
            country_code=new_user.country_code,
            currency_code=new_user.preferred_currency,
            skills=["Consulting"],
            professional_status="available",
            verification_status="unverified",
        )
        db.add(profile)

    # Generate Email Verification Token
    raw_verify_token = generate_secure_token()
    verify_record = EmailVerificationToken(
        user_id=new_user.id,
        token_hash=hash_token(raw_verify_token),
        expires_at=datetime.now(UTC) + timedelta(hours=24),
    )
    db.add(verify_record)

    # Create Session Tokens
    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    session_record = Session(
        user_id=new_user.id,
        refresh_token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session_record)
    await db.commit()

    set_auth_cookies(response, access_token, refresh_token)

    user_summary = UserSummary(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        status=new_user.status,
        country_code=new_user.country_code,
        preferred_currency=new_user.preferred_currency,
        roles=[req.role],
        is_mfa_enabled=False,
        email_verified_at=new_user.email_verified_at,
        created_at=new_user.created_at,
    )

    return ResponseModel(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_summary,
            requires_mfa=False,
        )
    )


@router.post("/login", response_model=ResponseModel[TokenResponse])
async def login(
    req: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(User)
        .where(User.email == req.email.lower())
        .options(selectinload(User.roles))
    )
    user = await db.scalar(stmt)
    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if user.status in ("suspended", "deactivated"):
        raise UnauthorizedException(f"Account is {user.status}. Please contact support.")

    user_roles = [r.role for r in user.roles]
    is_admin = "administrator" in user_roles

    # Check MFA requirement
    if user.is_mfa_enabled or is_admin:
        if not user.mfa_secret:
            # If admin has not set up MFA yet, we require setup or allow temporary bootstrap
            pass
        elif not req.totp_code:
            return ResponseModel(
                data=TokenResponse(
                    access_token="",
                    refresh_token="",
                    expires_in_seconds=0,
                    user=UserSummary(
                        id=user.id,
                        email=user.email,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        status=user.status,
                        country_code=user.country_code,
                        preferred_currency=user.preferred_currency,
                        roles=user_roles,
                        is_mfa_enabled=user.is_mfa_enabled,
                        email_verified_at=user.email_verified_at,
                        created_at=user.created_at,
                    ),
                    requires_mfa=True,
                )
            )
        else:
            if not verify_totp(user.mfa_secret, req.totp_code):
                raise UnauthorizedException("Invalid 6-digit MFA authentication code")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    session_record = Session(
        user_id=user.id,
        refresh_token_hash=hash_token(refresh_token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session_record)
    await db.commit()

    set_auth_cookies(response, access_token, refresh_token)

    return ResponseModel(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserSummary(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                status=user.status,
                country_code=user.country_code,
                preferred_currency=user.preferred_currency,
                roles=user_roles,
                is_mfa_enabled=user.is_mfa_enabled,
                email_verified_at=user.email_verified_at,
                created_at=user.created_at,
            ),
            requires_mfa=False,
        )
    )


@router.post("/logout", response_model=ResponseModel[dict])
async def logout(response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    clear_auth_cookies(response)
    raw_refresh = request.cookies.get("refresh_token")
    if raw_refresh:
        h = hash_token(raw_refresh)
        session_rec = await db.scalar(
            select(Session).where(Session.refresh_token_hash == h, Session.revoked_at.is_(None))
        )
        if session_rec:
            session_rec.revoked_at = datetime.now(UTC)
            await db.commit()
    return ResponseModel(data={"message": "Logged out successfully"})


@router.post("/verify-email", response_model=ResponseModel[dict])
async def verify_email(req: EmailVerifyRequest, db: AsyncSession = Depends(get_db)):
    t_hash = hash_token(req.token)
    stmt = select(EmailVerificationToken).where(
        EmailVerificationToken.token_hash == t_hash,
        EmailVerificationToken.used_at.is_(None),
        EmailVerificationToken.expires_at > datetime.now(UTC),
    )
    record = await db.scalar(stmt)
    if not record:
        raise UnauthorizedException("Invalid or expired email verification link")

    record.used_at = datetime.now(UTC)
    user = await db.get(User, record.user_id)
    if user:
        user.email_verified_at = datetime.now(UTC)
    await db.commit()

    return ResponseModel(data={"message": "Email verified successfully"})


@router.post("/forgot-password", response_model=ResponseModel[dict])
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email.lower()))
    raw_token = None
    if user:
        raw_token = generate_secure_token()
        rec = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(hours=2),
        )
        db.add(rec)
        await db.commit()

    # In development mode, return token in payload for developer convenience
    data = {"message": "Password reset instructions have been sent to your email."}
    if settings.ENVIRONMENT == "development" and raw_token:
        data["dev_reset_token"] = raw_token
    return ResponseModel(data=data)


@router.post("/reset-password", response_model=ResponseModel[dict])
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    t_hash = hash_token(req.token)
    stmt = select(PasswordResetToken).where(
        PasswordResetToken.token_hash == t_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.now(UTC),
    )
    rec = await db.scalar(stmt)
    if not rec:
        raise UnauthorizedException("Invalid or expired password reset link")

    rec.used_at = datetime.now(UTC)
    user = await db.get(User, rec.user_id)
    if user:
        user.password_hash = hash_password(req.new_password)
    await db.commit()

    return ResponseModel(data={"message": "Password reset successfully. You can now log in."})
