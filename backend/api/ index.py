try:
    from ..main import app   # 推薦：backend/ 和 backend/api/ 都有 __init__.py
except ImportError:
    from main import app  
