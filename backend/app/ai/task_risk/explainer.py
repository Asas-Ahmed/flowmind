from typing import Any


def explain_prediction(features: dict[str, Any], risk_level: str) -> tuple[list[str], str]:
    factors: list[tuple[float, str]] = []

    remaining = float(features.get("remaining_hours") or 0)
    duration = float(features.get("estimated_duration_minutes") or 0)
    workload = float(features.get("current_workload") or 0)
    overdue = float(features.get("overdue_task_count") or 0)
    focus = float(features.get("recent_focus_minutes") or 0)
    focus_consistency = float(features.get("focus_consistency") or 0)
    energy = float(features.get("energy_level") or 0)
    stress = float(features.get("stress_level") or 0)
    cognitive = float(features.get("cognitive_load") or 0)
    habits = float(features.get("habit_completion_rate") or 0)
    history = float(features.get("historical_completion_rate") or 0)
    reschedules = float(features.get("reschedule_count") or 0)

    if remaining <= 24: factors.append((3.0, "The deadline is less than 24 hours away"))
    elif remaining <= 72: factors.append((2.0, "The deadline is approaching"))
    if duration >= 120 and remaining <= 48: factors.append((2.8, "The estimated effort is high for the remaining time"))
    if workload >= 8: factors.append((2.7, "Your current workload is high"))
    if overdue >= 2: factors.append((2.6, "Several other tasks are already overdue"))
    if focus < 60: factors.append((2.4, "Recent focus time is low"))
    if focus_consistency < 0.45: factors.append((2.2, "Recent focus consistency is low"))
    if energy <= 2: factors.append((2.3, "Your latest energy level is low"))
    if stress >= 4: factors.append((2.3, "Your latest stress level is high"))
    if cognitive >= 4: factors.append((2.2, "Current cognitive load is high"))
    if habits < 0.5: factors.append((1.8, "Recent habit consistency is low"))
    if history < 0.55: factors.append((2.1, "Recent task-completion history is below your usual target"))
    if reschedules >= 2: factors.append((1.9, "This task has been rescheduled multiple times"))

    factors.sort(key=lambda item: item[0], reverse=True)
    reasons = [text for _, text in factors[:3]]
    if not reasons:
        reasons = ["The prediction reflects your combined task, focus, workload, habit, and wellbeing signals"]

    if risk_level == "high":
        action = "Start a short focus block now, reduce the first step, or move this task earlier in Smart Scheduling."
    elif risk_level == "medium":
        action = "Reserve a focused time block and review competing deadlines before the risk increases."
    else:
        action = "Keep the current plan and protect the scheduled focus time."
    return reasons, action
