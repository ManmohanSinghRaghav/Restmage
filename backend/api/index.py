import sys
from pathlib import Path

# Add the parent directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

# Vercel serverless function handler
handler = app
