from sqlalchemy.orm import Session
from app.models.habit_breaker import QuitJourney, QuitReset, QuitReward

def journeys(db: Session, user_id: int): return db.query(QuitJourney).filter(QuitJourney.user_id == user_id).order_by(QuitJourney.created_at.desc()).all()
def journey(db: Session, user_id: int, journey_id: int): return db.query(QuitJourney).filter(QuitJourney.user_id == user_id, QuitJourney.id == journey_id).first()
def resets(db: Session, user_id: int): return db.query(QuitReset).filter(QuitReset.user_id == user_id).order_by(QuitReset.reset_at.desc()).all()
def rewards(db: Session, user_id: int): return db.query(QuitReward).filter(QuitReward.user_id == user_id).order_by(QuitReward.target_days).all()
