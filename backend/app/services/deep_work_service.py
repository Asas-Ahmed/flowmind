from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.distraction_log import DistractionLog
from app.models.focus_session import FocusSession
from app.models.user import User
from app.repositories.distraction_repo import list_distractions_since
from app.repositories.focus_repo import list_sessions


def _day_start(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def _minutes(session: FocusSession) -> int:
    return max(0, round(session.elapsed_seconds / 60))


def _is_deep_session(session: FocusSession) -> bool:
    return session.mode == "focus" and session.status == "completed" and session.elapsed_seconds >= 15 * 60


def _change(current: int, previous: int) -> float | None:
    if previous <= 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


def _window_label(hour: int | None) -> str | None:
    if hour is None:
        return None
    end = (hour + 2) % 24
    def label(value: int) -> str:
        suffix = "AM" if value < 12 else "PM"
        display = value % 12 or 12
        return f"{display} {suffix}"
    return f"{label(hour)}–{label(end)}"


def _score(
    weekly_minutes: int,
    average_minutes: int,
    uninterrupted_rate: float,
    completed_sessions: int,
) -> int:
    volume = min(40, round((weekly_minutes / 600) * 40))
    depth = min(25, round((average_minutes / 60) * 25))
    continuity = round((uninterrupted_rate / 100) * 25)
    consistency = min(10, completed_sessions * 2)
    return max(0, min(100, volume + depth + continuity + consistency))


def _score_label(score: int) -> str:
    if score >= 80:
        return "Exceptional deep-work rhythm"
    if score >= 65:
        return "Strong deep-work foundation"
    if score >= 45:
        return "Developing focused momentum"
    if score > 0:
        return "Deep work is taking shape"
    return "Start building your deep-work baseline"


def _band(sessions: list[FocusSession], minimum: int, maximum: int | None, label: str, range_label: str):
    selected = [
        session for session in sessions
        if _minutes(session) >= minimum and (maximum is None or _minutes(session) < maximum)
    ]
    completed = [session for session in selected if session.status == "completed"]
    return {
        "label": label,
        "range_label": range_label,
        "sessions": len(selected),
        "total_minutes": sum(_minutes(session) for session in completed if session.mode == "focus"),
        "completion_rate": round((len(completed) / len(selected)) * 100, 1) if selected else 0.0,
    }


def _build_insight(
    weekly_minutes: int,
    average_minutes: int,
    interruptions: int,
    best_window: str | None,
):
    if weekly_minutes == 0:
        return {
            "title": "Create your first deep-work signal",
            "message": "Complete a focus session of at least 15 minutes. FlowMind will then compare duration, consistency, and interruptions without using a black-box score.",
            "action_label": "Start a focus session",
            "action_href": "/focus",
            "tone": "neutral",
        }
    if interruptions >= 5:
        return {
            "title": "Protect the start of each session",
            "message": f"You logged {interruptions} focus-related interruptions this week. Prepare your workspace before starting and use the distraction log to measure whether the change helps.",
            "action_label": "Review distractions",
            "action_href": "/distractions",
            "tone": "attention",
        }
    if average_minutes >= 45:
        return {
            "title": "Your sessions are reaching useful depth",
            "message": f"Your completed deep-work sessions average {average_minutes} minutes. {('Your strongest window is ' + best_window + '.') if best_window else 'Keep using the same preparation routine to protect this pattern.'}",
            "action_label": "Open focus workspace",
            "action_href": "/focus",
            "tone": "positive",
        }
    return {
        "title": "Extend depth gradually",
        "message": f"Your average deep-work session is {average_minutes} minutes. Add five focused minutes to one session at a time rather than forcing a large jump.",
        "action_label": "Use adaptive focus",
        "action_href": "/focus",
        "tone": "neutral",
    }


def get_deep_work_workspace(db: Session, user: User):
    today = datetime.now(timezone.utc).date()
    current_start = today - timedelta(days=6)
    previous_start = current_start - timedelta(days=7)
    chart_start = today - timedelta(days=13)

    sessions = list_sessions(db, user.id, date_from=_day_start(chart_start))
    distractions = list_distractions_since(db, user.id, _day_start(chart_start))

    focus_sessions = [session for session in sessions if session.mode == "focus"]
    completed = [session for session in focus_sessions if _is_deep_session(session)]
    current = [session for session in completed if session.started_at.date() >= current_start]
    previous = [
        session for session in completed
        if previous_start <= session.started_at.date() < current_start
    ]
    current_distractions = [
        item for item in distractions
        if item.occurred_at.date() >= current_start and item.context == "focus"
    ]

    weekly_minutes = sum(_minutes(session) for session in current)
    previous_week_minutes = sum(_minutes(session) for session in previous)
    average_minutes = round(weekly_minutes / len(current)) if current else 0
    longest_minutes = max((_minutes(session) for session in current), default=0)
    interruption_minutes = sum(item.minutes_lost for item in current_distractions)
    interruptions = len(current_distractions)
    average_recovery = round(interruption_minutes / interruptions) if interruptions else 0
    uninterrupted_rate = round(
        (max(0, len(current) - interruptions) / len(current)) * 100,
        1,
    ) if current else 0.0

    hour_minutes: Counter[int] = Counter()
    for session in current:
        hour_minutes[session.started_at.hour] += _minutes(session)
    best_hour = hour_minutes.most_common(1)[0][0] if hour_minutes else None
    best_window = _window_label(best_hour)

    total_score = _score(weekly_minutes, average_minutes, uninterrupted_rate, len(current))

    minutes_by_day: dict[date, int] = defaultdict(int)
    sessions_by_day: Counter[date] = Counter()
    interruptions_by_day: Counter[date] = Counter()
    for session in completed:
        day = session.started_at.date()
        minutes_by_day[day] += _minutes(session)
        sessions_by_day[day] += 1
    for item in distractions:
        if item.context == "focus":
            interruptions_by_day[item.occurred_at.date()] += 1

    daily_points = []
    for index in range(14):
        day = chart_start + timedelta(days=index)
        minutes = minutes_by_day[day]
        interruption_count = interruptions_by_day[day]
        day_score = min(100, max(0, round(min(minutes / 90, 1) * 80 + (20 if minutes and interruption_count == 0 else 0) - interruption_count * 8)))
        daily_points.append({
            "date": day,
            "label": day.strftime("%a"),
            "minutes": minutes,
            "sessions": sessions_by_day[day],
            "interruptions": interruption_count,
            "score": day_score,
        })

    return {
        "score": total_score,
        "score_label": _score_label(total_score),
        "weekly_minutes": weekly_minutes,
        "previous_week_minutes": previous_week_minutes,
        "weekly_change": _change(weekly_minutes, previous_week_minutes),
        "completed_sessions": len(current),
        "average_session_minutes": average_minutes,
        "longest_session_minutes": longest_minutes,
        "interruptions": interruptions,
        "interruption_minutes": interruption_minutes,
        "average_recovery_minutes": average_recovery,
        "uninterrupted_rate": uninterrupted_rate,
        "best_focus_hour": best_hour,
        "best_focus_window": best_window,
        "daily_points": daily_points,
        "session_bands": [
            _band(focus_sessions, 0, 25, "Quick focus", "Under 25 min"),
            _band(focus_sessions, 25, 45, "Focused block", "25–44 min"),
            _band(focus_sessions, 45, 75, "Deep work", "45–74 min"),
            _band(focus_sessions, 75, None, "Extended depth", "75+ min"),
        ],
        "insight": _build_insight(weekly_minutes, average_minutes, interruptions, best_window),
    }
