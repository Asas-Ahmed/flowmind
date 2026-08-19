from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def task_payload(**overrides):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    data = {
        "title": "Prepare DP demonstration",
        "description": "Finish the FlowMind test evidence",
        "status": "not_started",
        "eisenhower": "urgent_important",
        "energy_level": "medium",
        "start_at": now.isoformat(),
        "due_at": (now + timedelta(days=2)).isoformat(),
        "is_all_day": False,
        "repeat_rule": "none",
        "repeat_interval": 1,
        "reminder_enabled": False,
        "tags": ["dp", "testing"],
        "subtasks": [{"id": "s1", "title": "Write tests", "completed": False}],
    }
    data.update(overrides)
    return data


def habit_payload(**overrides):
    data = {
        "name": "Read research paper",
        "description": "Daily literature review habit",
        "category": "study",
        "color": "#4a6ded",
        "icon": "book",
        "frequency": "daily",
        "scheduled_days": [],
        "target_count": 1,
        "unit": "times",
        "reminder_enabled": False,
        "start_date": date.today().isoformat(),
        "is_archived": False,
    }
    data.update(overrides)
    return data


def focus_payload(**overrides):
    data = {
        "title": "DP deep work",
        "mode": "focus",
        "planned_minutes": 25,
    }
    data.update(overrides)
    return data


def schedule_payload(**overrides):
    now = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=2)
    data = {
        "title": "FlowMind planning block",
        "description": "Automated test event",
        "event_type": "event",
        "color": "#4a6ded",
        "start_at": now.isoformat(),
        "end_at": (now + timedelta(hours=1)).isoformat(),
        "is_all_day": False,
        "reminder_enabled": True,
        "reminder_minutes_before": 15,
    }
    data.update(overrides)
    return data
