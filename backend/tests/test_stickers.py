from __future__ import annotations


def test_list_stickers_empty(client, h):
    r = client.get("/api/stickers", headers=h)
    assert r.status_code == 200
    assert r.json() == []


def test_list_stickers(client, sticker_factory, h):
    sticker_factory(code="BRA1", group_name="Grupo E")
    sticker_factory(code="ARG1", section_code="ARG", section_name="Argentina",
                    group_name="Grupo A", number="1", sort_order=200)
    codes = [s["code"] for s in client.get("/api/stickers", headers=h).json()]
    assert "BRA1" in codes
    assert "ARG1" in codes


def test_list_stickers_filter_group(client, sticker_factory, h):
    sticker_factory(code="BRA1", group_name="Grupo E")
    sticker_factory(code="ARG1", section_code="ARG", section_name="Argentina",
                    group_name="Grupo A", number="1", sort_order=200)
    codes = [s["code"] for s in client.get("/api/stickers?group_name=Grupo E", headers=h).json()]
    assert "BRA1" in codes
    assert "ARG1" not in codes


def test_sticker_status_field(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    sticker_factory(code="BRA2", number="2", quantity=2, sort_order=101)
    stickers = {s["code"]: s for s in client.get("/api/stickers", headers=h).json()}
    assert stickers["BRA1"]["status"] == "Falta"
    assert stickers["BRA2"]["status"] == "Tenho"


# ── PATCH /stickers/{code} ───────────────────────────────────────────────────

def test_update_sticker(client, sticker_factory, h):
    sticker_factory(code="BRA1")
    r = client.patch("/api/stickers/BRA1", json={"quantity": 3}, headers=h)
    assert r.status_code == 200
    assert r.json()["quantity"] == 3
    assert r.json()["status"] == "Tenho"


def test_update_sticker_to_zero(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=2)
    r = client.patch("/api/stickers/BRA1", json={"quantity": 0}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "Falta"


def test_update_sticker_not_found(client, h):
    r = client.patch("/api/stickers/INEXISTENTE", json={"quantity": 1}, headers=h)
    assert r.status_code == 404


def test_update_sticker_negative_quantity(client, sticker_factory, h):
    sticker_factory(code="BRA1")
    r = client.patch("/api/stickers/BRA1", json={"quantity": -1}, headers=h)
    assert r.status_code == 400


# ── PATCH /stickers/bulk ─────────────────────────────────────────────────────

def test_bulk_update(client, sticker_factory, h):
    sticker_factory(code="BRA1")
    sticker_factory(code="BRA2", number="2", sort_order=101)
    r = client.patch("/api/stickers/bulk",
                     json={"items": [{"code": "BRA1", "quantity": 2},
                                     {"code": "BRA2", "quantity": 1}]},
                     headers=h)
    assert r.status_code == 200
    data = r.json()
    assert data["updated"] == 2
    assert data["not_found"] == []


def test_bulk_update_partial_not_found(client, sticker_factory, h):
    sticker_factory(code="BRA1")
    r = client.patch("/api/stickers/bulk",
                     json={"items": [{"code": "BRA1", "quantity": 1},
                                     {"code": "FANTASMA99", "quantity": 1}]},
                     headers=h)
    assert r.status_code == 200
    data = r.json()
    assert data["updated"] == 1
    assert "FANTASMA99" in data["not_found"]


def test_bulk_update_empty_list(client, h):
    r = client.patch("/api/stickers/bulk", json={"items": []}, headers=h)
    assert r.status_code == 400


# ── GET /summary ─────────────────────────────────────────────────────────────

def test_summary(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=1)
    sticker_factory(code="BRA2", number="2", quantity=0, sort_order=101)
    sticker_factory(code="BRA3", number="3", quantity=3, sort_order=102)
    data = client.get("/api/summary", headers=h).json()
    assert data["total"] == 3
    assert data["coladas"] == 2
    assert data["faltam"] == 1
    assert data["repetidas"] == 2  # BRA3: quantity=3 → 2 extras


def test_summary_excludes_raras(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=1)
    sticker_factory(code="RARA1", section_code="R1", section_name="Rara",
                    group_name="Raras", number="Ouro", quantity=0, sort_order=999)
    data = client.get("/api/summary", headers=h).json()
    assert data["total"] == 1


def test_summary_percentual(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=1)
    sticker_factory(code="BRA2", number="2", quantity=1, sort_order=101)
    sticker_factory(code="BRA3", number="3", quantity=0, sort_order=102)
    sticker_factory(code="BRA4", number="4", quantity=0, sort_order=103)
    data = client.get("/api/summary", headers=h).json()
    assert data["percentual"] == 50.0


# ── GET /trocas ──────────────────────────────────────────────────────────────

def test_trocas(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    sticker_factory(code="BRA2", number="2", quantity=1, sort_order=101)
    sticker_factory(code="BRA3", number="3", quantity=3, sort_order=102)
    data = client.get("/api/trocas", headers=h).json()
    assert "BRA1" in data["faltam"]
    assert "BRA2" not in data["faltam"]
    assert any("BRA3" in rep for rep in data["repetidas"])
    assert not any("BRA2" in rep for rep in data["repetidas"])


def test_trocas_repetidas_format(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=4)
    data = client.get("/api/trocas", headers=h).json()
    # Formato esperado: "BRA1 (3x)"
    assert data["repetidas"] == ["BRA1 (3x)"]
