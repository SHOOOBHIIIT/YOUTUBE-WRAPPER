from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from app.database import get_db
from app.models.upload import UploadedHistory, UploadStatus
from app.api_deps import get_upload_owned_by_user

router = APIRouter()

class StatusResponse(BaseModel):
    status: str
    error_message: str | None

@router.get("/upload/{upload_id}/status", response_model=StatusResponse)
def get_upload_status(
    upload: UploadedHistory = Depends(get_upload_owned_by_user),
    db: Session = Depends(get_db)
):
    if upload.status == UploadStatus.PROCESSING and upload.updated_at:
        now = datetime.now(timezone.utc)

        updated_at_aware = upload.updated_at
        if updated_at_aware.tzinfo is None:
            updated_at_aware = updated_at_aware.replace(tzinfo=timezone.utc)
            # sqlalchemy sometimes returns naive datetimes, need to handle that

        delta = now - updated_at_aware

        if delta.total_seconds() > 300:  # 5 min timeout, somethings prob wrong if its been longer
            upload.status = UploadStatus.FAILED
            upload.error_message = "Processing timed out or crashed."
            db.commit()

    return StatusResponse(
        status=upload.status,
        error_message=upload.error_message
    )
