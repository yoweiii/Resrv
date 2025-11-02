from vercel_asgi import VercelASGI
from ..main import app  

handler = VercelASGI(app)
