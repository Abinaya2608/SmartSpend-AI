
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "development-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-jwt-secret")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
