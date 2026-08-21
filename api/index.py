import sys
import os

# Add Backend folder to Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Vercel entrypoint
app = app
