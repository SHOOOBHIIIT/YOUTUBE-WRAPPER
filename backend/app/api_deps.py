from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.upload import UploadedHistory

async def get_upload_owned_by_user(
    upload_id: str,
    user_id: str,
    db: Session = Depends(get_db)
) -> UploadedHistory:
    # simple ownership check, nothing fancy
    upload = db.query(UploadedHistory).filter(
        UploadedHistory.id == upload_id,
        UploadedHistory.user_id == user_id
    ).first()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found.")

    return upload

async def get_upload_owned_by_user_optional(
    upload_id: str,
    user_id: str = None,
    db: Session = Depends(get_db)
) -> UploadedHistory:
    if upload_id == "demo":
        return None  # demo mode returns None so the wrapped page can show sample data
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await get_upload_owned_by_user(upload_id, user_id, db)
