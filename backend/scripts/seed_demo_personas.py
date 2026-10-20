import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.seed import seed_database
from app.db.session import async_session_factory
from app.models.category import Category
from app.models.professional import ProfessionalCredential, ProfessionalProfile
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.service import Service
from app.models.user import User, UserRole

DEFAULT_PASSWORD = "BitQubeDemo2026!"


async def seed_demo():
    # Ensure master tables (categories, currencies, etc.) are seeded
    seed_database()

    async with async_session_factory() as db:
        print("[INFO] Seeding BitQube Demo Personas (Priya, Arjun, Vikram)...")

        # 1. Fetch Legal Services Category
        legal_cat = await db.scalar(
            select(Category).where(Category.slug == "legal-services")
        )
        ai_cat = await db.scalar(
            select(Category).where(Category.slug == "ai-automation")
        )

        # 2. Priya Sharma (Client)
        priya = await db.scalar(
            select(User)
            .where(User.email == "priya.client@bitqube.org")
            .options(selectinload(User.roles))
        )
        if not priya:
            priya = User(
                email="priya.client@bitqube.org",
                password_hash=hash_password(DEFAULT_PASSWORD),
                first_name="Priya",
                last_name="Sharma",
                country_code="IN",
                preferred_currency="INR",
                status="active",
                email_verified_at=datetime.now(UTC),
            )
            db.add(priya)
            await db.flush()
            db.add(UserRole(user_id=priya.id, role="customer"))
            print("[OK] Created Client user: Priya Sharma (priya.client@bitqube.org)")

        # 3. Vikram Malhotra (Administrator)
        vikram = await db.scalar(
            select(User)
            .where(User.email == "vikram.admin@bitqube.org")
            .options(selectinload(User.roles))
        )
        if not vikram:
            vikram = User(
                email="vikram.admin@bitqube.org",
                password_hash=hash_password(DEFAULT_PASSWORD),
                first_name="Vikram",
                last_name="Malhotra",
                country_code="IN",
                preferred_currency="INR",
                status="active",
                email_verified_at=datetime.now(UTC),
            )
            db.add(vikram)
            await db.flush()
            db.add(UserRole(user_id=vikram.id, role="administrator"))
            print("[OK] Created Admin user: Vikram Malhotra (vikram.admin@bitqube.org)")

        # 4. Arjun Mehta (Verified Professional)
        arjun = await db.scalar(
            select(User)
            .where(User.email == "arjun.consultant@bitqube.org")
            .options(selectinload(User.roles))
        )
        if not arjun:
            arjun = User(
                email="arjun.consultant@bitqube.org",
                password_hash=hash_password(DEFAULT_PASSWORD),
                first_name="Arjun",
                last_name="Mehta",
                country_code="IN",
                preferred_currency="INR",
                status="active",
                email_verified_at=datetime.now(UTC),
            )
            db.add(arjun)
            await db.flush()
            db.add(UserRole(user_id=arjun.id, role="professional"))
            print("[OK] Created Professional user: Arjun Mehta (arjun.consultant@bitqube.org)")

        # 5. Arjun's Profile & Credentials
        profile = await db.scalar(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == arjun.id)
        )
        if not profile:
            profile = ProfessionalProfile(
                user_id=arjun.id,
                display_name="Adv. Arjun Mehta",
                title="Senior Legal Counsel & AI Compliance Specialist",
                biography="Accredited advocate with 10+ years specializing in tech contracts, IP law, and AI compliance for high-growth tech startups and Web3 protocols.",
                country_code="IN",
                hourly_rate=Decimal("3500.00"),
                currency_code="INR",
                skills=["Contract Law", "Data Protection", "AI Compliance", "Smart Contracts", "Arbitration"],
                professional_status="available",
                verification_status="verified",
                rating_average=Decimal("4.95"),
                total_reviews_count=24,
            )
            db.add(profile)
            await db.flush()

            # Credential
            cred = ProfessionalCredential(
                professional_id=profile.id,
                title="Bar Council of India License",
                issuing_organization="Bar Council of Maharashtra & Goa",
                credential_identifier="BCI/MAH/2015/8892",
                verification_status="verified",
                verified_at=datetime.now(UTC),
            )
            db.add(cred)

            # Service
            if legal_cat:
                service = Service(
                    professional_id=profile.id,
                    category_id=legal_cat.id,
                    title="Comprehensive AI Platform & Data Privacy Legal Audit",
                    description="Full-scope audit of commercial SaaS agreements, GDPR/DPDP Act compliance, IP assignment warranties, and user terms.",
                    price_type="fixed",
                    base_price=Decimal("25000.00"),
                    currency_code="INR",
                    delivery_days=7,
                    status="active",
                )
                db.add(service)

            print("[OK] Created Arjun's verified profile, Bar credential, and active legal service")

        # 6. Sample Project posted by Priya
        project = await db.scalar(
            select(Project).where(
                Project.customer_id == priya.id,
                Project.title.ilike("%AI Contract Audit%"),
            )
        )
        if not project and legal_cat:
            project = Project(
                customer_id=priya.id,
                category_id=legal_cat.id,
                title="AI Contract Audit & Data Protection Compliance Review",
                description="We are scaling an enterprise AI analytics platform in Bangalore and need an accredited legal consultant to audit our client SaaS contracts, vendor IP clauses, and ensure strict alignment with the Digital Personal Data Protection (DPDP) Act.",
                budget_min=Decimal("40000.00"),
                budget_max=Decimal("50000.00"),
                currency_code="INR",
                deadline=datetime.now(UTC) + timedelta(days=21),
                status="open",
            )
            db.add(project)
            await db.flush()
            print("[OK] Created open project by Priya: 'AI Contract Audit & Data Protection Compliance Review'")

        # 7. Sample Proposal by Arjun
        if project and profile:
            proposal = await db.scalar(
                select(Proposal).where(
                    Proposal.project_id == project.id,
                    Proposal.professional_id == profile.id,
                )
            )
            if not proposal:
                proposal = Proposal(
                    project_id=project.id,
                    professional_id=profile.id,
                    amount=Decimal("50000.00"),
                    currency_code="INR",
                    estimated_duration_days=14,
                    cover_letter="Dear Priya, I have vetted over 40+ SaaS and AI platforms across India and Singapore. I will deliver a comprehensive 2-phase audit: Milestone 1 covering Risk Analysis & IP Audits (₹25,000), and Milestone 2 delivering the full compliant contract suite (₹25,000).",
                    status="submitted",
                )
                db.add(proposal)
                print("[OK] Created proposal from Arjun on Priya's project")

        await db.commit()
        print("\n[SUCCESS] Demo personas successfully seeded! Ready for interactive testing.")


if __name__ == "__main__":
    asyncio.run(seed_demo())
