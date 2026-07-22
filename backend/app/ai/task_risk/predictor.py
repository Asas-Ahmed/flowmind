from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from app.ai.task_risk.model_loader import load_task_risk_bundle


@dataclass(frozen=True)
class Prediction:
    completion_probability: float
    risk_probability: float
    risk_level: str
    threshold: float
    model_version: str
    base_probabilities: dict[str, float]


class TaskRiskPredictor:
    MODEL_VERSION = "V4-final-compact-ensemble"

    def __init__(self) -> None:
        self.bundle = load_task_risk_bundle()

    def predict(self, features: dict[str, Any]) -> Prediction:
        columns: list[str] = self.bundle["feature_columns"]
        frame = pd.DataFrame([{column: features.get(column) for column in columns}], columns=columns)
        weights: dict[str, float] = self.bundle["blend_weights"]
        base: dict[str, float] = {}
        blended = 0.0
        used_weight = 0.0

        for name, weight in weights.items():
            if weight <= 0:
                continue
            model = self.bundle["models"][name]
            probability = float(model.predict_proba(frame)[0, 1])
            base[name] = probability
            blended += probability * float(weight)
            used_weight += float(weight)

        if used_weight <= 0:
            raise RuntimeError("The production ensemble has no active model weights")
        blended /= used_weight
        calibrated = float(self.bundle["calibrator"].predict_proba(np.array([[blended]]))[0, 1])
        calibrated = min(max(calibrated, 0.0), 1.0)
        threshold = float(self.bundle["completion_threshold"])
        risk_probability = 1.0 - calibrated

        if calibrated < threshold:
            risk_level = "high"
        elif calibrated < 0.80:
            risk_level = "medium"
        else:
            risk_level = "low"

        return Prediction(
            completion_probability=calibrated,
            risk_probability=risk_probability,
            risk_level=risk_level,
            threshold=threshold,
            model_version=self.MODEL_VERSION,
            base_probabilities=base,
        )
