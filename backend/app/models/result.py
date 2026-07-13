
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class WrappedResult(Base):
    __tablename__ = "wrapped_results"

    id = Column(String, primary_key=True)           # UUID
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    upload_id = Column(String, ForeignKey("uploaded_histories.id"), nullable=False)
    top_channels = Column(JSON, nullable=True)      # Populated in M3
    genre_breakdown = Column(JSON, nullable=True)
    binge_sessions = Column(JSON, nullable=True)    # Populated in M3
    temporal_heatmap = Column(JSON, nullable=True)  # Populated in M3
    taste_drift = Column(JSON, nullable=True)
    clustering_skipped_reason = Column(String, nullable=True)  # populated if clustering was skipped or failed
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="results")
    upload = relationship("UploadedHistory", backref="result")
