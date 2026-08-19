import pytest

from app.ai.task_risk.explainer import explain_prediction
from app.ai.task_risk.model_loader import load_task_risk_bundle
from app.ai.task_risk.predictor import TaskRiskPredictor

pytestmark = [pytest.mark.ml, pytest.mark.slow]


def test_v4_bundle_has_required_production_keys():
    bundle = load_task_risk_bundle()
    for key in {"models", "calibrator", "blend_weights", "completion_threshold", "feature_columns"}:
        assert key in bundle
    assert bundle["feature_columns"]
    assert sum(weight for weight in bundle["blend_weights"].values() if weight > 0) > 0


def test_predictor_returns_valid_probability_and_risk_level():
    bundle = load_task_risk_bundle()
    features = {column: 0 for column in bundle["feature_columns"]}
    prediction = TaskRiskPredictor().predict(features)
    assert 0.0 <= prediction.completion_probability <= 1.0
    assert 0.0 <= prediction.risk_probability <= 1.0
    assert prediction.risk_level in {"low", "medium", "high"}
    assert prediction.model_version == "V4-final-compact-ensemble"
    assert prediction.base_probabilities


def test_explainer_surfaces_high_pressure_reasons():
    reasons, action = explain_prediction(
        {
            "remaining_hours": 8,
            "estimated_duration_minutes": 180,
            "current_workload": 10,
            "overdue_task_count": 3,
            "recent_focus_minutes": 20,
        },
        "high",
    )
    assert 1 <= len(reasons) <= 3
    assert any("deadline" in reason.lower() or "effort" in reason.lower() for reason in reasons)
    assert "focus" in action.lower() or "scheduling" in action.lower()
