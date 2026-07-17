from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_profile import UserProfile
from app.repositories.profile_repo import get_or_create_profile
from app.schemas.profile_schema import ProfileResponse, ProfileUpdate


def build_profile_response(
    user: User,
    profile: UserProfile,
) -> ProfileResponse:
    return ProfileResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_email_verified=user.is_email_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        timezone=profile.timezone,
        daily_focus_goal_minutes=profile.daily_focus_goal_minutes,
        week_starts_on=profile.week_starts_on,
        email_notifications=profile.email_notifications,
        task_reminders=profile.task_reminders,
        habit_reminders=profile.habit_reminders,
        weekly_summary=profile.weekly_summary,
        compact_dashboard=profile.compact_dashboard,
        updated_at=profile.updated_at,
    )


def get_user_profile(
    db: Session,
    user: User,
) -> ProfileResponse:
    profile = get_or_create_profile(db, user.id)

    return build_profile_response(user, profile)


def update_user_profile(
    db: Session,
    user: User,
    profile_data: ProfileUpdate,
) -> ProfileResponse:
    profile = get_or_create_profile(db, user.id)

    user.full_name = profile_data.full_name

    profile.timezone = profile_data.timezone
    profile.daily_focus_goal_minutes = (
        profile_data.daily_focus_goal_minutes
    )
    profile.week_starts_on = profile_data.week_starts_on
    profile.email_notifications = profile_data.email_notifications
    profile.task_reminders = profile_data.task_reminders
    profile.habit_reminders = profile_data.habit_reminders
    profile.weekly_summary = profile_data.weekly_summary
    profile.compact_dashboard = profile_data.compact_dashboard

    try:
        db.add(user)
        db.add(profile)
        db.commit()

        db.refresh(user)
        db.refresh(profile)
    except SQLAlchemyError:
        db.rollback()
        raise

    return build_profile_response(user, profile)