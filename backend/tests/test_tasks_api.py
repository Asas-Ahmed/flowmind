from datetime import datetime, timedelta, timezone

import pytest

from tests.factories import task_payload

pytestmark = pytest.mark.api


def test_tasks_require_authentication(client):
    assert client.get("/api/tasks").status_code == 401


def test_create_and_read_task(client, auth_headers):
    created = client.post("/api/tasks", json=task_payload(), headers=auth_headers)
    assert created.status_code == 201
    task = created.json()
    assert task["title"] == "Prepare DP demonstration"
    assert task["tags"] == ["dp", "testing"]

    listed = client.get("/api/tasks", headers=auth_headers)
    assert listed.status_code == 200
    assert any(item["id"] == task["id"] for item in listed.json())


def test_update_task_status_to_completed(client, auth_headers):
    task_id = client.post("/api/tasks", json=task_payload(), headers=auth_headers).json()["id"]
    response = client.put(
        f"/api/tasks/{task_id}",
        json={"status": "completed"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["completed_at"] is not None


def test_delete_task(client, auth_headers):
    task_id = client.post("/api/tasks", json=task_payload(), headers=auth_headers).json()["id"]
    response = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204
    listed = client.get("/api/tasks", headers=auth_headers).json()
    assert all(item["id"] != task_id for item in listed)


def test_user_cannot_modify_another_users_task(client, auth_headers, other_auth_headers):
    task_id = client.post("/api/tasks", json=task_payload(), headers=auth_headers).json()["id"]
    response = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Hijacked"},
        headers=other_auth_headers,
    )
    assert response.status_code == 404


def test_create_and_delete_custom_list(client, auth_headers):
    response = client.post(
        "/api/tasks/lists",
        json={"name": "DP", "color": "#4a6ded", "icon": "folder"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    list_id = response.json()["id"]
    assert client.delete(f"/api/tasks/lists/{list_id}", headers=auth_headers).status_code == 204


def test_create_and_delete_category(client, auth_headers):
    response = client.post(
        "/api/tasks/categories",
        json={"name": "Testing", "color": "#762bbc"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    category_id = response.json()["id"]
    assert client.delete(f"/api/tasks/categories/{category_id}", headers=auth_headers).status_code == 204


def test_invalid_task_date_range_returns_422(client, auth_headers):
    now = datetime.now(timezone.utc)
    response = client.post(
        "/api/tasks",
        json=task_payload(
            start_at=now.isoformat(),
            due_at=(now - timedelta(hours=1)).isoformat(),
        ),
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_recurring_task_creates_next_occurrence_when_completed(client, auth_headers):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    payload = task_payload(
        title="Daily review",
        due_at=(now + timedelta(days=1)).isoformat(),
        repeat_rule="daily",
        repeat_interval=1,
        repeat_until=(now + timedelta(days=5)).isoformat(),
    )
    task_id = client.post("/api/tasks", json=payload, headers=auth_headers).json()["id"]
    completed = client.put(f"/api/tasks/{task_id}", json={"status": "completed"}, headers=auth_headers)
    assert completed.status_code == 200
    tasks = client.get("/api/tasks", headers=auth_headers).json()
    assert len([item for item in tasks if item["title"] == "Daily review"]) == 2
