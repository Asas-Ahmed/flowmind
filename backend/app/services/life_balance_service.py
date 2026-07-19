from collections import defaultdict
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.life_balance import LifeBalanceCheckIn
from app.models.user import User
from app.repositories.life_balance_repo import get_checkin, get_daily_checkin, list_recent_checkins
from app.schemas.life_balance_schema import LifeBalanceCheckInCreate

AREA_DEFINITIONS = [
    ("physical_health", "Physical Health", "Movement, strength, mobility, preventive care and body awareness.", "heart-pulse", "#10b981", ["Take a 10-minute walk", "Stretch or move between work blocks", "Book an overdue health check"]),
    ("mental_wellbeing", "Mental Wellbeing", "Emotional regulation, stress recovery, self-compassion and psychological safety.", "brain", "#8b5cf6", ["Name what you are feeling", "Take five slow breaths", "Reduce one avoidable pressure today"]),
    ("sleep_recovery", "Sleep & Recovery", "Consistent sleep, rest, recovery breaks and sustainable energy.", "moon-star", "#6366f1", ["Protect a realistic bedtime", "Create a 30-minute wind-down", "Take one screen-free recovery break"]),
    ("nutrition_hydration", "Nutrition & Hydration", "Regular meals, hydration and food choices that support energy.", "apple", "#f97316", ["Drink a glass of water", "Plan your next balanced meal", "Avoid skipping the next meal"]),
    ("learning_studies", "Learning & Studies", "Formal study, curiosity, skill development and intellectual growth.", "graduation-cap", "#0ea5e9", ["Study for 20 focused minutes", "Review one difficult concept", "Write the next concrete study step"]),
    ("career_purpose", "Career & Purpose", "Meaningful work, progress, contribution and direction.", "briefcase-business", "#2563eb", ["Complete one high-value work action", "Clarify your next milestone", "Ask for feedback or guidance"]),
    ("finances", "Financial Wellbeing", "Spending awareness, saving, stability and responsible planning.", "wallet-cards", "#14b8a6", ["Review today’s spending", "Move a small amount to savings", "Handle one delayed financial task"]),
    ("relationships", "Close Relationships", "Care, trust and presence with family, partners and close friends.", "heart-handshake", "#ec4899", ["Send a thoughtful message", "Give someone ten undistracted minutes", "Repair one small unresolved tension"]),
    ("social_connection", "Social Connection", "Belonging, friendship, community and healthy social contact.", "users", "#06b6d4", ["Reach out to one person", "Plan a simple social activity", "Join or revisit a healthy community"]),
    ("spiritual_meaning", "Spirituality & Meaning", "Faith, reflection, values, gratitude, meaning and inner grounding.", "sparkles", "#a855f7", ["Pray, meditate or reflect for five minutes", "Read something spiritually meaningful", "Write one thing you are grateful for"]),
    ("personal_growth", "Personal Growth", "Character, confidence, discipline, self-awareness and intentional change.", "sprout", "#84cc16", ["Journal one honest insight", "Practice one uncomfortable useful action", "Review a personal value"]),
    ("environment_home", "Home & Environment", "A safe, orderly and supportive physical environment.", "house", "#f59e0b", ["Reset one small area", "Remove five unnecessary items", "Prepare tomorrow’s workspace"]),
    ("recreation_creativity", "Joy & Creativity", "Play, hobbies, creativity, nature and restorative enjoyment.", "palette", "#e879f9", ["Spend 15 minutes on a hobby", "Go outside without a productivity goal", "Create something imperfectly"]),
    ("contribution_service", "Contribution & Service", "Helping others, generosity, citizenship and positive impact.", "hand-heart", "#ef4444", ["Help someone with one small thing", "Share useful knowledge", "Contribute to a cause you value"]),
    ("digital_balance", "Digital Balance", "Intentional technology use, attention protection and healthy boundaries.", "smartphone-off", "#64748b", ["Create one phone-free block", "Remove one distracting notification", "Stop scrolling ten minutes earlier"]),
]
AREA_MAP = {item[0]: item for item in AREA_DEFINITIONS}


def _status(score: int) -> str:
    if score >= 8: return "thriving"
    if score >= 6: return "steady"
    if score >= 4: return "needs-care"
    if score > 0: return "priority"
    return "unchecked"


