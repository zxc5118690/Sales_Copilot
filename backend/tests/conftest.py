from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import get_db
from app.main import app
from app.models import Account, Base, Contact


@pytest.fixture(scope="session")
def engine():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(engine):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(engine):
    testing_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded_contact(db_session):
    now = datetime.now(UTC)
    account = Account(
        company_name="Test Semicon Co",
        segment="WAFER_FAB",
        region="TW",
        website="https://example.com",
        source="test",
        priority_tier="T1",
        created_at=now,
        updated_at=now,
    )
    db_session.add(account)
    db_session.flush()
    contact = Contact(
        account_id=account.id,
        full_name="RD Lead",
        role_title="RD Director",
        channel_email="rd@test.example",
        channel_linkedin="https://linkedin.com/in/test",
        contactability_score=80,
        created_at=now,
    )
    db_session.add(contact)
    db_session.commit()
    return {"account_id": account.id, "contact_id": contact.id}

