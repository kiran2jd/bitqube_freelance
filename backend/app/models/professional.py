import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, utc_now


class ProfessionalProfile(Base, TimestampMixin):
    __tablename__ = "professional_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    biography: Mapped[str] = mapped_column(Text, nullable=False)
    country_code: Mapped[str] = mapped_column(
        String(2), ForeignKey("supported_countries.country_code"), nullable=False
    )
    hourly_rate: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    currency_code: Mapped[str] = mapped_column(
        String(3), ForeignKey("supported_currencies.code"), nullable=False
    )
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    professional_status: Mapped[str] = mapped_column(
        String(30), default="available", nullable=False
    )  # available, busy, inactive
    verification_status: Mapped[str] = mapped_column(
        String(30), default="unverified", nullable=False
    )  # unverified, pending, verified, rejected
    rating_average: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0.00"), nullable=False
    )
    total_reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="professional_profile")
    credentials: Mapped[list["ProfessionalCredential"]] = relationship(
        "ProfessionalCredential", back_populates="professional", cascade="all, delete-orphan", lazy="selectin"
    )


class ProfessionalCredential(Base):
    __tablename__ = "professional_credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    professional_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("professional_profiles.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_organization: Mapped[str] = mapped_column(String(200), nullable=False)
    credential_identifier: Mapped[str | None] = mapped_column(String(100), nullable=True)
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False
    )  # pending, verified, rejected
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    professional: Mapped["ProfessionalProfile"] = relationship(
        "ProfessionalProfile", back_populates="credentials"
    )
