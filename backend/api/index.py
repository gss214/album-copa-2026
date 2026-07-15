import pathlib
import sys

# Make the backend package root importable (database, models, main, routers, ...).
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from main import app  # noqa: E402,F401
