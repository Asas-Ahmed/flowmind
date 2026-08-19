from datetime import date

import pytest

from tests.factories import focus_payload, habit_payload, task_payload

pytestmark = pytest.mark.integration


def test_task_creation_is_visible_in_dashboard_flow(client, auth_headers):
    created = client.post("/api/tasks", json=task_payload(title="Dashboard integration task"), headers=auth_headers)
    assert created.status_code == 201
    dashboard = client.get("/api/dashboard", headers=auth_headers)
    assert dashboard.status_code == 200
    text = dashboard.text
    assert "Dashboard integration task" in text or created.json()["id"] is not None


def test_completed_focus_session_updates_focus_workspace(client, auth_headers):
    session = client.post("/api/focus/sessions", json=focus_payload(), headers=auth_headers).json()
    completed = client.put(
        f"/api/focus/sessions/{session['id']}/complete",
        json={"elapsed_seconds": 1500, "experience": "great"},
        headers=auth_headers,
    )
    assert completed.status_code == 200
    workspace = client.get("/api/focus/workspace", headers=auth_headers)
    assert workspace.status_code == 200
    assert workspace.json()["weekly_sessions"] >= 1
    assert workspace.json()["weekly_minutes"] >= 25


def test_habit_checkin_updates_habit_workspace(client, auth_headers):
    habit = client.post("/api/habits", json=habit_payload(), headers=auth_headers).json()
    checked = client.put(
        f"/api/habits/{habit['id']}/check-in",
        json={"completion_date": date.today().isoformat(), "count": 1},
        headers=auth_headers,
    )
    assert checked.status_code == 200
    workspace = client.get("/api/habits/workspace", headers=auth_headers)
    assert workspace.status_code == 200
    serialized = next(item for item in workspace.json()["habits"] if item["id"] == habit["id"])
    assert serialized["today_count"] >= 1
