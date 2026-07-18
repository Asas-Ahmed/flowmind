from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.cognitive_load import CognitiveLoadEntry
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.sleep_record import SleepRecord
from app.models.task import Task
from app.models.user import User


def _clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return max(minimum, min(maximum, round(value)))


def _tone(score: int, max_score: int) -> str:
    ratio = score / max_score if max_score else 0
    if ratio >= 0.7:
        return "high"
    if ratio >= 0.4:
        return "attention"
    if ratio > 0:
        return "neutral"
    return "positive"


def get_burnout_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    soon = now + timedelta(days=3)

    overdue = db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == user.id,
            Task.status != "completed",
            Task.due_at.is_not(None),
            Task.due_at < now,
        )
    ) or 0
    due_soon = db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == user.id,
            Task.status != "completed",
            Task.due_at.is_not(None),
            Task.due_at >= now,
            Task.due_at <= soon,
        )
    ) or 0

    energy_rows = list(db.scalars(
        select(EnergyCheckIn)
        .where(EnergyCheckIn.user_id == user.id, EnergyCheckIn.checked_at >= now - timedelta(days=7))
        .order_by(EnergyCheckIn.checked_at.desc())
    ).all())
    sleep_rows = list(db.scalars(
        select(SleepRecord)
        .where(SleepRecord.user_id == user.id, SleepRecord.sleep_date >= week_start)
        .order_by(SleepRecord.sleep_date.desc())
    ).all())
    load_rows = list(db.scalars(
        select(CognitiveLoadEntry)
        .where(CognitiveLoadEntry.user_id == user.id, CognitiveLoadEntry.entry_date >= week_start)
    ).all())
    focus_rows = list(db.scalars(
        select(FocusSession)
        .where(
            FocusSession.user_id == user.id,
            FocusSession.status == "completed",
            FocusSession.completed_at >= now - timedelta(days=7),
        )
    ).all())

    task_score = min(25, overdue * 6 + due_soon * 2)
    avg_energy = sum(row.energy_level for row in energy_rows) / len(energy_rows) if energy_rows else None
    avg_stress = sum(row.stress_level for row in energy_rows) / len(energy_rows) if energy_rows else None
    wellbeing_score = 0
    if avg_energy is not None and avg_stress is not None:
        wellbeing_score = _clamp(((4 - avg_energy) + (avg_stress - 1)) / 4 * 20, 0, 20)

    avg_sleep = sum(row.duration_hours for row in sleep_rows) / len(sleep_rows) if sleep_rows else None
    avg_quality = sum(row.quality for row in sleep_rows) / len(sleep_rows) if sleep_rows else None
    sleep_score = 0
    if avg_sleep is not None and avg_quality is not None:
        duration_risk = max(0, 7 - avg_sleep) / 3
        quality_risk = max(0, 3 - avg_quality) / 2
        sleep_score = _clamp((duration_risk * 9) + (quality_risk * 6), 0, 15)

    weights = {"light": 1, "moderate": 2, "deep": 3}
    cognitive_points = sum(weights.get(row.difficulty, 2) for row in load_rows)
    cognitive_minutes = sum(row.estimated_minutes for row in load_rows)
    cognitive_score = _clamp(max(cognitive_points / 18, cognitive_minutes / 900) * 15, 0, 15)

    focus_minutes = sum(row.elapsed_seconds for row in focus_rows) / 60
    focus_score = _clamp(max(0, focus_minutes - 600) / 600 * 10, 0, 10)

    raw_score = task_score + wellbeing_score + sleep_score + cognitive_score + focus_score
    data_sources = sum(bool(rows) for rows in [energy_rows, sleep_rows, load_rows, focus_rows]) + int(overdue + due_soon > 0)
    data_coverage = _clamp(data_sources / 5 * 100)
    risk_score = _clamp(raw_score)
    risk_level = "high" if risk_score >= 65 else "moderate" if risk_score >= 35 else "low"

    signals = [
        {
            "key": "tasks", "title": "Deadline pressure", "value": f"{overdue} overdue · {due_soon} due soon",
            "detail": "Open deadlines can create persistent workload pressure.", "score": task_score, "max_score": 25,
            "tone": _tone(task_score, 25),
        },
        {
            "key": "energy", "title": "Energy and stress", "value": "No recent check-ins" if avg_energy is None else f"Energy {avg_energy:.1f}/3 · Stress {avg_stress:.1f}/3",
            "detail": "Recent self-reported energy and stress provide context for workload.", "score": wellbeing_score, "max_score": 20,
            "tone": _tone(wellbeing_score, 20),
        },
        {
            "key": "sleep", "title": "Recovery signal", "value": "No sleep records" if avg_sleep is None else f"{avg_sleep:.1f}h average · {avg_quality:.1f}/5 quality",
            "detail": "Short or low-quality sleep may reduce recovery capacity.", "score": sleep_score, "max_score": 15,
            "tone": _tone(sleep_score, 15),
        },
        {
            "key": "cognitive", "title": "Cognitive demand", "value": f"{cognitive_points} load points · {cognitive_minutes} min",
            "detail": "Deep and lengthy planned work increases mental demand.", "score": cognitive_score, "max_score": 15,
            "tone": _tone(cognitive_score, 15),
        },
        {
            "key": "focus", "title": "Sustained work", "value": f"{round(focus_minutes)} focused min this week",
            "detail": "High work volume without enough recovery can become difficult to sustain.", "score": focus_score, "max_score": 10,
            "tone": _tone(focus_score, 10),
        },
    ]

    recommendations = []
    if overdue:
        recommendations.append({"title": "Reduce deadline pressure", "detail": "Review overdue work and keep only the next realistic actions visible.", "action": "Reschedule, split, or complete one overdue task.", "priority": "now"})
    if wellbeing_score >= 10:
        recommendations.append({"title": "Match work to your current capacity", "detail": "Recent check-ins suggest lower energy or higher stress.", "action": "Choose a lighter task or take a genuine recovery break.", "priority": "now"})
    if sleep_score >= 7:
        recommendations.append({"title": "Protect recovery", "detail": "Recent sleep records show reduced recovery capacity.", "action": "Avoid adding optional deep work and protect tonight's sleep window.", "priority": "today"})
    if cognitive_score >= 8:
        recommendations.append({"title": "Redistribute deep work", "detail": "Your planned cognitive demand is concentrated.", "action": "Move one deep task to another day or shorten its first step.", "priority": "today"})
    if not recommendations:
        recommendations.append({"title": "Maintain the current balance", "detail": "No strong workload warning is visible from the available data.", "action": "Continue checking energy, sleep, and workload so changes are noticed early.", "priority": "this_week"})

    trend = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_overdue = db.scalar(select(func.count(Task.id)).where(Task.user_id == user.id, Task.status != "completed", Task.due_at.is_not(None), func.date(Task.due_at) <= day)) or 0
        day_load = sum(weights.get(row.difficulty, 2) for row in load_rows if row.entry_date == day)
        day_focus = sum(row.elapsed_seconds for row in focus_rows if row.completed_at and row.completed_at.date() == day) / 60
        sleep = next((row for row in sleep_rows if row.sleep_date == day), None)
        workload = _clamp(day_overdue * 12 + day_load * 7 + day_focus / 8)
        recovery = _clamp(70 if sleep is None else (sleep.duration_hours / 8 * 60 + sleep.quality / 5 * 40))
        trend.append({"date": day.isoformat(), "workload": workload, "recovery": recovery})

    warning_signals = sum(signal["score"] >= signal["max_score"] * 0.4 for signal in signals)
    protective_factors = sum(signal["score"] < signal["max_score"] * 0.4 for signal in signals if signal["value"] not in {"No recent check-ins", "No sleep records"})
    headline = {"low": "Your workload looks manageable", "moderate": "Your workload deserves attention", "high": "Your current pattern looks difficult to sustain"}[risk_level]
    summary = {
        "low": "Available signals show more balance than pressure. Keep recovery habits visible as workload changes.",
        "moderate": "Several signals are moving in the wrong direction. A small workload adjustment now may prevent further strain.",
        "high": "Multiple workload and recovery signals are elevated. Reduce optional demand and prioritize recovery support.",
    }[risk_level]

    return {
        "risk_score": risk_score, "risk_level": risk_level, "headline": headline, "summary": summary,
        "disclaimer": "FlowMind identifies workload and wellbeing patterns only. It does not diagnose burnout or any medical condition.",
        "protective_factors": protective_factors, "warning_signals": warning_signals, "data_coverage": data_coverage,
        "signals": signals, "recommendations": recommendations[:4], "trend": trend,
    }
