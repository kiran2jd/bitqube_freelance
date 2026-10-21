from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.schemas.base import ErrorBody, ErrorDetail, ErrorEnvelope


class BitQubeException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: list[ErrorDetail] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


class ResourceNotFoundException(BitQubeException):
    def __init__(self, message: str = "Resource not found", details: list[ErrorDetail] | None = None):
        super().__init__(
            message=message,
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


NotFoundException = ResourceNotFoundException


class BadRequestException(BitQubeException):
    def __init__(self, message: str = "Bad request", details: list[ErrorDetail] | None = None):
        super().__init__(
            message=message,
            code="BAD_REQUEST",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class ConflictException(BitQubeException):
    def __init__(self, message: str = "Resource conflict", details: list[ErrorDetail] | None = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class UnauthorizedException(BitQubeException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(BitQubeException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class SecurityViolationException(BitQubeException):
    def __init__(self, message: str = "Security policy violation"):
        super().__init__(
            message=message,
            code="SECURITY_VIOLATION",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class BusinessRuleViolationException(BitQubeException):
    def __init__(self, message: str = "Business rule violation"):
        super().__init__(
            message=message,
            code="BUSINESS_RULE_VIOLATION",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BitQubeException)
    async def bitqube_exception_handler(request: Request, exc: BitQubeException):
        envelope = ErrorEnvelope(
            success=False,
            error=ErrorBody(
                code=exc.code,
                message=exc.message,
                details=exc.details,
                request_id=getattr(request.state, "request_id", None),
            ),
        )
        return JSONResponse(status_code=exc.status_code, content=envelope.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = [
            ErrorDetail(
                field=".".join([str(loc) for loc in err["loc"] if loc != "body"]),
                issue=err["msg"],
            )
            for err in exc.errors()
        ]
        envelope = ErrorEnvelope(
            success=False,
            error=ErrorBody(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                details=details,
                request_id=getattr(request.state, "request_id", None),
            ),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=envelope.model_dump(),
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        envelope = ErrorEnvelope(
            success=False,
            error=ErrorBody(
                code="RATE_LIMIT_EXCEEDED",
                message=f"Rate limit exceeded: {exc.detail}",
                details=[],
                request_id=getattr(request.state, "request_id", None),
            ),
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=envelope.model_dump(),
        )
