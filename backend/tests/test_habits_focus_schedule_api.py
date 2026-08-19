from datetime import date, datetime, timedelta, timezone

import pytest

from tests.factories import focus_payload, habit_payload, schedule_payload, task_payload

pytestmark = pytest.mark.api


def test_create_update_checkin_delete_habit(client, auth_headers):
    created = client.post("/api/habits", json=habit_payload(), headers=auth_headers)
    assert created.status_code == 201
    habit_id = created.json()["id"]

    updated = client.put(f"/api/habits/{habit_id}", json={"target_count": 2}, headers=auth_headers)
    assert updated.status_code == 200
    assert updated.json()["target_count"] == 2

    checkin = client.put(
        f"/api/habits/{habit_id}/check-in",
        json={"completion_date": date.today().isoformat(), "count": 2, "note": "Done"},
        headers=auth_headers,
    )
    assert checkin.status_code == 200
    assert checkin.json()["count"] == 2

    removed = client.delete(f"/api/habits/{habit_id}", headers=auth_headers)
    assert removed.status_code == 204


def test_habit_ownership_is_enforced(client, auth_headers, other_auth_headers):
    habit_id = client.post("/api/habits", json=habit_payload(), headers=auth_headers).json()["id"]
    response = client.put(f"/api/habits/{habit_id}", json={"name": "Other"}, headers=other_auth_headers)
    assert response.status_code == 404


def test_focus_session_lifecycle(client, auth_headers):
    created = client.post("/api/focus/sessions", json=focus_payload(), headers=auth_headers)
    assert created.status_code == 201
    session_id = created.json()["id"]

    paused = client.put(
        f"/api/focus/sessions/{session_id}/pause",
        json={"elapsed_seconds": 300},
        headers=auth_headers,
    )
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused"

    resumed = client.put(
        f"/api/focus/sessions/{session_id}/resume",
        json={"elapsed_seconds": 300},
        headers=auth_headers,
    )
    assert resumed.status_code == 200
    assert resumed.json()["status"] == "active"

    completed = client.put(
        f"/api/focus/sessions/{session_id}/complete",
        json={"elapsed_seconds": 1500, "note": "Good session", "experience": "great"},
        headers=auth_headers,
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"


def test_only_one_active_focus_session_allowed(client, auth_headers):
    assert client.post("/api/focus/sessions", json=focus_payload(), headers=auth_headers).status_code == 201
    response = client.post("/api/focus/sessions", json=focus_payload(title="Second"), headers=auth_headers)
    assert response.status_code == 409


def test_focus_session_rejects_foreign_task(client, auth_headers, other_auth_headers):
    task_id = client.post("/api/tasks", json=task_payload(), headers=auth_headers).json()["id"]
    response = client.post(
        "/api/focus/sessions",
        json=focus_payload(task_id=task_id),
        headers=other_auth_headers,
    )
    assert response.status_code == 404


def test_schedule_event_crud(client, auth_headers):
    created = client.post("/api/schedule/events", json=schedule_payload(), headers=auth_headers)
    assert created.status_code == 201
    event_id = created.json()["id"]

    updated = client.put(
        f"/api/schedule/events/{event_id}",
        json={"title": "Updated planning block"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated planning block"

    deleted = client.delete(f"/api/schedule/events/{event_id}", headers=auth_headers)
    assert deleted.status_code == 204


def test_schedule_ownership_is_enforced(client, auth_headers, other_auth_headers):
    event_id = client.post("/api/schedule/events", json=schedule_payload(), headers=auth_headers).json()["id"]
    response = client.delete(f"/api/schedule/events/{event_id}", headers=other_auth_headers)
    assert response.status_code == 404


def test_smart_schedule_request_is_accepted(client, auth_headers):
    today = date.today()
    response = client.post(
        "/api/schedule/smart-suggestions",
        json={
            "range_start": today.isoformat(),
            "range_end": (today + timedelta(days=3)).isoformat(),
            "workday_start_hour": 9,
            "workday_end_hour": 18,
            "slot_minutes": 30,
            "break_minutes": 15,
            "max_items": 8,
            "include_weekends": True,
            "timezone_offset_minutes": 330,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert "suggestions" in body
    assert "explanation" in body
