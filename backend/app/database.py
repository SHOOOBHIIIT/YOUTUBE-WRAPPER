from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
# pool_pre_ping so Neon scale-to-zero doesnt hand us a zombie connection

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# autocommit=False and autoflush=False, the fastapi tutorial recommended this

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
