from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.governance import FeatureFlag, SupportedCountry, SupportedCurrency
from app.schemas.base import ResponseModel
from app.schemas.config import (
    CountryResponse,
    CurrencyResponse,
    FeatureFlagsPublic,
    PublicConfigResponse,
)

router = APIRouter()


@router.get("/public", response_model=ResponseModel[PublicConfigResponse])
async def get_public_config(db: AsyncSession = Depends(get_db)):
    countries_res = await db.scalars(
        select(SupportedCountry).where(SupportedCountry.is_enabled.is_(True))
    )
    currencies_res = await db.scalars(
        select(SupportedCurrency).where(SupportedCurrency.is_enabled.is_(True))
    )
    flags_res = await db.scalars(select(FeatureFlag))
    flags_map = {flag.key: flag.value for flag in flags_res.all()}

    btq_enabled = flags_map.get("btq_payments_enabled", settings.FEATURE_FLAG_BTQ_PAYMENTS)
    qubex_enabled = flags_map.get("qubex_benefits_enabled", settings.FEATURE_FLAG_QUBEX_BENEFITS)

    config_data = PublicConfigResponse(
        default_country=settings.DEFAULT_COUNTRY,
        default_currency=settings.DEFAULT_CURRENCY,
        display_currency=settings.DISPLAY_CURRENCY,
        usd_to_inr_exchange_rate=float(settings.USD_TO_INR_EXCHANGE_RATE),
        payment_provider=settings.PAYMENT_PROVIDER,
        platform_fee_percentage=settings.PLATFORM_FEE_PERCENTAGE,
        countries=[CountryResponse.model_validate(c) for c in countries_res.all()],
        currencies=[CurrencyResponse.model_validate(c) for c in currencies_res.all()],
        feature_flags=FeatureFlagsPublic(
            btq_payments_enabled=btq_enabled,
            qubex_benefits_enabled=qubex_enabled,
        ),
    )
    return ResponseModel(data=config_data)
