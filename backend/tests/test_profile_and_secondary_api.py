from datetime import date, datetime, timedelta, timezone

import pytest

pytestmark = pytest.mark.api


def test_profile_get_and_update(client, auth_headers, user):
    response = client.get("/api/profile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == user.email

    updated = client.put(
        "/api/profile",
        json={
            "full_name": "Updated FlowMind User",
            "timezone": "Asia/Colombo",
            "daily_focus_goal_minutes": 90,
            "week_starts_on": "monday",
            "email_notifications": False,
            "task_reminders": True,
            "habit_reminders": False,
            "weekly_summary": True,
            "compact_dashboard": True,
        },
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["profile"]["daily_focus_goal_minutes"] == 90


@pytest.mark.parametrize(
    "path",
    [
        "/api/dashboard",
        "/api/productivity",
        "/api/habits/workspace",
        "/api/focus/workspace",
        "/api/schedule/workspace",
        "/api/energy/workspace",
        "/api/sleep/workspace",
        "/api/cognitive-load/workspace",
        "/api/distractions/workspace",
        "/api/if-then/workspace",
        "/api/experiments/workspace",
        "/api/burnout/workspace",
        "/api/nourishment/workspace",
        "/api/recovery/workspace",
        "/api/time-tracking/workspace",
        "/api/activity/timeline",
        "/api/weekly-review/workspace",
        "/api/weekly-coach/workspace",
        "/api/deep-work/workspace",
        "/api/productivity-heatmap/workspace",
        "/api/goals/workspace",
        "/api/personal-patterns/workspace",
        "/api/recommendations/workspace",
        "/api/life-balance/workspace",
        "/api/habit-breaker/workspace",
    ],
)
def test_protected_workspaces_reject_anonymous_users(client, path):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize(
    "path",
    [
        "/api/dashboard",
        "/api/productivity",
        "/api/habits/workspace",
        "/api/focus/workspace",
        "/api/schedule/workspace",
        "/api/energy/workspace",
        "/api/sleep/workspace",
        "/api/cognitive-load/workspace",
        "/api/distractions/workspace",
        "/api/if-then/workspace",
        "/api/experiments/workspace",
        "/api/burnout/workspace",
        "/api/nourishment/workspace",
        "/api/recovery/workspace",
        "/api/time-tracking/workspace",
        "/api/activity/timeline",
        "/api/weekly-review/workspace",
        "/api/weekly-coach/workspace",
        "/api/deep-work/workspace",
        "/api/productivity-heatmap/workspace",
        "/api/goals/workspace",
        "/api/personal-patterns/workspace",
        "/api/recommendations/workspace",
        "/api/life-balance/workspace",
        "/api/habit-breaker/workspace",
    ],
)
def test_empty_workspaces_return_success_for_authenticated_user(client, auth_headers, path):
    response = client.get(path, headers=auth_headers)
    assert response.status_code == 200, response.text


def test_energy_crud(client, auth_headers):
    created = client.post(
        "/api/energy/checkins",
        json={"energy_level": 2, "stress_level": 2, "focus_level": 3, "note": "Stable"},
        headers=auth_headers,
    )
    assert created.status_code == 201
    checkin_id = created.json()["id"]
    assert client.delete(f"/api/energy/checkins/{checkin_id}", headers=auth_headers).status_code == 204


def test_sleep_crud(client, auth_headers):
    created = client.post(
        "/api/sleep/records",
        json={
            "sleep_date": date.today().isoformat(),
            "bedtime": "23:00:00",
            "wake_time": "07:00:00",
            "quality": 4,
            "note": "Rested",
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    record_id = created.json()["id"]
    assert client.delete(f"/api/sleep/records/{record_id}", headers=auth_headers).status_code == 204


def test_cognitive_load_crud(client, auth_headers):
    created = client.post(
        "/api/cognitive-load/entries",
        json={
            "entry_date": date.today().isoformat(),
            "title": "Thesis writing",
            "difficulty": "deep",
            "estimated_minutes": 90,
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    entry_id = created.json()["id"]
    assert client.delete(f"/api/cognitive-load/entries/{entry_id}", headers=auth_headers).status_code == 204


def test_distraction_crud(client, auth_headers):
    created = client.post(
        "/api/distractions",
        json={"distraction_type": "phone", "context": "focus", "intensity": 2, "minutes_lost": 5},
        headers=auth_headers,
    )
    assert created.status_code == 201
    log_id = created.json()["id"]
    assert client.delete(f"/api/distractions/{log_id}", headers=auth_headers).status_code == 204
