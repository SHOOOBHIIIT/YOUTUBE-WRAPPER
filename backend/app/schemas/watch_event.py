from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WatchEvent(BaseModel):
    video_id: Optional[str]
    title: str
    channel_name: Optional[str]
    timestamp: datetime
