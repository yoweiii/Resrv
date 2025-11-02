import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

_engine = None
_SessionLocal = None


def init_engine():
    global _engine, _SessionLocal
    if _engine is not None:
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("Missing environment variable: DATABASE_URL")

    # For Neon/Supabase etc.
    connect_args = {"sslmode": "require"} if "sslmode=" not in db_url else {}

    _engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def get_engine():
    init_engine()
    return _engine


def get_db() -> Generator:
    if _SessionLocal is None:
        init_engine()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
