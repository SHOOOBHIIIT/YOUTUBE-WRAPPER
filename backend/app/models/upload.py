from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class UploadStatus:
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class UploadedHistory(Base):
    __tablename__ = "uploaded_histories"

    id = Column(String, primary_key=True)           # UUID generated on upload
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    raw_entry_count = Column(Integer, nullable=True) # Populated after parsing
    parsed_events = Column(JSON, nullable=True)      # Stored immediately after parsing

    # User's local timezone (e.g. 'America/New_York') for accurate temporal analysis
    timezone = Column(String, default="UTC")

    status = Column(String, default=UploadStatus.PROCESSING, nullable=False)
    error_message = Column(String, nullable=True)    # Set on failure

    user = relationship("User", backref="uploads")
