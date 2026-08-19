from datetime import timedelta

import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

pytestmark = pytest.mark.unit


def test_password_hash_is_not_plaintext():
    hashed = hash_password("StrongPass123!")
    assert hashed != "StrongPass123!"
    assert hashed.startswith("$2")


def test_password_verification_accepts_correct_password():
    hashed = hash_password("StrongPass123!")
    assert verify_password("StrongPass123!", hashed) is True


def test_password_verification_rejects_wrong_password():
    hashed = hash_password("StrongPass123!")
    assert verify_password("WrongPass123!", hashed) is False


def test_access_token_contains_subject_and_type():
    token = create_access_token(42)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["type"] == "access"


def test_refresh_token_contains_refresh_type():
    token = create_refresh_token(42)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["type"] == "refresh"


def test_invalid_token_returns_none():
    assert decode_token("not-a-valid-jwt") is None


def test_expired_access_token_returns_none():
    token = create_access_token(42, expires_delta=timedelta(seconds=-1))
    assert decode_token(token) is None
