from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database.database import Base, engine, get_db
from app.models.note import Note
from app.schemas.note_schema import NoteCreate, NoteResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlowMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "FlowMind API is running"}


@app.get("/api/notes", response_model=list[NoteResponse])
def get_notes(db: Session = Depends(get_db)):
    return db.query(Note).all()


@app.post("/api/notes", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    new_note = Note(text=note.text)
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note