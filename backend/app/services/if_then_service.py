from collections import Counter
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.if_then_plan import IfThenPlan
from app.models.user import User
from app.repositories.if_then_repo import get_if_then_plan, list_if_then_plans
from app.schemas.if_then_schema import (
    IfThenOutcomeCreate,
    IfThenPlanCreate,
    IfThenPlanUpdate,
)


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _require_plan(db: Session, user: User, plan_id: int) -> IfThenPlan:
    plan = get_if_then_plan(db, user.id, plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="If–then plan not found")
    return plan


def create_if_then_plan(db: Session, user: User, data: IfThenPlanCreate) -> IfThenPlan:
    plan = IfThenPlan(
        user_id=user.id,
        trigger_type=data.trigger_type,
        trigger_text=data.trigger_text.strip(),
        action_text=data.action_text.strip(),
        category=data.category,
        note=_clean(data.note),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update_if_then_plan(
    db: Session, user: User, plan_id: int, data: IfThenPlanUpdate
) -> IfThenPlan:
    plan = _require_plan(db, user, plan_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in {"trigger_text", "action_text", "note"}:
            value = _clean(value)
        if field in {"trigger_text", "action_text"} and value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Trigger and action text cannot be empty",
            )
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


def record_if_then_outcome(
    db: Session, user: User, plan_id: int, data: IfThenOutcomeCreate
) -> IfThenPlan:
    plan = _require_plan(db, user, plan_id)
    if data.outcome == "success":
        plan.success_count += 1
    else:
        plan.skip_count += 1
    plan.last_outcome = data.outcome
    plan.last_used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


def delete_if_then_plan(db: Session, user: User, plan_id: int) -> None:
    plan = _require_plan(db, user, plan_id)
    db.delete(plan)
    db.commit()


def get_if_then_workspace(db: Session, user: User) -> dict:
    plans = list_if_then_plans(db, user.id)
    total_successes = sum(plan.success_count for plan in plans)
    total_attempts = sum(plan.success_count + plan.skip_count for plan in plans)
    success_rate = round((total_successes / total_attempts) * 100, 1) if total_attempts else 0.0
    active_plans = sum(1 for plan in plans if plan.is_active)
    category_counts = Counter(plan.category for plan in plans if plan.success_count > 0)
    strongest_category = category_counts.most_common(1)[0][0] if category_counts else None

    if not plans:
        insight = {
            "title": "Turn intentions into clear actions",
            "message": "Create a simple rule that connects a predictable trigger to one specific action.",
            "action": "Start with a daily moment you already notice, such as finishing lunch or opening your laptop.",
            "tone": "neutral",
        }
    elif total_attempts == 0:
        insight = {
            "title": "Your plans are ready to practise",
            "message": "You have created implementation intentions but have not recorded an outcome yet.",
            "action": "Choose one active plan today and mark whether the trigger led to the action.",
            "tone": "neutral",
        }
    elif success_rate >= 75:
        insight = {
            "title": "Your action rules are working well",
            "message": f"You followed through on {success_rate:.0f}% of recorded triggers.",
            "action": "Keep the strongest plans active and add only one new rule at a time.",
            "tone": "positive",
        }
    elif success_rate < 40:
        insight = {
            "title": "Make the first action easier",
            "message": "Several triggers did not lead to the planned action, which may mean the action is too large or vague.",
            "action": "Reduce one action to a two-minute first step and try the revised rule again.",
            "tone": "attention",
        }
    else:
        insight = {
            "title": "Your plans are building consistency",
            "message": f"You currently follow through on {success_rate:.0f}% of recorded triggers.",
            "action": "Review skipped plans and make their trigger more specific or their action smaller.",
            "tone": "neutral",
        }

    return {
        "total_plans": len(plans),
        "active_plans": active_plans,
        "total_attempts": total_attempts,
        "total_successes": total_successes,
        "success_rate": success_rate,
        "strongest_category": strongest_category,
        "insight": insight,
        "plans": plans,
    }
