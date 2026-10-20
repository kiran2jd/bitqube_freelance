from datetime import UTC, datetime, timedelta
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt

from app.core.config import settings

# Initialize Argon2id hasher with secure parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def create_access_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any) -> str:
    """Generate JWT refresh token."""
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for persistent database storage."""
    import hashlib
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_secure_token() -> str:
    """Generate a high-entropy URL-safe token."""
    import secrets
    return secrets.token_urlsafe(32)


def generate_totp_secret() -> str:
    """Generate a base32 TOTP secret for MFA."""
    import pyotp
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    """Generate the otpauth URI for QR codes and authenticator apps."""
    import pyotp
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="BitQube Freelance")


def verify_totp(secret: str, code: str) -> bool:
    """Verify a 6-digit TOTP code against the secret with a 1-step window."""
    import pyotp
    totp = pyotp.TOTP(secret)
    return bool(totp.verify(code, valid_window=1))

