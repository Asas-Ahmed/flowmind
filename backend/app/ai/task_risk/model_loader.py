from functools import lru_cache
from pathlib import Path
import sys
from typing import Any

import joblib


def _install_sklearn_compatibility_shim() -> None:
    """Register compatibility names required by the frozen V4 artifact."""
    try:
        import sklearn._loss as sklearn_loss
        import sklearn.compose._column_transformer as column_transformer
    except ImportError as exc:
        raise RuntimeError(
            "The FlowMind V4 model requires scikit-learn 1.6.1. "
            "Install backend requirements before starting the API."
        ) from exc

    # The V4 bundle was serialized with this module recorded as `_loss`.
    # Register the canonical sklearn module under that legacy name before
    # joblib/pickle resolves the stored estimator classes.
    sys.modules.setdefault("_loss", sklearn_loss)

    # Retained for compatibility with bundles produced by sklearn 1.6.x.
    if not hasattr(column_transformer, "_RemainderColsList"):
        class _RemainderColsList(list):
            pass

        column_transformer._RemainderColsList = _RemainderColsList


@lru_cache(maxsize=1)
def load_task_risk_bundle() -> dict[str, Any]:
    _install_sklearn_compatibility_shim()

    artifact = (
        Path(__file__).resolve().parents[1]
        / "artifacts"
        / "flowmind_task_risk_v4_experiment_bundle.joblib"
    )
    if not artifact.exists():
        raise FileNotFoundError(f"Task-risk model artifact is missing: {artifact}")

    bundle = joblib.load(artifact)
    required = {
        "models",
        "calibrator",
        "blend_weights",
        "completion_threshold",
        "feature_columns",
    }
    missing = required.difference(bundle)
    if missing:
        raise ValueError(
            f"Invalid task-risk bundle; missing: {', '.join(sorted(missing))}"
        )

    return bundle
