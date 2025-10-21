from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "Protego History API"
    app_version: str = "1.0.0"
    
    database_url: str = "postgresql://protego:protego123@db:5432/protego"
    
    cors_origins: List[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

