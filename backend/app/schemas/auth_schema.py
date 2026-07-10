from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip().lower()

        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Please enter a valid email address")

        return email

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(char.isalpha() for char in value):
            raise ValueError("Password must contain at least one letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")

        return value

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if not any(char.isalpha() for char in value):
            raise ValueError("Password must contain at least one letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")

        return value

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1)

class ResendVerificationRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

class MessageResponse(BaseModel):
    message: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    is_admin: bool
    is_email_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)