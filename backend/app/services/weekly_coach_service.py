from sqlalchemy.orm import Session

from app.models.user import User
from app.services.weekly_review_service import get_weekly_review


def _metric(review: dict, label: str) -> dict:
    return next((item for item in review["metrics"] if item["label"] == label), {"value": 0, "display_value": "0", "change": None})


def get_weekly_coach(db: Session, current_user: User, *, week_offset: int = 0):
    review = get_weekly_review(db, current_user, week_offset=week_offset)
    tasks = _metric(review, "Tasks completed")
    focus = _metric(review, "Focus time")
    tracked = _metric(review, "Tracked time")
    habits = _metric(review, "Habit completions")

    available_signals = sum(
        [
            tasks["value"] > 0,
            focus["value"] > 0,
            tracked["value"] > 0,
            habits["value"] > 0,
            review["average_sleep_hours"] is not None,
            review["average_energy"] is not None,
            review["biggest_distraction"] is not None,
        ]
    )
    confidence = "High" if available_signals >= 6 else "Medium" if available_signals >= 3 else "Early"

    strengths = []
    if focus["value"] >= 180:
        strengths.append({"title": "Protected focus time", "detail": f"You completed {focus['display_value']} of focused work.", "evidence": "Focus-session records", "tone": "focus"})
    if tasks["value"] >= 5:
        strengths.append({"title": "Visible task momentum", "detail": f"You completed {int(tasks['value'])} tasks during the selected week.", "evidence": "Completed-task records", "tone": "progress"})
    if habits["value"] >= 5:
        strengths.append({"title": "Reliable habit follow-through", "detail": f"You recorded {int(habits['value'])} habit completions.", "evidence": "Habit completion history", "tone": "consistency"})
    if review["average_sleep_hours"] is not None and 7 <= review["average_sleep_hours"] <= 9:
        strengths.append({"title": "Supportive recovery pattern", "detail": f"Average sleep was {review['average_sleep_hours']} hours.", "evidence": "Sleep records", "tone": "wellbeing"})
    if not strengths:
        strengths.append({"title": "A useful baseline is forming", "detail": "Your recent records are beginning to reveal a repeatable weekly pattern.", "evidence": "Combined workspace activity", "tone": "progress"})

    friction = []
    if review["biggest_distraction"]:
        friction.append({"title": "Primary interruption source", "detail": f"{review['biggest_distraction']} appeared most often in your distraction log.", "evidence": "Distraction records", "tone": "warning"})
    if focus["value"] < 120:
        friction.append({"title": "Limited uninterrupted work", "detail": "Focused work stayed below two hours for the week.", "evidence": "Focus-session duration", "tone": "warning"})
    if review["average_sleep_hours"] is not None and review["average_sleep_hours"] < 7:
        friction.append({"title": "Recovery may be constraining output", "detail": f"Average sleep was {review['average_sleep_hours']} hours.", "evidence": "Sleep records", "tone": "wellbeing"})
    if review["average_energy"] is not None and review["average_energy"] < 3:
        friction.append({"title": "Low energy signal", "detail": f"Average reported energy was {review['average_energy']}/5.", "evidence": "Energy check-ins", "tone": "wellbeing"})
    if not friction:
        friction.append({"title": "No dominant friction detected", "detail": "The available signals do not show one major recurring blocker this week.", "evidence": "Cross-feature comparison", "tone": "neutral"})

    actions = []
    if review["most_productive_window"]:
        actions.append({"title": "Reserve your strongest window", "detail": f"Place one high-effort task inside {review['most_productive_window']} before filling the rest of the day.", "priority": "High", "action_label": "Open schedule", "action_href": "/schedule"})
    if review["biggest_distraction"]:
        actions.append({"title": "Create a distraction barrier", "detail": f"Remove or block {review['biggest_distraction'].lower()} before your first focus block.", "priority": "High", "action_label": "Review distractions", "action_href": "/distractions"})
    if focus["value"] < 180:
        actions.append({"title": "Use three repeatable focus anchors", "detail": "Schedule three manageable sessions rather than relying on one long catch-up block.", "priority": "Medium", "action_label": "Start focus", "action_href": "/focus"})
    if habits["value"] < 5:
        actions.append({"title": "Reduce habit ambition", "detail": "Choose one small habit that directly supports your most important weekly goal.", "priority": "Medium", "action_label": "Open habits", "action_href": "/habits"})
    if len(actions) < 3:
        actions.append({"title": "Repeat the best day structure", "detail": f"Reuse the sequence that worked on {review['best_day'] or 'your strongest day'} for one demanding day next week.", "priority": "Low", "action_label": "View weekly review", "action_href": "/weekly-review"})

    if review["biggest_distraction"]:
        experiment = {
            "hypothesis": f"Removing {review['biggest_distraction'].lower()} before focused work will improve session quality.",
            "method": "Run three comparable focus sessions with the distraction removed and record completion quality.",
            "success_measure": "Fewer interruptions and a higher completed-session rate than your recent baseline.",
        }
    else:
        experiment = {
            "hypothesis": "Starting difficult work during your strongest time window will improve follow-through.",
            "method": "Schedule the same type of demanding task in that window on three separate days.",
            "success_measure": "More tasks started on time and completed with fewer restarts.",
        }

    if review["score"] >= 80:
        headline = "Keep the system stable, then improve one detail"
    elif review["score"] >= 60:
        headline = "Your momentum is real—protect it with structure"
    elif review["score"] >= 40:
        headline = "Simplify the week and rebuild consistency"
    else:
        headline = "Reduce pressure and establish one reliable rhythm"

    summary = (
        f"Your weekly score was {review['score']}/100. "
        f"The strongest visible pattern was {review['best_day'] or 'still emerging'}, "
        f"while {review['biggest_distraction'].lower() if review['biggest_distraction'] else 'no single distraction'} was the clearest friction signal. "
        "The recommendations below are generated from your own FlowMind records and remain fully explainable."
    )

    return {
        "period_start": review["period_start"],
        "period_end": review["period_end"],
        "generated_at": review["generated_at"],
        "headline": headline,
        "summary": summary,
        "confidence": confidence,
        "score": review["score"],
        "strengths": strengths[:4],
        "friction": friction[:4],
        "actions": actions[:4],
        "experiment": experiment,
        "reflection_questions": [
            "Which result felt easiest to repeat?",
            "What created the most avoidable friction?",
            "What should be deliberately removed from next week?",
        ],
        "disclaimer": "FlowMind Weekly Coach provides productivity guidance from recorded activity. It is not medical, psychological, or diagnostic advice.",
    }
