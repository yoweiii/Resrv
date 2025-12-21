# backend/api/chat.py
import os
import json
import re
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from auth import current_user
from models import ChatSession, ChatMessage, User

router = APIRouter(prefix="/chat", tags=["chat"])

QUESTIONS = [
    {"key": "budget", "question": "嗨～你的預算大概落在哪個區間？請回覆我數字 例如：300 500 800", "type": "number"},
    {"key": "people", "question": "幾個人用餐？", "type": "number"},
    {"key": "area", "question": "想在哪個地區？ 例如 信義 大安 中山 或輸入捷運站", "type": "text"},
    {"key": "cuisine", "question": "想吃什麼類型？例如 日式 義式 火鍋 咖啡廳", "type": "text"},
    {"key": "occasion", "question": "這次是約會 聚餐 家庭 還是慶生？", "type": "text"},
]

# -----------------------------
# Gemini (A方案) 抽取 JSON
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def _extract_json(text: str) -> dict:
    """
    容錯：Gemini 可能回 ```json {...} ``` 或純 {...}
    """
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    raise ValueError("No JSON found in Gemini response")

def _try_parse_number(text: str) -> Optional[int]:
    digits = "".join([c for c in text if c.isdigit()])
    if not digits:
        return None
    try:
        return int(digits)
    except:
        return None

def _gemini_extract_prefs(user_message: str, current_prefs: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    回傳 dict: {budget, people, area, cuisine, occasion}（值可為 None）
    若沒設定 KEY 或套件不存在/呼叫失敗 → 回 None（讓系統 fallback）
    """
    if not GEMINI_API_KEY:
        return None

    try:
        import google.generativeai as genai
    except Exception:
        return None

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    prompt = f"""
你是一個餐廳推薦系統的需求抽取器
請從使用者輸入中 抽取並更新偏好
只能輸出 JSON 不能輸出任何多餘文字

欄位如下（缺漏用 null）：
{{
  "budget": number|null,
  "people": number|null,
  "area": string|null,
  "cuisine": string|null,
  "occasion": string|null
}}

規則：
- budget 取整數 例如 500
- people 取整數
- area/cuisine/occasion 用最短關鍵字
- 若使用者沒有提到某欄位 請回 null
- 若目前偏好已有值 且使用者沒有明確推翻 請回 null（代表不修改）

目前已知偏好：
{json.dumps(current_prefs, ensure_ascii=False)}

使用者輸入：
{user_message}
""".strip()

    resp = model.generate_content(prompt)
    data = _extract_json(resp.text)

    # 只保留允許欄位
    return {
        "budget": data.get("budget", None),
        "people": data.get("people", None),
        "area": data.get("area", None),
        "cuisine": data.get("cuisine", None),
        "occasion": data.get("occasion", None),
    }

# -----------------------------
# Schemas
# -----------------------------
class ChatStartResponse(BaseModel):
    session_id: str
    reply: str
    stage: str  # collecting | recommend

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

class RecommendationFilter(BaseModel):
    budget: Optional[int] = None
    people: Optional[int] = None
    area: Optional[str] = None
    cuisine: Optional[str] = None
    occasion: Optional[str] = None

class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    stage: str
    filters: Optional[RecommendationFilter] = None

# -----------------------------
# Helpers
# -----------------------------
def _next_question(prefs: Dict[str, Any]):
    for q in QUESTIONS:
        if prefs.get(q["key"]) in (None, "", 0):
            return q
    return None

def _append_message(db: Session, session_row: ChatSession, role: str, content: str):
    msg = ChatMessage(session_id_fk=session_row.id, role=role, content=content)
    db.add(msg)

def _fallback_fill_one_answer(user_text: str, prefs: Dict[str, Any]) -> Optional[str]:
    """
    若 Gemini 不可用，就回到你原本的逐題問答方式：
    將這次 user_text 填進「目前缺的那個欄位」
    填成功回 None；填失敗回需要提示的 reply
    """
    q = _next_question(prefs)
    if not q:
        return None

    key = q["key"]
    if q["type"] == "number":
        num = _try_parse_number(user_text)
        if num is None:
            return "我沒抓到數字 你可以回我一個數字就好 例如 500"
        prefs[key] = num
    else:
        prefs[key] = user_text.strip()

    return None

# -----------------------------
# Routes
# -----------------------------
@router.post("/start", response_model=ChatStartResponse)
def start_chat(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    sid = uuid.uuid4().hex
    prefs = {"budget": None, "people": None, "area": None, "cuisine": None, "occasion": None}

    session_row = ChatSession(
        user_id=user.id,
        session_id=sid,
        prefs=prefs,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(session_row)
    db.commit()
    db.refresh(session_row)

    q = _next_question(session_row.prefs)
    reply = q["question"] if q else "你想吃什麼 我可以幫你推薦"

    _append_message(db, session_row, "bot", reply)
    db.commit()

    return ChatStartResponse(session_id=sid, reply=reply, stage="collecting")


@router.post("/message", response_model=ChatMessageResponse)
def send_message(
    payload: ChatMessageRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    session_row = (
        db.query(ChatSession)
        .filter(ChatSession.session_id == payload.session_id, ChatSession.user_id == user.id)
        .first()
    )
    if not session_row:
        raise HTTPException(status_code=404, detail="session not found")

    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="empty message")

    # 先存使用者訊息
    _append_message(db, session_row, "user", user_text)

    prefs = dict(session_row.prefs or {})

    # 1) 先用 Gemini 抽取 JSON（A方案）
    extracted = None
    try:
        extracted = _gemini_extract_prefs(user_text, prefs)
    except Exception:
        extracted = None

    if extracted:
        # 合併：Gemini 回 None 的欄位不改
        for k, v in extracted.items():
            if v is None:
                continue
            if k in ("budget", "people"):
                # Gemini 有時會回 "600元" 字串，這裡保底轉 int
                if isinstance(v, int):
                    prefs[k] = v
                elif isinstance(v, str):
                    n = _try_parse_number(v)
                    if n is not None:
                        prefs[k] = n
            else:
                if isinstance(v, str) and v.strip():
                    prefs[k] = v.strip()

    # 2) 若 Gemini 不可用或抽不出東西 → fallback 用原本逐題填
    if not extracted:
        hint = _fallback_fill_one_answer(user_text, prefs)
        if hint:
            # 更新 prefs + 回提示
            session_row.prefs = prefs
            session_row.updated_at = datetime.utcnow()
            db.add(session_row)
            _append_message(db, session_row, "bot", hint)
            db.commit()
            return ChatMessageResponse(
                session_id=session_row.session_id,
                reply=hint,
                stage="collecting",
            )

    # 3) 存回 DB
    session_row.prefs = prefs
    session_row.updated_at = datetime.utcnow()
    db.add(session_row)
    db.commit()
    db.refresh(session_row)

    # 4) 缺欄位就追問
    next_q = _next_question(prefs)
    if next_q:
        reply = next_q["question"]
        _append_message(db, session_row, "bot", reply)
        db.commit()
        return ChatMessageResponse(
            session_id=session_row.session_id,
            reply=reply,
            stage="collecting",
        )

    # 5) 全齊 → recommend（回 filters 給前端用 restaurants.js 篩）
    reply = "收到 我幫你整理成推薦條件了"
    _append_message(db, session_row, "bot", reply)
    db.commit()

    return ChatMessageResponse(
        session_id=session_row.session_id,
        reply=reply,
        stage="recommend",
        filters=RecommendationFilter(**prefs),
    )
