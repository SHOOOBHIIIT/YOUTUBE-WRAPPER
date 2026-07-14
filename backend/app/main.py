import logging
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401 -- this import is needed even tho it looks unused
from app.routers import health, auth, upload, status, wrapped

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YouTube Wrapped API",
    description="Backend API for YouTube Wrapped — personalized YouTube history analysis.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_tables():
    # create tables on startup, runs once and thats it
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    # create_all only creates NEW tables, doesnt add columns to existing ones
    # so we need this manual migration until we set up alembic or whatever
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE wrapped_results ADD COLUMN IF NOT EXISTS clustering_skipped_reason VARCHAR"))
        conn.commit()
    logger.info("Database tables ready.")

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(status.router, prefix="/api", tags=["Status"])
app.include_router(wrapped.router, prefix="/api/wrapped", tags=["Wrapped"])
