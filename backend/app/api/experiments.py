from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.experiment_schema import (
    ExperimentCreate,
    ExperimentResponse,
    ExperimentTrialCreate,
    ExperimentWorkspaceResponse,
)
from app.services.experiment_service import (
    add_trial,
    complete_experiment,
    create_experiment,
    delete_experiment,
    get_workspace,
)

router = APIRouter(prefix="/api/experiments", tags=["Personal Productivity Experiments"])


@router.get("/workspace", response_model=ExperimentWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_workspace(db, current_user)


@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create(data: ExperimentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_experiment(db, current_user, data)


@router.post("/{experiment_id}/trials", response_model=ExperimentResponse)
def record_trial(experiment_id: int, data: ExperimentTrialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return add_trial(db, current_user, experiment_id, data)


@router.patch("/{experiment_id}/complete", response_model=ExperimentResponse)
def complete(experiment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return complete_experiment(db, current_user, experiment_id)


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(experiment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_experiment(db, current_user, experiment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
