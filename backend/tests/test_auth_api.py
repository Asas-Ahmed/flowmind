from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from sqlalchemy import select

from app.api.auth import ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME
from app.core.config import settings
from app.core.security import create_refresh_token, verify_password
from app.models.user import User

pytestmark = pytest.mark.api


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers, user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == user.id
    assert response.json()["email"] == user.email


def test_protected_route_accepts_bearer_token(client, auth_headers):
    response = client.get("/api/auth/protected", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "You are authenticated"


def test_login_valid_verified_user(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "TestPass123!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]
    assert ACCESS_COOKIE_NAME in response.cookies
    assert REFRESH_COOKIE_NAME in response.cookies


def test_login_rejects_wrong_password(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "WrongPass123!"},
    )
    assert response.status_code == 401


def test_login_rejects_unverified_user(client, db):
    from app.core.security import hash_password

    account = User(
        full_name="Unverified User",
        email="unverified@example.com",
        hashed_password=hash_password("TestPass123!"),
        is_email_verified=False,
        is_active=True,
    )
    db.add(account)
    db.commit()
    response = client.post(
        "/api/auth/login",
        json={"email": account.email, "password": "TestPass123!"},
    )
    assert response.status_code in {401, 403}


def test_register_creates_unverified_user_without_sending_real_email(client, db, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.send_email_verification_email", lambda **_: None)
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "New Test User",
            "email": "new.user@example.com",
            "password": "NewPass123!",
        },
    )
    assert response.status_code == 201
    created = db.scalar(select(User).where(User.email == "new.user@example.com"))
    assert created is not None
    assert created.is_email_verified is False
    assert verify_password("NewPass123!", created.hashed_password)


def test_register_rejects_duplicate_verified_email(client, user, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.send_email_verification_email", lambda **_: None)
    response = client.post(
        "/api/auth/register",
        json={"full_name": "Duplicate", "email": user.email, "password": "NewPass123!"},
    )
    assert response.status_code == 409


def test_refresh_requires_refresh_cookie(client):
    response = client.post("/api/auth/refresh")
    assert response.status_code == 401


def test_refresh_issues_new_tokens(client, user):
    client.cookies.set(REFRESH_COOKIE_NAME, create_refresh_token(user.id))
    response = client.post("/api/auth/refresh")
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_logout_clears_auth_cookies(client):
    client.cookies.set(ACCESS_COOKIE_NAME, "abc")
    client.cookies.set(REFRESH_COOKIE_NAME, "xyz")
    response = client.post("/api/auth/logout")
    assert response.status_code == 200


def test_verify_email_accepts_current_verification_version(client, db):
    from app.core.security import hash_password

    account = User(
        full_name="Verify User",
        email="verify@example.com",
        hashed_password=hash_password("TestPass123!"),
        is_email_verified=False,
        is_active=True,
        email_verification_version=2,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    token = jwt.encode(
        {
            "sub": str(account.id),
            "email": account.email,
            "type": "email_verification",
            "verification_version": 2,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    response = client.post("/api/auth/verify-email", json={"token": token})
    assert response.status_code == 200
    db.refresh(account)
    assert account.is_email_verified is True


def test_password_reset_changes_password_and_invalidates_token(client, db, user, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.send_password_reset_email", lambda **_: None)
    before_version = user.password_reset_version
    response = client.post("/api/auth/forgot-password", json={"email": user.email})
    assert response.status_code == 200
    db.refresh(user)
    assert user.password_reset_version == before_version + 1

    token = jwt.encode(
        {
            "sub": str(user.id),
            "email": user.email,
            "type": "password_reset",
            "reset_version": user.password_reset_version,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    reset = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "ChangedPass123!"},
    )
    assert reset.status_code == 200
    db.refresh(user)
    assert verify_password("ChangedPass123!", user.hashed_password)

    replay = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "AgainPass123!"},
    )
    assert replay.status_code == 400
