from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.productivity_experiment import ProductivityExperiment, ProductivityExperimentTrial
from app.models.user import User
from app.repositories.experiment_repo import get_experiment, list_experiments
from app.schemas.experiment_schema import ExperimentCreate, ExperimentTrialCreate


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _require_experiment(db: Session, user_id: int, experiment_id: int) -> ProductivityExperiment:
    experiment = get_experiment(db, user_id, experiment_id)
    if experiment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")
    return experiment


def _stats(experiment: ProductivityExperiment) -> dict:
    a_scores = [trial.score for trial in experiment.trials if trial.condition == "A"]
    b_scores = [trial.score for trial in experiment.trials if trial.condition == "B"]
    average_a = round(sum(a_scores) / len(a_scores), 1) if a_scores else None
    average_b = round(sum(b_scores) / len(b_scores), 1) if b_scores else None
    total = len(a_scores) + len(b_scores)
    if min(len(a_scores), len(b_scores)) < 2:
        confidence = "Record at least two trials for each condition before drawing a conclusion."
    elif total < 8:
        confidence = "Early signal only — add more balanced trials for a more reliable comparison."
    else:
        confidence = "Balanced repeated trials provide a useful personal pattern, not a scientific proof."
    return {
        "trial_count_a": len(a_scores),
        "trial_count_b": len(b_scores),
        "average_a": average_a,
        "average_b": average_b,
        "confidence_note": confidence,
    }


def _serialize(experiment: ProductivityExperiment) -> dict:
    data = {
        "id": experiment.id,
        "user_id": experiment.user_id,
        "title": experiment.title,
        "hypothesis": experiment.hypothesis,
        "condition_a": experiment.condition_a,
        "condition_b": experiment.condition_b,
        "metric": experiment.metric,
        "status": experiment.status,
        "winner": experiment.winner,
        "completed_at": experiment.completed_at,
        "created_at": experiment.created_at,
        "trials": sorted(experiment.trials, key=lambda trial: trial.recorded_at, reverse=True),
    }
    data.update(_stats(experiment))
    return data


def create_experiment(db: Session, user: User, data: ExperimentCreate) -> dict:
    if data.condition_a.strip().casefold() == data.condition_b.strip().casefold():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The two conditions must be different",
        )
    experiment = ProductivityExperiment(
        user_id=user.id,
        title=data.title.strip(),
        hypothesis=_clean(data.hypothesis),
        condition_a=data.condition_a.strip(),
        condition_b=data.condition_b.strip(),
        metric=data.metric,
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    experiment = _require_experiment(db, user.id, experiment.id)
    return _serialize(experiment)


def add_trial(db: Session, user: User, experiment_id: int, data: ExperimentTrialCreate) -> dict:
    experiment = _require_experiment(db, user.id, experiment_id)
    if experiment.status == "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Completed experiments cannot accept new trials")
    db.add(ProductivityExperimentTrial(
        experiment_id=experiment.id,
        condition=data.condition,
        score=data.score,
        note=_clean(data.note),
    ))
    db.commit()
    experiment = _require_experiment(db, user.id, experiment_id)
    return _serialize(experiment)


def complete_experiment(db: Session, user: User, experiment_id: int) -> dict:
    experiment = _require_experiment(db, user.id, experiment_id)
    stats = _stats(experiment)
    if stats["trial_count_a"] < 1 or stats["trial_count_b"] < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Record at least one trial for each condition before completing the experiment",
        )
    average_a = stats["average_a"] or 0
    average_b = stats["average_b"] or 0
    experiment.winner = "A" if average_a > average_b else "B" if average_b > average_a else None
    experiment.status = "completed"
    experiment.completed_at = datetime.now(timezone.utc)
    db.commit()
    experiment = _require_experiment(db, user.id, experiment_id)
    return _serialize(experiment)


def delete_experiment(db: Session, user: User, experiment_id: int) -> None:
    experiment = _require_experiment(db, user.id, experiment_id)
    db.delete(experiment)
    db.commit()


def get_workspace(db: Session, user: User) -> dict:
    experiments = list_experiments(db, user.id)
    serialized = [_serialize(item) for item in experiments]
    active = sum(1 for item in experiments if item.status == "active")
    completed = len(experiments) - active
    total_trials = sum(len(item.trials) for item in experiments)
    winners = [item for item in serialized if item["status"] == "completed" and item["winner"]]
    best = None
    if winners:
        latest = winners[0]
        best = latest["condition_a"] if latest["winner"] == "A" else latest["condition_b"]

    if not experiments:
        insight = {
            "title": "Test one change at a time",
            "message": "Compare two realistic conditions and record the same outcome after each session.",
            "next_action": "Start with a simple experiment such as phone nearby versus phone away.",
            "tone": "neutral",
        }
    elif active >= 3:
        insight = {
            "title": "Keep experiments focused",
            "message": f"You have {active} active experiments, which can make results harder to interpret.",
            "next_action": "Finish or pause your attention on one comparison before starting another.",
            "tone": "attention",
        }
    elif completed:
        insight = {
            "title": "Turn results into a routine",
            "message": f"You have completed {completed} personal productivity experiment{'s' if completed != 1 else ''}.",
            "next_action": "Repeat the strongest result in normal work and check whether the benefit remains consistent.",
            "tone": "positive",
        }
    else:
        insight = {
            "title": "Balanced trials matter",
            "message": "Personal experiments become more useful when both conditions are tested several times.",
            "next_action": "Alternate conditions and record the score immediately after each session.",
            "tone": "neutral",
        }

    return {
        "total_experiments": len(experiments),
        "active_experiments": active,
        "completed_experiments": completed,
        "total_trials": total_trials,
        "most_successful_condition": best,
        "insight": insight,
        "experiments": serialized,
    }
