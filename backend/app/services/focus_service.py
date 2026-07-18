from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.user import User
from app.repositories.focus_repo import get_active_session, get_session, list_sessions
from app.repositories.task_repo import get_task
from app.schemas.focus_schema import FocusSessionAction, FocusSessionCreate


def _utc_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def _completed_minutes(session: FocusSession) -> int:
    if session.status != "completed" or session.mode != "focus":
        return 0
    return max(0, round(session.elapsed_seconds / 60))


def _focus_streaks(sessions: list[FocusSession], today: date) -> tuple[int, int]:
    productive_dates = {
        session.started_at.date()
        for session in sessions
        if session.status == "completed"
        and session.mode == "focus"
        and session.elapsed_seconds >= 60
    }

    if not productive_dates:
        return 0, 0

    ordered = sorted(productive_dates)
    best = 1
    running = 1
    for previous, current in zip(ordered, ordered[1:]):
        if current == previous + timedelta(days=1):
            running += 1
            best = max(best, running)
        else:
            running = 1

    current = 0
    cursor = today
    if cursor not in productive_dates:
        cursor -= timedelta(days=1)
    while cursor in productive_dates:
        current += 1
        cursor -= timedelta(days=1)
    return current, best



_DURATION_BUCKETS = (
    (15, "Quick sprint"),
    (25, "Classic focus"),
    (40, "Sustained focus"),
    (50, "Deep work"),
)


def _nearest_duration(minutes: int) -> tuple[int, str]:
    return min(_DURATION_BUCKETS, key=lambda item: abs(item[0] - minutes))


def _adaptive_focus_recommendation(sessions: list[FocusSession]) -> dict:
    closed = [
        item
        for item in sessions
        if item.mode == "focus" and item.status in ["completed", "cancelled"]
    ]
    grouped: dict[int, list[FocusSession]] = {minutes: [] for minutes, _ in _DURATION_BUCKETS}
    for session in closed:
        minutes, _ = _nearest_duration(session.planned_minutes)
        grouped[minutes].append(session)

    profiles = []
    for minutes, label in _DURATION_BUCKETS:
        bucket = grouped[minutes]
        completed = [item for item in bucket if item.status == "completed"]
        completion_rate = (len(completed) / len(bucket) * 100) if bucket else 0
        average_progress = (
            sum(
                min(1, item.elapsed_seconds / max(60, item.planned_minutes * 60))
                for item in bucket
            )
            / len(bucket)
            * 100
            if bucket
            else 0
        )
        performance_score = completion_rate * 0.7 + average_progress * 0.3
        profiles.append(
            {
                "minutes": minutes,
                "label": label,
                "sessions": len(bucket),
                "completed_sessions": len(completed),
                "completion_rate": round(completion_rate, 1),
                "average_progress": round(average_progress, 1),
                "performance_score": round(performance_score, 1),
            }
        )

    sample_size = len(closed)
    eligible = [item for item in profiles if item["sessions"] >= 2]
    best = max(eligible, key=lambda item: (item["performance_score"], item["sessions"])) if eligible else None

    if sample_size < 3 or best is None:
        recommended = 25
        confidence = "learning"
        message = (
            "Complete at least three focus sessions so FlowMind can compare which duration works best for you."
        )
    else:
        recommended = best["minutes"]
        confidence = "strong" if sample_size >= 10 and best["sessions"] >= 4 else "emerging"
        message = (
            f"Your {recommended}-minute sessions currently perform best, with "
            f"{best['completion_rate']:.0f}% completion across {best['sessions']} comparable sessions."
        )

    return {
        "recommended_minutes": recommended,
        "confidence": confidence,
        "sample_size": sample_size,
        "message": message,
        "profiles": profiles,
    }


