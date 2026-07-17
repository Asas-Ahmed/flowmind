from sqlalchemy.orm import Session

from app.models.user_profile import UserProfile


def get_profile_by_user_id(
    db: Session,
    user_id: int,
) -> UserProfile | None:
    return (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first()
    )


def create_profile(
    db: Session,
    user_id: int,
) -> UserProfile:
    profile = UserProfile(user_id=user_id)

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def get_or_create_profile(
    db: Session,
    user_id: int,
) -> UserProfile:
    profile = get_profile_by_user_id(db, user_id)

    if profile:
        return profile

    return create_profile(db, user_id)