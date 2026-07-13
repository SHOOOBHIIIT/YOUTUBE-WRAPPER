from sqlalchemy import Column, String, DateTime, Integer, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


# TTL: cache entries older than 30 days are treated as stale and re-fetched.
# This is enforced in the enrichment service (M2), not at the DB level.
VIDEO_METADATA_TTL_DAYS = 30


class VideoMetadataCache(Base):
    __tablename__ = "video_metadata_cache"

    video_id = Column(String, primary_key=True)     # YouTube video ID
    
    # is_available tracks tombstones for videos silently omitted by YouTube API 
    # (e.g. private, deleted). Must be explicitly set by youtube_api.py. 
    # Never rely on the True default in manual fixes/migrations.
    is_available = Column(Boolean, default=True, nullable=False)
    
    category = Column(String, nullable=True)        # YouTube category ID (int as string)
    duration_seconds = Column(Integer, nullable=True)
    tags = Column(String, nullable=True)            # Comma-separated tags
    fetched_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Embedding cache for M4 clustering. Keyed by (video_id, title_hash) to
    # detect stale embeddings if the video title changes on re-fetch.
    # Embedding is a 384-dimensional float list from all-MiniLM-L6-v2.
    embedding = Column(JSONB, nullable=True)
    title_hash = Column(String(64), nullable=True)  # SHA-256 hash of the title text used to generate this embedding