def get_workspace(db: Session, user: User) -> dict:
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=6)
    date_from, _ = _utc_day_bounds(week_start)
    _, date_to = _utc_day_bounds(today)

    weekly_sessions = list_sessions(
        db,
        user.id,
        date_from=date_from,
        date_to=date_to,
    )
    recent_sessions = list_sessions(db, user.id, limit=12)
    active = get_active_session(db, user.id)

    completed_focus = [
        item
        for item in weekly_sessions
        if item.status == "completed" and item.mode == "focus"
    ]
    finished_focus = [
        item
        for item in weekly_sessions
        if item.mode == "focus" and item.status in ["completed", "cancelled"]
    ]

    today_completed = [item for item in completed_focus if item.started_at.date() == today]
    daily_points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        matching = [item for item in completed_focus if item.started_at.date() == target]
        daily_points.append(
            {
                "date": target,
                "minutes": sum(_completed_minutes(item) for item in matching),
                "sessions": len(matching),
            }
        )

    all_sessions = list_sessions(db, user.id)
    current_streak, best_streak = _focus_streaks(all_sessions, today)

    profile = getattr(user, "profile", None)
    daily_goal = getattr(profile, "daily_focus_goal_minutes", 120) if profile else 120

    return {
        "active_session": active,
        "recent_sessions": recent_sessions,
        "today_minutes": sum(_completed_minutes(item) for item in today_completed),
        "today_sessions": len(today_completed),
        "weekly_minutes": sum(_completed_minutes(item) for item in completed_focus),
        "weekly_sessions": len(completed_focus),
        "completion_rate": round(
            (len(completed_focus) / len(finished_focus) * 100) if finished_focus else 0,
            1,
        ),
        "current_streak": current_streak,
        "best_streak": best_streak,
        "daily_goal_minutes": daily_goal,
        "daily_points": daily_points,
        "adaptive_recommendation": _adaptive_focus_recommendation(all_sessions),
    }


def start_session(db: Session, user: User, data: FocusSessionCreate) -> FocusSession:
    if get_active_session(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Finish or cancel the current focus session first",
        )

    if data.task_id is not None and not get_task(db, user.id, data.task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    session = FocusSession(user_id=user.id, **data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def pause_session(
    db: Session, user: User, session_id: int, data: FocusSessionAction
) -> FocusSession:
    session = _require_open_session(db, user, session_id)
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Only active sessions can be paused")
    session.status = "paused"
    session.paused_at = datetime.now(timezone.utc)
    session.elapsed_seconds = data.elapsed_seconds
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def resume_session(db: Session, user: User, session_id: int) -> FocusSession:
    session = _require_open_session(db, user, session_id)
    if session.status != "paused":
        raise HTTPException(status_code=400, detail="Only paused sessions can be resumed")
    session.status = "active"
    session.paused_at = None
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def complete_session(
    db: Session, user: User, session_id: int, data: FocusSessionAction
) -> FocusSession:
    session = _require_open_session(db, user, session_id)
    session.status = "completed"
    session.elapsed_seconds = data.elapsed_seconds
    session.note = data.note
    session.completed_at = datetime.now(timezone.utc)
    session.paused_at = None
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def cancel_session(
    db: Session, user: User, session_id: int, data: FocusSessionAction
) -> FocusSession:
    session = _require_open_session(db, user, session_id)
    session.status = "cancelled"
    session.elapsed_seconds = data.elapsed_seconds
    session.note = data.note
    session.completed_at = datetime.now(timezone.utc)
    session.paused_at = None
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def delete_session(db: Session, user: User, session_id: int) -> None:
    session = get_session(db, user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")
    if session.status in ["active", "paused"]:
        raise HTTPException(status_code=400, detail="Cancel the active session before deleting it")
    db.delete(session)
    db.commit()


def _require_open_session(db: Session, user: User, session_id: int) -> FocusSession:
    session = get_session(db, user.id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found")
    if session.status not in ["active", "paused"]:
        raise HTTPException(status_code=400, detail="This focus session is already closed")
    return session
