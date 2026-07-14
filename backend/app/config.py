from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    youtube_api_key: str = ""
    nextauth_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    hf_api_token: str = ""  # hf token, replaces 730mb of pytorch with an api call lol

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_url.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
