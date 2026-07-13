from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    youtube_api_key: str = ""
    nextauth_secret: str = ""
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
