from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginationMeta(BaseModel):
    offset: int
    limit: int
    total_count: int
    has_next: bool


class ResponseModel(BaseModel, Generic[T]):
    success: bool = True
    data: T
    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def ok(cls, data: T, **kwargs) -> "ResponseModel[T]":
        return cls(success=True, data=data, **kwargs)


ApiResponse = ResponseModel


class PaginatedResponseModel(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    pagination: PaginationMeta
    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    field: str | None = None
    issue: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []
    request_id: str | None = None


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: ErrorBody