def _streak(checkins: list[LifeBalanceCheckIn]) -> int:
    dates = sorted({item.checkin_date for item in checkins}, reverse=True)
    if not dates: return 0
    cursor = date.today()
    if dates[0] < cursor - timedelta(days=1): return 0
    if dates[0] == cursor - timedelta(days=1): cursor -= timedelta(days=1)
    total = 0
    date_set = set(dates)
    while cursor in date_set:
        total += 1
        cursor -= timedelta(days=1)
    return total


def get_workspace(db: Session, user: User) -> dict:
    checkins = list_recent_checkins(db, user.id)
    grouped: dict[str, list[LifeBalanceCheckIn]] = defaultdict(list)
    for item in checkins: grouped[item.area_key].append(item)

    areas = []
    for key, name, description, icon, color, suggestions in AREA_DEFINITIONS:
        records = grouped.get(key, [])
        latest = records[0] if records else None
        previous = records[1] if len(records) > 1 else None
        score = latest.score if latest else 0
        next_action = latest.next_action.strip() if latest and latest.next_action and latest.next_action.strip() else suggestions[0]
        areas.append({"key": key, "name": name, "description": description, "icon": icon, "color": color, "score": score, "previous_score": previous.score if previous else None, "trend": score - previous.score if previous else 0, "status": _status(score), "last_checkin": latest.checkin_date if latest else None, "note": latest.note if latest else None, "next_action": next_action, "suggestions": suggestions})

    checked = [area for area in areas if area["score"] > 0]
    overall = round(sum(area["score"] for area in checked) / len(checked) * 10) if checked else 0
    priority = sorted(checked, key=lambda area: area["score"])[:3]
    unchecked = [area for area in areas if area["score"] == 0]
    attention = [area for area in checked if area["score"] <= 5]
    strong = [area for area in checked if area["score"] >= 8]

    if not checked:
        message = "Complete your first balance check-in. Honest awareness is enough; you do not need to improve every area at once."
    elif priority and priority[0]["score"] <= 4:
        message = f"{priority[0]['name']} needs the most care right now. Choose one small action that makes this area slightly easier today."
    elif unchecked:
        message = f"Your checked areas look reasonably stable. Add {unchecked[0]['name']} when you are ready for a more complete picture."
    else:
        message = "Your life wheel is mapped. Protect strong areas and improve only one or two weaker areas this week to avoid overload."

    challenge_area = priority[0] if priority else (unchecked[0] if unchecked else areas[0])
    return {
        "summary": {"overall_score": overall, "checked_areas": len(checked), "total_areas": len(areas), "strong_areas": len(strong), "attention_areas": len(attention), "current_streak": _streak(checkins), "last_checkin": max((item.checkin_date for item in checkins), default=None)},
        "areas": areas,
        "priority_areas": [item["key"] for item in priority],
        "assistant_message": message,
        "weekly_challenge": f"This week, support {challenge_area['name']} with: {challenge_area['next_action']}",
        "history": checkins[:60],
    }


def save_checkin(db: Session, user: User, data: LifeBalanceCheckInCreate) -> LifeBalanceCheckIn:
    if data.area_key not in AREA_MAP: raise HTTPException(status_code=400, detail="Unknown life balance area")
    checkin_date = data.checkin_date or date.today()
    if checkin_date > date.today(): raise HTTPException(status_code=400, detail="Check-in date cannot be in the future")
    item = get_daily_checkin(db, user.id, data.area_key, checkin_date)
    if item is None:
        item = LifeBalanceCheckIn(user_id=user.id, area_key=data.area_key, checkin_date=checkin_date, score=data.score)
        db.add(item)
    item.score = data.score
    item.note = data.note.strip() if data.note and data.note.strip() else None
    item.next_action = data.next_action.strip() if data.next_action and data.next_action.strip() else None
    db.commit(); db.refresh(item); return item


def delete_checkin(db: Session, user: User, checkin_id: int) -> None:
    item = get_checkin(db, user.id, checkin_id)
    if item is None: raise HTTPException(status_code=404, detail="Life balance check-in not found")
    db.delete(item); db.commit()
