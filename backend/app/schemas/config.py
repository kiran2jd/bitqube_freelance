
from pydantic import BaseModel, ConfigDict


class CountryResponse(BaseModel):
    country_code: str
    name: str
    default_currency: str
    is_enabled: bool
    model_config = ConfigDict(from_attributes=True)


class CurrencyResponse(BaseModel):
    code: str
    name: str
    symbol: str
    is_enabled: bool
    model_config = ConfigDict(from_attributes=True)


class FeatureFlagsPublic(BaseModel):
    btq_payments_enabled: bool
    qubex_benefits_enabled: bool


class PublicConfigResponse(BaseModel):
    default_country: str
    default_currency: str
    display_currency: str = "USD"
    usd_to_inr_exchange_rate: float = 84.0
    payment_provider: str
    platform_fee_percentage: float
    countries: list[CountryResponse]
    currencies: list[CurrencyResponse]
    feature_flags: FeatureFlagsPublic
