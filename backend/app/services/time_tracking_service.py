from collections import Counter, defaultdict
from datetime import datetime, time, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.time_tracking import TimeEntry, TimeTrackingProject, WorkCategory
from app.models.user import User
from app.repositories.time_tracking_repo import (
    get_active_entry,
    get_category,
    get_entry,
    get_project,
    list_entries,
    list_entries_since,
    list_categories,
    list_projects,
)
from app.schemas.time_tracking_schema import (
    ManualTimeEntryCreate,
    WorkCategoryCreate,
    WorkCategoryUpdate,
    TimeEntryUpdate,
    TimeProjectCreate,
    TimeProjectUpdate,
    TimerStartRequest,
)


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _clean_tags(tags: list[str]) -> list[str]:
    cleaned: list[str] = []
    for tag in tags:
        value = tag.strip().lower().replace(" ", "-")[:30]
        if value and value not in cleaned:
            cleaned.append(value)
    return cleaned[:12]


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _require_project(db: Session, user: User, project_id: int | None) -> TimeTrackingProject | None:
    if project_id is None:
        return None
    project = get_project(db, user.id, project_id)
    if project is None or project.is_archived:
        raise HTTPException(status_code=404, detail="Time-tracking project not found")
    return project


def _require_category(db: Session, user: User, category_id: int | None) -> WorkCategory | None:
    if category_id is None:
        return None
    category = get_category(db, user.id, category_id)
    if category is None or category.is_archived:
        raise HTTPException(status_code=404, detail="Work category not found")
    return category


