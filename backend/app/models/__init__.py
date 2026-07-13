# models/__init__.py — import all models here so SQLAlchemy sees them
from app.models.user import User
from app.models.upload import UploadedHistory
from app.models.result import WrappedResult
from app.models.cache import VideoMetadataCache
