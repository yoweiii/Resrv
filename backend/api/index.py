from fastapi import APIRouter
from api.chat import router as chat_router
from auth import router as auth_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(chat_router)
