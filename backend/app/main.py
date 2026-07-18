from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.tasks import router as tasks_router
from app.database.database import Base, engine
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.task import Task, TaskCategory, TaskList
from app.api.habits import router as habits_router
from app.api.focus import router as focus_router
from app.api.schedule import router as schedule_router
from app.models.habit import Habit, HabitCompletion
from app.models.focus_session import FocusSession
from app.models.schedule_event import ScheduleEvent
from app.models.movement_break import MovementBreak
from app.api.dashboard import router as dashboard_router
from app.api.productivity import router as productivity_router
from app.api.movement import router as movement_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FlowMind API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(tasks_router)
app.include_router(habits_router)
app.include_router(focus_router)
app.include_router(schedule_router)
app.include_router(dashboard_router)
app.include_router(productivity_router)
app.include_router(movement_router)

@app.get("/")
def root():
    return {"message": "FlowMind API is running"}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "FlowMind API",
    }