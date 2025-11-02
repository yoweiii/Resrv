
import os
from typing import Generator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from database import Base, init_engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import models
import auth


_engine = None
_SessionLocal = None

def _init_db_if_needed():
    global _engine, _SessionLocal
    if _engine is not None:
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:

        raise RuntimeError("Missing env var: DATABASE_URL")

    connect_args = {"sslmode": "require"} if "sslmode=" not in db_url else {}
    _engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


    models.Base.metadata.create_all(bind=_engine)

def get_db() -> Generator:
    _init_db_if_needed()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://resrv.vercel.app",   
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://resrv(-[a-z0-9-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
def root():
    return {"msg": "Backend running successfully!"}

@app.get("/favicon.ico")
def favicon():
    return {}, 204

@app.on_event("startup")
def startup_event():
    init_engine()             
    Base.metadata.create_all(bind=_engine) 

app.include_router(auth.router)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Resrv API",
        version="1.0.0",
        description="Resrv authentication and restaurant APIs",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
