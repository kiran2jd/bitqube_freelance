import logging

from sqlalchemy import select

from app.db.session import sync_session_factory
from app.models.category import Category
from app.models.governance import FeatureFlag, SupportedCountry, SupportedCurrency

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bitqube.seed")

MASTER_COUNTRIES = [
    {"country_code": "IN", "name": "India", "default_currency": "INR", "is_enabled": True},
    {"country_code": "US", "name": "United States", "default_currency": "USD", "is_enabled": True},
    {"country_code": "GB", "name": "United Kingdom", "default_currency": "GBP", "is_enabled": True},
    {"country_code": "DE", "name": "Germany", "default_currency": "EUR", "is_enabled": True},
]

MASTER_CURRENCIES = [
    {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "is_enabled": True},
    {"code": "USD", "name": "US Dollar", "symbol": "$", "is_enabled": True},
    {"code": "GBP", "name": "British Pound", "symbol": "£", "is_enabled": True},
    {"code": "EUR", "name": "Euro", "symbol": "€", "is_enabled": True},
]

MASTER_FEATURE_FLAGS = [
    {
        "key": "btq_payments_enabled",
        "value": False,
        "description": "Enables future active BTQ crypto token payments (Disabled for MVP)",
    },
    {
        "key": "qubex_benefits_enabled",
        "value": False,
        "description": "Enables future QUBEX loyalty discounts and rewards (Disabled for MVP)",
    },
]

MASTER_CATEGORIES = [
    {
        "name": "Legal Services",
        "slug": "legal-services",
        "description": "Contract drafting, corporate documentation, IP protection, regulatory compliance support, and legal consulting by authorized professionals.",
        "icon_name": "Scale",
        "is_regulated": True,
        "sort_order": 1,
    },
    {
        "name": "Business Advisory",
        "slug": "business-advisory",
        "description": "Startup consulting, strategic planning, business development, market expansion research, and executive advisory.",
        "icon_name": "Briefcase",
        "is_regulated": False,
        "sort_order": 2,
    },
    {
        "name": "Financial Advisory",
        "slug": "financial-advisory",
        "description": "Financial planning, modeling, budgeting, valuation, and investment advisory through authorized professionals.",
        "icon_name": "TrendingUp",
        "is_regulated": True,
        "sort_order": 3,
    },
    {
        "name": "Web3 & Blockchain Developers",
        "slug": "web3-blockchain-developers",
        "description": "Smart contracts, decentralized apps (dApps), protocol engineering, audits, token architectures, and blockchain integration.",
        "icon_name": "Blocks",
        "is_regulated": False,
        "sort_order": 4,
    },
    {
        "name": "IT Consultancy",
        "slug": "it-consultancy",
        "description": "Enterprise software architecture, cloud infrastructure, cybersecurity audits, DevOps, and technical support.",
        "icon_name": "Server",
        "is_regulated": False,
        "sort_order": 5,
    },
    {
        "name": "Web & Mobile Development",
        "slug": "web-mobile-development",
        "description": "Full-stack web applications, iOS and Android apps, e-commerce platforms, custom SaaS products, and API development.",
        "icon_name": "Code",
        "is_regulated": False,
        "sort_order": 6,
    },
    {
        "name": "Digital Marketing",
        "slug": "digital-marketing",
        "description": "Search engine optimization (SEO), performance advertising, social media strategy, branding, and lead generation.",
        "icon_name": "Megaphone",
        "is_regulated": False,
        "sort_order": 7,
    },
    {
        "name": "AI & Automation",
        "slug": "ai-automation",
        "description": "Machine learning, LLM fine-tuning, workflow automations, intelligent chatbots, and predictive data analytics.",
        "icon_name": "Bot",
        "is_regulated": False,
        "sort_order": 8,
    },
    {
        "name": "Design & Creative Services",
        "slug": "design-creative-services",
        "description": "UI/UX design, brand identity systems, graphic design, motion design, video editing, and creative direction.",
        "icon_name": "Palette",
        "is_regulated": False,
        "sort_order": 9,
    },
    {
        "name": "Accounting & Taxation",
        "slug": "accounting-taxation",
        "description": "Bookkeeping, financial reporting, corporate tax filings, international tax planning, and statutory compliance.",
        "icon_name": "Calculator",
        "is_regulated": True,
        "sort_order": 10,
    },
    {
        "name": "HR & Recruitment",
        "slug": "hr-recruitment",
        "description": "Executive search, technical talent acquisition, compensation consulting, and human resources policy development.",
        "icon_name": "Users",
        "is_regulated": False,
        "sort_order": 11,
    },
    {
        "name": "Real Estate & Business Projects",
        "slug": "real-estate-business-projects",
        "description": "Property consulting, commercial feasibility studies, asset valuation, and business infrastructure planning.",
        "icon_name": "Building",
        "is_regulated": False,
        "sort_order": 12,
    },
    {
        "name": "Education & Training",
        "slug": "education-training",
        "description": "Corporate workshops, professional upskilling, technical bootcamps, and executive mentoring.",
        "icon_name": "GraduationCap",
        "is_regulated": False,
        "sort_order": 13,
    },
    {
        "name": "Translation & Documentation",
        "slug": "translation-documentation",
        "description": "Multilingual technical translation, legal transcription, technical copywriting, and document localization.",
        "icon_name": "Languages",
        "is_regulated": False,
        "sort_order": 14,
    },
    {
        "name": "Other Professional Services",
        "slug": "other-professional-services",
        "description": "Specialized consulting, niche advisory, and bespoke professional services across emerging global industries.",
        "icon_name": "Sparkles",
        "is_regulated": False,
        "sort_order": 15,
    },
]


def seed_database() -> None:
    logger.info("Starting idempotent database seed...")
    with sync_session_factory() as session:
        # 1. Currencies
        for item in MASTER_CURRENCIES:
            curr = session.get(SupportedCurrency, item["code"])
            if not curr:
                session.add(SupportedCurrency(**item))
                logger.info(f"Seeded currency: {item['code']}")
            else:
                curr.name = item["name"]
                curr.symbol = item["symbol"]
                curr.is_enabled = item["is_enabled"]

        # 2. Countries
        for item in MASTER_COUNTRIES:
            country = session.get(SupportedCountry, item["country_code"])
            if not country:
                session.add(SupportedCountry(**item))
                logger.info(f"Seeded country: {item['country_code']}")
            else:
                country.name = item["name"]
                country.default_currency = item["default_currency"]
                country.is_enabled = item["is_enabled"]

        # 3. Feature Flags
        for item in MASTER_FEATURE_FLAGS:
            flag = session.get(FeatureFlag, item["key"])
            if not flag:
                session.add(FeatureFlag(**item))
                logger.info(f"Seeded feature flag: {item['key']} = {item['value']}")
            else:
                flag.description = item["description"]

        # 4. Categories (15 Master Categories)
        for item in MASTER_CATEGORIES:
            stmt = select(Category).where(Category.slug == item["slug"])
            cat = session.scalar(stmt)
            if not cat:
                session.add(Category(**item))
                logger.info(f"Seeded category: {item['name']} ({item['slug']})")
            else:
                cat.name = item["name"]
                cat.description = item["description"]
                cat.icon_name = item["icon_name"]
                cat.is_regulated = item["is_regulated"]
                cat.sort_order = item["sort_order"]

        session.commit()
        logger.info("Database seeding successfully completed!")


if __name__ == "__main__":
    seed_database()
