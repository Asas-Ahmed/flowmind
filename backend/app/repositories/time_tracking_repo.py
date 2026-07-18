from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.time_tracking import TimeEntry, TimeTrackingProject


def list_projects(db: Session, user_id: int) -> list[TimeTrackingProject]:
    return list(
        db.scalars(
            select(TimeTrackingProject)
            .where(TimeTrackingProject.user_id == user_id)
            .order_by(TimeTrackingProject.is_archived, TimeTrackingProject.name)
        ).all()
    )


def get_project(db: Session, user_id: int, project_id: int) -> TimeTrackingProject | None:
    return db.scalar(
        select(TimeTrackingProject).where(
            TimeTrackingProject.id == project_id,
            TimeTrackingProject.user_id == user_id,
        )
    )


def list_entries(db: Session, user_id: int, limit: int = 250) -> list[TimeEntry]:
    return list(
        db.scalars(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id)
            .order_by(TimeEntry.started_at.desc(), TimeEntry.id.desc())
            .limit(limit)
        ).all()
    )


def list_entries_since(db: Session, user_id: int, since: datetime) -> list[TimeEntry]:
    return list(
        db.scalars(
            select(TimeEntry).where(
                TimeEntry.user_id == user_id,
                TimeEntry.started_at >= since,
            )
        ).all()
    )


def get_entry(db: Session, user_id: int, entry_id: int) -> TimeEntry | None:
    return db.scalar(
        select(TimeEntry).where(TimeEntry.id == entry_id, TimeEntry.user_id == user_id)
    )


def get_active_entry(db: Session, user_id: int) -> TimeEntry | None:
    return db.scalar(
        select(TimeEntry)
        .where(TimeEntry.user_id == user_id, TimeEntry.ended_at.is_(None))
        .order_by(TimeEntry.started_at.desc())
    )
