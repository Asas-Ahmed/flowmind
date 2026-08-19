"""Dedicated FlowMind E2E server.

This module is intentionally separate from the normal application runtime.
It forces a disposable SQLite database before importing FlowMind, seeds one
verified account, and exposes a reset endpoint used only by Playwright.

Run only through the Playwright test configuration or manually for E2E work.
It never uses the normal PostgreSQL DATABASE_URL.
"""
from __future__ import annotations

import os
from pathlib import Path

TEST_DB_PATH = Path(__file__).resolve().parents[1] / ".flowmind_e2e.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH.as_posix()}"

# Safety first: override configuration before importing application modules.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("SECRET_KEY", "flowmind-e2e-only-secret-key")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("RESEND_API_KEY", "")

if not os.environ["DATABASE_URL"].startswith("sqlite:///"):
    raise RuntimeError("FlowMind E2E tests refuse to run against a non-SQLite database")

from app.api import auth as auth_api  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.database.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.user_profile import UserProfile  # noqa: E402

E2E_EMAIL = "e2e.user@example.com"
E2E_PASSWORD = "E2ePass123!"


def reset_e2e_database() -> None:
    """Recreate only the disposable E2E schema and seed a verified user."""
    auth_api.rate_limit_store.clear()
    auth_api.email_rate_limit_store.clear()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user = User(
            full_name="FlowMind E2E User",
            email=E2E_EMAIL,
            hashed_password=hash_password(E2E_PASSWORD),
            is_email_verified=True,
            is_active=True,
            is_admin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add(
            UserProfile(
                user_id=user.id,
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
    finally:
        db.close()


reset_e2e_database()


@app.post("/api/e2e/reset", include_in_schema=False)
def reset_e2e_state() -> dict[str, str]:
    reset_e2e_database()
    return {"status": "reset"}
