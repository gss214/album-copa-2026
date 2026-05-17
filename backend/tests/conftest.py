from __future__ import annotations
# ruff: noqa: E402  — env vars must be set before any backend import
import os
import tempfile

_tmp_fd, _DB_PATH = tempfile.mkstemp(suffix="_test.db")
os.close(_tmp_fd)

os.environ["DATABASE_URL"] = f"sqlite:///{_DB_PATH}"
os.environ["APP_USERNAME"] = "testuser"
os.environ["APP_PASSWORD"] = "testpass"
os.environ["JWT_SECRET"] = "test-secret-key"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

import models
from database import SessionLocal, get_db
from main import app  # triggers create_all and migration on the test DB
from auth import create_token

# Single client, no context manager — avoids running the startup seed.
_http = TestClient(app, raise_server_exceptions=True)


@pytest.fixture(autouse=True)
def _wipe_stickers():
    """Truncate stickers before each test for full isolation."""
    db = SessionLocal()
    db.query(models.Sticker).delete()
    db.commit()
    db.close()


@pytest.fixture
def db() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db: Session):
    """HTTP client with get_db overridden to use the test session."""
    app.dependency_overrides[get_db] = lambda: db
    yield _http
    app.dependency_overrides.clear()


@pytest.fixture
def raw_client():
    """HTTP client without DB override — for auth tests."""
    yield _http


@pytest.fixture
def token() -> str:
    return create_token("testuser")


@pytest.fixture
def h(token: str) -> dict[str, str]:
    """Auth headers shorthand."""
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sticker_factory(db: Session):
    """Returns a factory that inserts stickers with sensible defaults."""
    def _make(**kwargs) -> models.Sticker:
        defaults: dict = {
            "code": "BRA1",
            "section_code": "BRA",
            "section_name": "Brasil",
            "group_name": "Grupo E",
            "number": "1",
            "quantity": 0,
            "sort_order": 100,
            "player_name": "Rodrygo",
        }
        defaults.update(kwargs)
        s = models.Sticker(**defaults)
        db.add(s)
        db.commit()
        db.refresh(s)
        return s
    return _make


def pytest_sessionfinish(session, exitstatus):
    import os as _os
    try:
        _os.unlink(_DB_PATH)
    except OSError:
        pass
