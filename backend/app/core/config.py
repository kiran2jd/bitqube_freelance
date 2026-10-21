from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "BitQube Freelance"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DOMAIN: str = "localhost"

    # Security
    SECRET_KEY: str = "default-dev-secret-key-please-change-in-production-min32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://www.bitqube.org",
        "https://bitqube.org",
    ]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5433
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_dev_password"
    POSTGRES_DB: str = "bitqube_dev"
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres_dev_password@localhost:5433/bitqube_dev"
    )
    SYNC_DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres_dev_password@localhost:5433/bitqube_dev"
    )

    # Defaults
    DEFAULT_COUNTRY: str = "IN"
    DEFAULT_CURRENCY: str = "INR"
    DISPLAY_CURRENCY: str = "USD"
    USD_TO_INR_EXCHANGE_RATE: float = 84.00
    PLATFORM_FEE_PERCENTAGE: float = 10.0

    # Razorpay (Primary Fiat Gateway)
    PAYMENT_PROVIDER: str = "razorpay"
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "rzp_secret_placeholder"
    RAZORPAY_WEBHOOK_SECRET: str = "rzp_whsec_placeholder"

    # S3 Object Storage
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "bitqube-documents-dev"
    S3_REGION: str = "blr1"

    # Feature Flags (Strictly False by default)
    FEATURE_FLAG_BTQ_PAYMENTS: bool = False
    FEATURE_FLAG_QUBEX_BENEFITS: bool = False


settings = Settings()
