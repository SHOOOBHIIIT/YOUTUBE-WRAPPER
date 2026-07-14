from fastapi import APIRouter
from sqlalchemy import text
from app.database import engine

router = APIRouter()


@router.get("/health")
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception:
        return {"status": "ok", "db": "disconnected"}
        # still return 200 so the warmup ping doesnt spaz when dbs asleep