def create_category(db: Session, user: User, data: WorkCategoryCreate) -> WorkCategory:
    name = data.name.strip()
    duplicate = next((c for c in list_categories(db, user.id) if c.name.lower() == name.lower()), None)
    if duplicate:
        raise HTTPException(status_code=409, detail="A work category with this name already exists")
    category = WorkCategory(
        user_id=user.id,
        name=name,
        color=data.color,
        icon=data.icon,
        weekly_target_minutes=data.weekly_target_minutes,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, user: User, category_id: int, data: WorkCategoryUpdate) -> WorkCategory:
    category = get_category(db, user.id, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Work category not found")
    values = data.model_dump(exclude_unset=True)
    if "name" in values:
        name = values["name"].strip()
        duplicate = next((c for c in list_categories(db, user.id) if c.id != category.id and c.name.lower() == name.lower()), None)
        if duplicate:
            raise HTTPException(status_code=409, detail="A work category with this name already exists")
        category.name = name
    for field in ("color", "icon", "weekly_target_minutes", "is_archived"):
        if field in values:
            setattr(category, field, values[field])
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, user: User, category_id: int) -> None:
    category = get_category(db, user.id, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Work category not found")

    db.execute(
        update(TimeTrackingProject)
        .where(
            TimeTrackingProject.user_id == user.id,
            TimeTrackingProject.category_id == category.id,
        )
        .values(category_id=None)
    )
    db.delete(category)
    db.commit()


def create_project(db: Session, user: User, data: TimeProjectCreate) -> TimeTrackingProject:
    name = data.name.strip()
    duplicate = next((p for p in list_projects(db, user.id) if p.name.lower() == name.lower()), None)
    if duplicate:
        raise HTTPException(status_code=409, detail="A project with this name already exists")
    _require_category(db, user, data.category_id)
    project = TimeTrackingProject(user_id=user.id, name=name, color=data.color, category_id=data.category_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, user: User, project_id: int, data: TimeProjectUpdate) -> TimeTrackingProject:
    project = get_project(db, user.id, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Time-tracking project not found")
    if "category_id" in data.model_fields_set:
        _require_category(db, user, data.category_id)
        project.category_id = data.category_id
    if data.name is not None:
        project.name = data.name.strip()
    if data.color is not None:
        project.color = data.color
    if data.is_archived is not None:
        project.is_archived = data.is_archived
    db.commit()
    db.refresh(project)
    return project


def start_timer(db: Session, user: User, data: TimerStartRequest) -> TimeEntry:
    if get_active_entry(db, user.id):
        raise HTTPException(status_code=409, detail="Stop the current timer before starting another")
    _require_project(db, user, data.project_id)
    entry = TimeEntry(
        user_id=user.id,
        project_id=data.project_id,
        description=data.description.strip(),
        tags=_clean_tags(data.tags),
        is_billable=data.is_billable,
        started_at=datetime.now(timezone.utc),
        ended_at=None,
        duration_seconds=0,
        source="timer",
        note=_clean_optional(data.note),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def stop_timer(db: Session, user: User) -> TimeEntry:
    entry = get_active_entry(db, user.id)
    if entry is None:
        raise HTTPException(status_code=404, detail="No active timer found")
    ended_at = datetime.now(timezone.utc)
    entry.ended_at = ended_at
    entry.duration_seconds = max(1, int((ended_at - _utc(entry.started_at)).total_seconds()))
    db.commit()
    db.refresh(entry)
    return entry


def create_manual_entry(db: Session, user: User, data: ManualTimeEntryCreate) -> TimeEntry:
    _require_project(db, user, data.project_id)
    started_at, ended_at = _utc(data.started_at), _utc(data.ended_at)
    entry = TimeEntry(
        user_id=user.id,
        project_id=data.project_id,
        description=data.description.strip(),
        tags=_clean_tags(data.tags),
        is_billable=data.is_billable,
        started_at=started_at,
        ended_at=ended_at,
        duration_seconds=int((ended_at - started_at).total_seconds()),
        source="manual",
        note=_clean_optional(data.note),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(db: Session, user: User, entry_id: int, data: TimeEntryUpdate) -> TimeEntry:
    entry = get_entry(db, user.id, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Time entry not found")
    if entry.ended_at is None:
        raise HTTPException(status_code=409, detail="Stop the active timer before editing it")
    values = data.model_dump(exclude_unset=True)
    if "project_id" in values:
        _require_project(db, user, values["project_id"])
    if "description" in values:
        entry.description = values["description"].strip()
    if "project_id" in values:
        entry.project_id = values["project_id"]
    if "tags" in values:
        entry.tags = _clean_tags(values["tags"] or [])
    if "is_billable" in values:
        entry.is_billable = values["is_billable"]
    if "note" in values:
        entry.note = _clean_optional(values["note"])
    started_at = _utc(values.get("started_at", entry.started_at))
    ended_at = _utc(values.get("ended_at", entry.ended_at))
    if ended_at <= started_at:
        raise HTTPException(status_code=422, detail="End time must be after start time")
    if (ended_at - started_at).total_seconds() > 86400:
        raise HTTPException(status_code=422, detail="A single entry cannot exceed 24 hours")
    entry.started_at = started_at
    entry.ended_at = ended_at
    entry.duration_seconds = int((ended_at - started_at).total_seconds())
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, user: User, entry_id: int) -> None:
    entry = get_entry(db, user.id, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Time entry not found")
    db.delete(entry)
    db.commit()


def _entry_seconds(entry: TimeEntry, now: datetime) -> int:
    if entry.ended_at is None:
        return max(0, int((now - _utc(entry.started_at)).total_seconds()))
    return entry.duration_seconds


def _serialize_project(project: TimeTrackingProject, categories: dict[int, WorkCategory]) -> dict:
    return {
        "id": project.id,
        "user_id": project.user_id,
        "category_id": project.category_id,
        "name": project.name,
        "color": project.color,
        "is_archived": project.is_archived,
        "created_at": project.created_at,
        "category": categories.get(project.category_id) if project.category_id else None,
    }


def _serialize_entry(entry: TimeEntry, projects: dict[int, TimeTrackingProject], categories: dict[int, WorkCategory]) -> dict:
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "project_id": entry.project_id,
        "description": entry.description,
        "tags": entry.tags or [],
        "is_billable": entry.is_billable,
        "started_at": entry.started_at,
        "ended_at": entry.ended_at,
        "duration_seconds": entry.duration_seconds,
        "source": entry.source,
        "note": entry.note,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
        "project": _serialize_project(projects[entry.project_id], categories) if entry.project_id in projects else None,
    }


def get_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=today_start.weekday())
    categories = list_categories(db, user.id)
    category_map = {category.id: category for category in categories}
    projects = list_projects(db, user.id)
    project_map = {project.id: project for project in projects}
    entries = list_entries(db, user.id)
    weekly_entries = list_entries_since(db, user.id, week_start)
    active = get_active_entry(db, user.id)

    today_seconds = sum(_entry_seconds(e, now) for e in entries if _utc(e.started_at) >= today_start)
    week_seconds = sum(_entry_seconds(e, now) for e in weekly_entries)
    billable_seconds = sum(_entry_seconds(e, now) for e in weekly_entries if e.is_billable)

    category_seconds: dict[str, int] = defaultdict(int)
    category_colors: dict[str, str | None] = {}
    category_ids: dict[str, int | None] = {}
    category_targets: dict[str, int | None] = {}
    project_seconds: dict[str, int] = defaultdict(int)
    project_colors: dict[str, str | None] = {}
    tag_seconds: Counter[str] = Counter()
    daily: dict[str, int] = {}
    for offset in range(7):
        date = (week_start + timedelta(days=offset)).date().isoformat()
        daily[date] = 0

    for entry in weekly_entries:
        seconds = _entry_seconds(entry, now)
        project = project_map.get(entry.project_id) if entry.project_id else None
        category = category_map.get(project.category_id) if project and project.category_id else None
        category_label = category.name if category else "Uncategorized"
        category_seconds[category_label] += seconds
        category_colors[category_label] = category.color if category else "#94a3b8"
        category_ids[category_label] = category.id if category else None
        category_targets[category_label] = category.weekly_target_minutes * 60 if category and category.weekly_target_minutes else None
        label = project.name if project else "Unassigned"
        project_seconds[label] += seconds
        project_colors[label] = project.color if project else "#94a3b8"
        for tag in entry.tags or []:
            tag_seconds[tag] += seconds
        key = _utc(entry.started_at).date().isoformat()
        if key in daily:
            daily[key] += seconds

    def breakdown(source: dict[str, int], colors: dict[str, str | None] | None = None, ids: dict[str, int | None] | None = None, targets: dict[str, int | None] | None = None) -> list[dict]:
        total = sum(source.values())
        return [
            {
                "label": label,
                "seconds": seconds,
                "percentage": round(seconds / total * 100, 1) if total else 0.0,
                "color": colors.get(label) if colors else None,
                "category_id": ids.get(label) if ids else None,
                "target_seconds": targets.get(label) if targets else None,
            }
            for label, seconds in sorted(source.items(), key=lambda item: item[1], reverse=True)
        ]

    top_project = max(project_seconds, key=project_seconds.get) if project_seconds else None
    longest = max((_entry_seconds(e, now) for e in weekly_entries), default=0)
    active_days = sum(1 for seconds in daily.values() if seconds > 0)

    if not entries:
        insight = {
            "title": "Build an honest picture of your time",
            "message": "Start a timer whenever you begin meaningful work, study, planning, exercise, or recovery.",
            "recommendation": "Track your next three activities without changing your behaviour first.",
            "tone": "neutral",
        }
    elif longest >= 3 * 3600:
        insight = {
            "title": "Very long work blocks detected",
            "message": "At least one tracked activity exceeded three hours this week.",
            "recommendation": "Split long blocks into clearer activities and add recovery breaks so recommendations can identify sustainable patterns.",
            "tone": "attention",
        }
    elif active_days >= 5:
        insight = {
            "title": "Your tracking consistency is strong",
            "message": f"You recorded meaningful activity on {active_days} days this week.",
            "recommendation": f"Review whether {top_project or 'your leading project'} deserves its current share of your time.",
            "tone": "positive",
        }
    else:
        insight = {
            "title": "Your time pattern is taking shape",
            "message": f"{top_project or 'Unassigned work'} currently receives the largest share of tracked time.",
            "recommendation": "Use projects and tags consistently so FlowMind can compare time investment with outcomes and wellbeing signals.",
            "tone": "neutral",
        }

    return {
        "active_entry": _serialize_entry(active, project_map, category_map) if active else None,
        "today_seconds": today_seconds,
        "week_seconds": week_seconds,
        "billable_week_seconds": billable_seconds,
        "average_daily_seconds": round(week_seconds / max(1, active_days)),
        "entries_this_week": len(weekly_entries),
        "projects": [_serialize_project(project, category_map) for project in projects],
        "categories": categories,
        "category_breakdown": breakdown(category_seconds, category_colors, category_ids, category_targets),
        "project_breakdown": breakdown(project_seconds, project_colors),
        "tag_breakdown": breakdown(dict(tag_seconds)),
        "daily_totals": [{"date": date, "seconds": seconds} for date, seconds in daily.items()],
        "insight": insight,
        "entries": [_serialize_entry(entry, project_map, category_map) for entry in entries],
    }
