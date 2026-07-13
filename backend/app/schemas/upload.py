from pydantic import BaseModel


class UploadResponse(BaseModel):
    upload_id: str
    entry_count: int
    status: str
    message: str
