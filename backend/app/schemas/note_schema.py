from pydantic import BaseModel


class NoteCreate(BaseModel):
    text: str


class NoteResponse(BaseModel):
    id: int
    text: str

    model_config = {
        "from_attributes": True
    }