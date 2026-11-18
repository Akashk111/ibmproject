import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# On serverless hosts like Vercel, root filesystem is read-only except /tmp
_default_sqlite_path = (
    "/tmp/mangaluru_bus.db"
    if os.environ.get("VERCEL")
    else os.path.join(BASE_DIR, "..", "mangaluru_bus.db")
)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "mangaluru-bus-connect-super-secret-key-2025")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        f"sqlite:///{_default_sqlite_path}"
    )
    # Fix for Postgres URLs in Render/Heroku (postgres:// -> postgresql://)
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET = os.environ.get("JWT_SECRET", "jwt-secret-mangaluru-city-transit")
    JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", 72))
