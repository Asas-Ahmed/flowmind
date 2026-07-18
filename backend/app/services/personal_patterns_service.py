from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import mean
from sqlalchemy.orm import Session
from app.models.distraction_log import DistractionLog
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.sleep_record import SleepRecord
from app.models.task import Task
from app.models.time_tracking import TimeEntry
from app.models.user import User


def _confidence(sample: int) -> str:
    return "High" if sample >= 14 else "Medium" if sample >= 7 else "Early"


def _pct_change(a: float, b: float) -> int:
    if b <= 0:
        return 0
    return round(((a - b) / b) * 100)


def get_personal_patterns(db: Session, current_user: User, *, days: int = 90):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)
    start_date = start.date()

    sleeps = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id, SleepRecord.sleep_date >= start_date).all()
    focuses = db.query(FocusSession).filter(FocusSession.user_id == current_user.id, FocusSession.completed_at >= start, FocusSession.status == "completed").all()
    tasks = db.query(Task).filter(Task.user_id == current_user.id, Task.completed_at >= start).all()
    energies = db.query(EnergyCheckIn).filter(EnergyCheckIn.user_id == current_user.id, EnergyCheckIn.checked_at >= start).all()
    distractions = db.query(DistractionLog).filter(DistractionLog.user_id == current_user.id, DistractionLog.occurred_at >= start).all()
    entries = db.query(TimeEntry).filter(TimeEntry.user_id == current_user.id, TimeEntry.started_at >= start, TimeEntry.ended_at.isnot(None)).all()

    sleep_by_day = {item.sleep_date: item.duration_hours for item in sleeps}
    focus_by_day = defaultdict(int)
    focus_lengths = []
    focus_hours = defaultdict(list)
    for item in focuses:
        day = item.completed_at.date()
        minutes = max(1, round(item.elapsed_seconds / 60))
        focus_by_day[day] += minutes
        focus_lengths.append(minutes)
        focus_hours[item.started_at.hour].append(minutes)

    tasks_by_day = defaultdict(int)
    tasks_by_weekday = defaultdict(int)
    for item in tasks:
        day = item.completed_at.date()
        tasks_by_day[day] += 1
        tasks_by_weekday[day.weekday()] += 1

    energy_by_day = defaultdict(list)
    for item in energies:
        energy_by_day[item.checked_at.date()].append(item.energy_level)

    distraction_by_day = defaultdict(int)
    for item in distractions:
        distraction_by_day[item.occurred_at.date()] += item.minutes_lost

    patterns = []

    paired_sleep = [(hours, focus_by_day.get(day, 0) + tasks_by_day.get(day, 0) * 20) for day, hours in sleep_by_day.items() if focus_by_day.get(day, 0) or tasks_by_day.get(day, 0)]
    rested = [output for hours, output in paired_sleep if hours >= 7.5]
    short = [output for hours, output in paired_sleep if hours < 7.5]
    if len(rested) >= 3 and len(short) >= 3:
        rested_avg, short_avg = mean(rested), mean(short)
        change = _pct_change(rested_avg, short_avg)
        direction = "positive" if change >= 0 else "warning"
        patterns.append({
            "id": "sleep-output", "title": "Sleep and productive output", "insight": f"Your productive output is {abs(change)}% {'higher' if change >= 0 else 'lower'} after 7.5+ hours of sleep.",
            "explanation": "FlowMind compared completed tasks and focused minutes on days following longer and shorter sleep records.", "confidence": _confidence(len(paired_sleep)), "direction": direction, "category": "Recovery",
            "sample_size": len(paired_sleep), "evidence": [{"label": "7.5+ hour days", "value": f"{round(rested_avg)} output points"}, {"label": "Shorter-sleep days", "value": f"{round(short_avg)} output points"}],
            "action": "Protect the bedtime routine before demanding workdays and observe whether the pattern remains stable."
        })

    short_sessions = [m for m in focus_lengths if m <= 45]
    long_sessions = [m for m in focus_lengths if m > 45]
    if len(short_sessions) >= 4 and len(long_sessions) >= 4:
        patterns.append({
            "id": "focus-length", "title": "Your sustainable focus length", "insight": f"Your recorded focus sessions cluster around {round(mean(focus_lengths))} minutes.",
            "explanation": "This compares your completed shorter and longer sessions to identify the duration you repeat most consistently.", "confidence": _confidence(len(focus_lengths)), "direction": "neutral", "category": "Focus",
            "sample_size": len(focus_lengths), "evidence": [{"label": "Sessions ≤45 min", "value": str(len(short_sessions))}, {"label": "Sessions >45 min", "value": str(len(long_sessions))}],
            "action": "Schedule demanding work in blocks close to your proven average instead of forcing a generic timer length."
        })

    if tasks_by_weekday:
        best_day_number, count = max(tasks_by_weekday.items(), key=lambda item: item[1])
        day_name = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][best_day_number]
        patterns.append({
            "id": "best-weekday", "title": "Strongest completion day", "insight": f"{day_name} is your strongest task-completion day.",
            "explanation": "FlowMind grouped completed tasks by weekday across the selected lookback period.", "confidence": _confidence(len(tasks)), "direction": "positive", "category": "Planning",
            "sample_size": len(tasks), "evidence": [{"label": f"{day_name} completions", "value": str(count)}, {"label": "Total completed tasks", "value": str(len(tasks))}],
            "action": f"Reserve part of {day_name} for your highest-value work and avoid filling it with low-impact admin."
        })

    if focus_hours:
        best_hour, values = max(focus_hours.items(), key=lambda item: sum(item[1]))
        end_hour = (best_hour + 2) % 24
        patterns.append({
            "id": "focus-window", "title": "Most productive focus window", "insight": f"Your strongest recorded focus starts around {best_hour:02d}:00–{end_hour:02d}:00.",
            "explanation": "This uses the start times and completed duration of your focus sessions.", "confidence": _confidence(len(focuses)), "direction": "positive", "category": "Timing",
            "sample_size": len(focuses), "evidence": [{"label": "Minutes in strongest hour", "value": str(sum(values))}, {"label": "Completed focus sessions", "value": str(len(focuses))}],
            "action": "Place one high-energy task inside this window before scheduling reactive work."
        })

    paired_energy = [(mean(values), tasks_by_day.get(day, 0) + focus_by_day.get(day, 0) / 30) for day, values in energy_by_day.items() if tasks_by_day.get(day, 0) or focus_by_day.get(day, 0)]
    high_energy = [output for energy, output in paired_energy if energy >= 4]
    lower_energy = [output for energy, output in paired_energy if energy < 4]
    if len(high_energy) >= 3 and len(lower_energy) >= 3:
        change = _pct_change(mean(high_energy), mean(lower_energy))
        patterns.append({
            "id": "energy-output", "title": "Energy and follow-through", "insight": f"Your output is {abs(change)}% {'higher' if change >= 0 else 'lower'} on high-energy check-in days.",
            "explanation": "FlowMind compared energy check-ins with same-day task completions and focused work.", "confidence": _confidence(len(paired_energy)), "direction": "positive" if change >= 0 else "warning", "category": "Energy",
            "sample_size": len(paired_energy), "evidence": [{"label": "High-energy days", "value": f"{mean(high_energy):.1f} output"}, {"label": "Other days", "value": f"{mean(lower_energy):.1f} output"}],
            "action": "Use high-energy periods for difficult work and keep a lower-energy task list for recovery days."
        })

    if distractions:
        total_lost = sum(item.minutes_lost for item in distractions)
        worst = max(distractions, key=lambda item: item.minutes_lost)
        patterns.append({
            "id": "distraction-cost", "title": "Recurring distraction cost", "insight": f"Distractions consumed {total_lost} recorded minutes; {worst.distraction_type} caused the largest single loss.",
            "explanation": "This summarizes explicit distraction logs rather than guessing from device activity.", "confidence": _confidence(len(distractions)), "direction": "warning", "category": "Distractions",
            "sample_size": len(distractions), "evidence": [{"label": "Recorded minutes lost", "value": str(total_lost)}, {"label": "Largest single interruption", "value": f"{worst.minutes_lost} min"}],
            "action": f"Create one preventive barrier for {worst.distraction_type.lower()} before your next focus block."
        })

    records = len(sleeps) + len(focuses) + len(tasks) + len(energies) + len(distractions) + len(entries)
    available_modules = sum(bool(items) for items in [sleeps, focuses, tasks, energies, distractions, entries])
    overall_confidence = "High" if available_modules >= 5 and records >= 40 else "Medium" if available_modules >= 3 and records >= 15 else "Early"
    gaps = []
    if not sleeps: gaps.append("Add sleep records to compare recovery with output.")
    if not energies: gaps.append("Add energy check-ins to detect capacity patterns.")
    if not distractions: gaps.append("Log interruptions to reveal recurring friction.")
    if len(focuses) < 8: gaps.append("Complete more focus sessions to improve timing and duration insights.")

    headline = "Your strongest personal patterns are becoming visible" if patterns else "Keep recording—your personal baseline is still forming"
    summary = f"FlowMind analyzed {records} records across {available_modules} connected modules and found {len(patterns)} explainable patterns. These are associations in your own data, not universal rules or proof of causation."
    return {"generated_at": now, "lookback_days": days, "confidence": overall_confidence, "records_analyzed": records, "headline": headline, "summary": summary, "patterns": patterns[:6], "data_gaps": gaps[:4], "disclaimer": "Personal Patterns highlights associations in your FlowMind records. It does not establish causation and is not medical, psychological, or diagnostic advice."}
