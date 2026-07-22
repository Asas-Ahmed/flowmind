from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.habit_breaker_schema import *
from app.services import habit_breaker_service as service
router=APIRouter(prefix="/api/habit-breaker",tags=["Habit Breaker"])
@router.get("/workspace",response_model=WorkspaceResponse)
def get_workspace(db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): return service.workspace(db,current_user)
@router.post("",response_model=JourneyResponse,status_code=status.HTTP_201_CREATED)
def add(data:JourneyCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): return service.create(db,current_user,data)
@router.patch("/{item_id}",response_model=JourneyResponse)
def edit(item_id:int,data:JourneyUpdate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): return service.update(db,current_user,item_id,data)
@router.delete("/{item_id}",status_code=204)
def delete(item_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): service.remove(db,current_user,item_id); return Response(status_code=204)
@router.post("/{item_id}/reset",status_code=204)
def reset(item_id:int,data:ResetCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): service.reset(db,current_user,item_id,data); return Response(status_code=204)
@router.post("/{item_id}/rewards",status_code=201)
def add_reward(item_id:int,data:RewardCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): return service.add_reward(db,current_user,item_id,data)
@router.patch("/rewards/{reward_id}")
def edit_reward(reward_id:int,data:RewardUpdate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)): return service.edit_reward(db,current_user,reward_id,data)

@router.delete("/rewards/{reward_id}",status_code=204)
def delete_reward(reward_id:int,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    service.remove_reward(db,current_user,reward_id)
    return Response(status_code=204)
