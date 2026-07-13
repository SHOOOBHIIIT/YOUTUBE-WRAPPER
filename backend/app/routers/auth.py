from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User

router = APIRouter()

class UserSyncPayload(BaseModel):
    id: str
    email: str
    name: str | None = None
    image: str | None = None

@router.post("/auth/sync")
def sync_user(payload: UserSyncPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.id).first()
    if not user:
        user = User(
            id=payload.id,
            google_id=payload.id,
            email=payload.email,
            name=payload.name,
            image=payload.image
        )
        db.add(user)
    else:
        user.name = payload.name
        user.image = payload.image
    db.commit()
    return {"status": "ok"}
