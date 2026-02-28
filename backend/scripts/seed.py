from datetime import UTC, datetime

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Account, Contact


SEED_ACCOUNTS = [
    {
        "company_name": "ASE Technology",
        "segment": "PACKAGING_TEST",
        "region": "TW",
        "website": "https://www.aseglobal.com",
        "source": "manual_seed",
        "priority_tier": "T1",
    },
    {
        "company_name": "Powertech Technology",
        "segment": "PACKAGING_TEST",
        "region": "TW",
        "website": "https://www.powertechgroup.com",
        "source": "manual_seed",
        "priority_tier": "T1",
    },
    {
        "company_name": "Innolux Corporation",
        "segment": "DISPLAY",
        "region": "TW",
        "website": "https://www.innolux.com",
        "source": "manual_seed",
        "priority_tier": "T2",
    },
]


def seed_accounts() -> None:
    now = datetime.now(UTC)
    with SessionLocal() as db:
        account_id_by_name: dict[str, int] = {}
        for item in SEED_ACCOUNTS:
            existing = db.execute(select(Account).where(Account.company_name == item["company_name"])).scalar_one_or_none()
            if existing:
                account_id_by_name[item["company_name"]] = existing.id
                continue
            account = Account(
                company_name=item["company_name"],
                segment=item["segment"],
                region=item["region"],
                website=item["website"],
                source=item["source"],
                priority_tier=item["priority_tier"],
                created_at=now,
                updated_at=now,
            )
            db.add(account)
            db.flush()
            account_id_by_name[item["company_name"]] = account.id

        sample_contacts = [
            {
                "company_name": "ASE Technology",
                "full_name": "Equipment Engineering Manager Sample",
                "role_title": "Equipment Engineering Manager",
                "channel_email": "eq.sample@ase.example",
                "channel_linkedin": "https://www.linkedin.com/in/sample-eq-mgr",
                "contactability_score": 74,
            },
            {
                "company_name": "Powertech Technology",
                "full_name": "Process Engineer Lead Sample",
                "role_title": "Process Engineer Lead",
                "channel_email": "process.sample@powertech.example",
                "channel_linkedin": "https://www.linkedin.com/in/sample-process-lead",
                "contactability_score": 78,
            },
        ]
        for item in sample_contacts:
            account_id = account_id_by_name.get(item["company_name"])
            if not account_id:
                continue
            existing = db.execute(
                select(Contact).where(
                    Contact.account_id == account_id,
                    Contact.channel_email == item["channel_email"],
                )
            ).scalar_one_or_none()
            if existing:
                continue
            db.add(
                Contact(
                    account_id=account_id,
                    full_name=item["full_name"],
                    role_title=item["role_title"],
                    channel_email=item["channel_email"],
                    channel_linkedin=item["channel_linkedin"],
                    contactability_score=item["contactability_score"],
                    created_at=now,
                )
            )
        db.commit()


if __name__ == "__main__":
    seed_accounts()
    print("Seed complete")
