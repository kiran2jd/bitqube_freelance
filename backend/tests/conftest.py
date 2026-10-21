import os
import sys

import pytest
import sqlalchemy as sa
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import get_db, sync_engine
from app.main import app

# NullPool async engine specifically for testing to prevent cross-event-loop connection reuse
test_async_engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
)
test_async_session_factory = async_sessionmaker(
    bind=test_async_engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


async def override_get_db():
    async with test_async_session_factory() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db

# Disable rate limiter for test suites to prevent false positive 429s
limiter.enabled = False


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure database schema is created and seeded cleanly for testing."""
    Base.metadata.create_all(bind=sync_engine)
    with sync_engine.connect() as conn:
        with conn.begin():
            conn.execute(
                sa.text(
                    "TRUNCATE TABLE users, user_roles, sessions, email_verification_tokens, "
                    "password_reset_tokens, professional_profiles, professional_credentials, "
                    "services, projects, proposals, contracts, milestones, reviews, "
                    "payments, refunds, ledger_entries CASCADE"
                )
            )
    seed_database()
    yield


@pytest.fixture
async def client():
    """Async HTTP test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session():
    """Direct database session fixture."""
    async with test_async_session_factory() as session:
        yield session
