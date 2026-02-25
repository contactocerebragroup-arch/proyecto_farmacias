import os
from sqlalchemy import create_url, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Handle Vercel SQLite path (root is read-only)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("VERCEL_ENV"):
        DATABASE_URL = "sqlite:////tmp/prices.db" # 4 slashes for absolute path
    else:
        DATABASE_URL = "sqlite:///prices.db"

# Fix for Render/Neon and SQLAlchemy (psycopg2)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
