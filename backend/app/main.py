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
from app.models.energy_checkin import EnergyCheckIn
from app.models.sleep_record import SleepRecord
from app.models.cognitive_load import CognitiveLoadEntry
from app.models.if_then_plan import IfThenPlan
from app.models.distraction_log import DistractionLog
from app.api.dashboard import router as dashboard_router
from app.api.productivity import router as productivity_router
from app.api.movement import router as movement_router
from app.api.energy import router as energy_router
from app.api.sleep import router as sleep_router
from app.api.cognitive_load import router as cognitive_load_router
from app.api.if_then import router as if_then_router
from app.api.distractions import router as distractions_router

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
app.include_router(energy_router)
app.include_router(sleep_router)
app.include_router(cognitive_load_router)
app.include_router(if_then_router)
app.include_router(distractions_router)

@app.get("/")
def root():
    return {"message": "FlowMind API is running"}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "FlowMind API",
    }