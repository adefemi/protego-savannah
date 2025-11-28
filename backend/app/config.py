from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Protego History API"
    app_version: str = "1.0.0"
    
    database_url: str
    
    cors_origins: str = "http://localhost:3000,chrome-extension://*"
    cors_credentials: bool = True
    cors_methods: str = "GET,POST,PUT,DELETE,OPTIONS"
    cors_headers: str = "*"
    
    max_url_length: int = 2048
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 3600
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def cors_methods_list(self) -> List[str]:
        """Parse CORS methods from comma-separated string"""
        return [method.strip() for method in self.cors_methods.split(",")]
    
    @property
    def cors_headers_list(self) -> List[str]:
        """Parse CORS headers from comma-separated string"""
        return [header.strip() for header in self.cors_headers.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

