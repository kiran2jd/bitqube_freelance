from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    categories,
    config,
    contracts,
    disputes,
    health,
    payments,
    professionals,
    projects,
    proposals,
    reviews,
    services,
    users,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["System Health"])
api_router.include_router(config.router, prefix="/config", tags=["Configuration"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(professionals.router, prefix="/professionals", tags=["Professionals"])
api_router.include_router(services.router, prefix="/services", tags=["Services Catalog"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["Proposals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments & Ledger"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin & Governance"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["Disputes"])
