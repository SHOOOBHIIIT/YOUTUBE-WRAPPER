from sqlalchemy import Column, String, DateTime, func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)          # NextAuth user ID (UUID)
    google_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    image = Column(String, nullable=True)           # Profile picture URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
