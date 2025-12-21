
import os
import json
import re
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def _extract_json(text: str):
    """
    Gemini 偶爾會包 ```json ... ```，這裡做容錯抽取
    """

    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
        
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))

    raise ValueError("No JSON found")

def extract_prefs_with_gemini(user_message: str, current_prefs: dict) -> dict:
    """
    回傳：符合 schema 的 prefs（缺的用 null）
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("Missing GEMINI_API_KEY")

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
- 若目前偏好已有值，且使用者沒有明確推翻，保持原值（回 null 代表不改）

目前已知偏好是：
{json.dumps(current_prefs, ensure_ascii=False)}

使用者輸入是：
{user_message}
""".strip()

    resp = model.generate_content(prompt)
    data = _extract_json(resp.text)

    out = {
        "budget": data.get("budget", None),
        "people": data.get("people", None),
        "area": data.get("area", None),
        "cuisine": data.get("cuisine", None),
        "occasion": data.get("occasion", None),
    }
    return out
