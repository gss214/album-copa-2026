from __future__ import annotations


def test_login_success(raw_client):
    r = raw_client.post("/api/login", json={"username": "testuser", "password": "testpass"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(raw_client):
    r = raw_client.post("/api/login", json={"username": "testuser", "password": "errada"})
    assert r.status_code == 401


def test_login_wrong_username(raw_client):
    r = raw_client.post("/api/login", json={"username": "hacker", "password": "testpass"})
    assert r.status_code == 401


def test_stickers_without_token(raw_client):
    r = raw_client.get("/api/stickers")
    assert r.status_code == 403


def test_stickers_with_invalid_token(raw_client):
    r = raw_client.get("/api/stickers", headers={"Authorization": "Bearer token.invalido.aqui"})
    assert r.status_code == 401
