"""Shared FlowMind pytest fixtures.

SAFETY DESIGN
-------------
The suite forces DATABASE_URL to a dedicated SQLite file before importing the
FlowMind app. FastAPI's get_db dependency is then overridden so requests use
only this test database. Real PostgreSQL data is never used by these fixtures.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

TEST_DB_PATH = Path(__file__).resolve().parents[1] / ".flowmind_pytest.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH.as_posix()}"

# Must be set before app.core.config / app.database.database are imported.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("SECRET_KEY", "flowmind-pytest-only-secret-key")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("RESEND_API_KEY", "")

if not os.environ["DATABASE_URL"].startswith("sqlite:///"):
    raise RuntimeError("FlowMind tests refuse to run against a non-SQLite database")

from app.api import auth as auth_api  # noqa: E402
from app.database import database as database_module  # noqa: E402
from app.database.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.user_profile import UserProfile  # noqa: E402
from app.core.security import create_access_token, hash_password  # noqa: E402

# app.main performs its normal create_all during import, but DATABASE_URL already
# points to the disposable test file. Close that bootstrap engine before the
# dedicated thread-safe pytest engine takes over.
database_module.engine.dispose()

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    module = dbapi_connection.__class__.__module__
    if module.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def _override_get_db() -> Iterator[Session]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def isolated_database() -> Iterator[None]:
    """Give every test a fresh schema and clear in-memory rate-limit state."""
    auth_api.rate_limit_store.clear()
    auth_api.email_rate_limit_store.clear()
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db() -> Iterator[Session]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def user(db: Session) -> User:
    account = User(
        full_name="FlowMind Test User",
        email="pytest.user@example.com",
        hashed_password=hash_password("TestPass123!"),
        is_email_verified=True,
        is_active=True,
        is_admin=False,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    db.add(
        UserProfile(
            user_id=account.id,
            timezone="Asia/Colombo",
            daily_focus_goal_minutes=120,
            week_starts_on="monday",
            email_notifications=True,
            task_reminders=True,
            habit_reminders=True,
            weekly_summary=True,
            compact_dashboard=False,
        )
    )
    db.commit()
    return account


@pytest.fixture
def other_user(db: Session) -> User:
    account = User(
        full_name="Other Test User",
        email="pytest.other@example.com",
        hashed_password=hash_password("OtherPass123!"),
        is_email_verified=True,
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@pytest.fixture
def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.fixture
def other_auth_headers(other_user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(other_user.id)}"}


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database() -> Iterator[None]:
    yield
    test_engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
