# main.py
import logging, traceback                                       # ✅ 新增
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse                      # ✅ 新增
from starlette.requests import Request                           # ✅ 新增

from database import Base, init_engine, get_engine              # ← 確定用 get_engine
import models
import auth

# ===== App =====
app = FastAPI()  # 也可以 app = FastAPI(debug=True) 方便顯示錯誤訊息

# ===== Logging（讓 Vercel Logs 能看到） =====
logging.basicConfig(level=logging.INFO)

# ✅ 全域錯誤攔截，將 traceback 打到 Logs
@app.exception_handler(Exception)
async def _unhandled_error(request: Request, exc: Exception):
    logging.error("Unhandled error at %s %s", request.method, request.url.path)
    logging.error("Exception: %s", exc)
    logging.error("Traceback:\n%s", traceback.format_exc())
    # 回傳簡單 JSON（避免瀏覽器把 500 誤判為 CORS）
    return JSONResponse({"detail": "internal_error", "error": str(exc)}, status_code=500)

# ===== CORS =====
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://resrv.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ===== Health =====
@app.get("/")
def root():
    return {"msg": "Backend running successfully!"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return {}, 204

# ✅ DB 健檢：確認連線與權限正常
from sqlalchemy import text
@app.get("/health/db")
def health_db():
    init_engine()
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}

# ===== Startup：初始化並建表 =====
@app.on_event("startup")
def on_startup():
    init_engine()
    Base.metadata.create_all(bind=get_engine())

# ===== Routers =====
app.include_router(auth.router)

# ===== OpenAPI（Bearer 預設）=====
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
