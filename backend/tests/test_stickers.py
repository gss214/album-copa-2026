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


# ── GET /logs ─────────────────────────────────────────────────────────────────

def test_logs_empty(client, h):
    r = client.get("/api/logs", headers=h)
    assert r.status_code == 200
    assert r.json() == []


def test_patch_creates_log(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    client.patch("/api/stickers/BRA1", json={"quantity": 1}, headers=h)
    logs = client.get("/api/logs", headers=h).json()
    assert len(logs) == 1
    assert logs[0]["sticker_code"] == "BRA1"
    assert logs[0]["quantity_before"] == 0
    assert logs[0]["quantity_after"] == 1
    assert logs[0]["created_at"].endswith("Z")


def test_patch_no_log_when_same_quantity(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=2)
    client.patch("/api/stickers/BRA1", json={"quantity": 2}, headers=h)
    logs = client.get("/api/logs", headers=h).json()
    assert logs == []


def test_bulk_creates_logs(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    sticker_factory(code="BRA2", number="2", quantity=1, sort_order=101)
    client.patch("/api/stickers/bulk",
                 json={"items": [{"code": "BRA1", "quantity": 3},
                                 {"code": "BRA2", "quantity": 1}]},  # BRA2 unchanged
                 headers=h)
    logs = client.get("/api/logs", headers=h).json()
    codes = [entry["sticker_code"] for entry in logs]
    assert "BRA1" in codes
    assert "BRA2" not in codes  # quantity unchanged → no log


def test_logs_descending_order(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    client.patch("/api/stickers/BRA1", json={"quantity": 1}, headers=h)
    client.patch("/api/stickers/BRA1", json={"quantity": 2}, headers=h)
    logs = client.get("/api/logs", headers=h).json()
    assert len(logs) == 2
    assert logs[0]["quantity_after"] == 2
    assert logs[1]["quantity_after"] == 1


def test_logs_limit(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    for q in range(1, 4):
        client.patch("/api/stickers/BRA1", json={"quantity": q}, headers=h)
    logs = client.get("/api/logs?limit=2", headers=h).json()
    assert len(logs) == 2


def test_logs_limit_invalid(client, h):
    assert client.get("/api/logs?limit=0", headers=h).status_code == 422
    assert client.get("/api/logs?limit=501", headers=h).status_code == 422


# ── POST /stickers/clear-repeated ────────────────────────────────────────────

def test_clear_repeated(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=3)
    sticker_factory(code="BRA2", number="2", quantity=1, sort_order=101)
    sticker_factory(code="BRA3", number="3", quantity=0, sort_order=102)
    r = client.post("/api/stickers/clear-repeated", headers=h)
    assert r.status_code == 200
    assert r.json()["cleared"] == 1  # only BRA1 had qty > 1
    stickers = {s["code"]: s for s in client.get("/api/stickers", headers=h).json()}
    assert stickers["BRA1"]["quantity"] == 1
    assert stickers["BRA2"]["quantity"] == 1  # unchanged
    assert stickers["BRA3"]["quantity"] == 0  # unchanged


def test_clear_repeated_creates_logs(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=4)
    client.post("/api/stickers/clear-repeated", headers=h)
    logs = client.get("/api/logs", headers=h).json()
    assert len(logs) == 1
    assert logs[0]["sticker_code"] == "BRA1"
    assert logs[0]["quantity_before"] == 4
    assert logs[0]["quantity_after"] == 1


def test_clear_repeated_empty(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=1)
    r = client.post("/api/stickers/clear-repeated", headers=h)
    assert r.status_code == 200
    assert r.json()["cleared"] == 0


# ── GET /stats ───────────────────────────────────────────────────────────────

def test_stats_most_repeated_and_progress(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=1)
    sticker_factory(code="BRA2", number="2", quantity=4, sort_order=101)
    sticker_factory(code="BRA3", number="3", quantity=0, sort_order=102)
    data = client.get("/api/stats", headers=h).json()
    assert data["most_repeated"]["code"] == "BRA2"
    assert data["most_repeated"]["quantity"] == 4
    groups = {g["group"]: g for g in data["group_progress"]}
    assert groups["Grupo E"]["coladas"] == 2
    assert groups["Grupo E"]["total"] == 3


def test_stats_top_and_bottom_teams(client, sticker_factory, h):
    # Time A (Grupo E): 2/2 coladas → completo, não entra em top (incompletos)
    sticker_factory(code="BRA1", quantity=1)
    sticker_factory(code="BRA2", number="2", quantity=1, sort_order=101)
    # Time B (Grupo A): 1/2 → 50%
    sticker_factory(code="ARG1", section_code="ARG", section_name="Argentina",
                    group_name="Grupo A", number="1", quantity=1, sort_order=200)
    sticker_factory(code="ARG2", section_code="ARG", section_name="Argentina",
                    group_name="Grupo A", number="2", quantity=0, sort_order=201)
    # Time C (Grupo B): 0/2 → 0% (mais longe)
    sticker_factory(code="CHI1", section_code="CHI", section_name="Chile",
                    group_name="Grupo B", number="1", quantity=0, sort_order=300)
    sticker_factory(code="CHI2", section_code="CHI", section_name="Chile",
                    group_name="Grupo B", number="2", quantity=0, sort_order=301)
    data = client.get("/api/stats", headers=h).json()
    top_codes = [t["section_code"] for t in data["top_teams"]]
    bottom_codes = [t["section_code"] for t in data["bottom_teams"]]
    # incompletos ordenados por % desc: Argentina (50%) antes de Chile (0%)
    assert top_codes[0] == "ARG"
    assert "BRA" not in top_codes  # completo não entra
    # mais longe primeiro
    assert bottom_codes[0] == "CHI"


def test_stats_excludes_fwc_and_cocacola_from_teams(client, sticker_factory, h):
    sticker_factory(code="ARG1", section_code="ARG", section_name="Argentina",
                    group_name="Grupo A", number="1", quantity=0, sort_order=200)
    sticker_factory(code="FWC00", section_code="FWC", section_name="Página Inicial",
                    group_name="FWC", number="00", quantity=0, sort_order=1)
    sticker_factory(code="CC1", section_code="CC", section_name="Coca-Cola",
                    group_name="Coca-Cola", number="1", quantity=0, sort_order=900)
    data = client.get("/api/stats", headers=h).json()
    codes = [t["section_code"] for t in data["bottom_teams"]]
    assert "ARG" in codes
    assert "FWC" not in codes
    assert "CC" not in codes


# ── GET /stats/activity ──────────────────────────────────────────────────────

def test_activity_empty(client, h):
    data = client.get("/api/stats/activity", headers=h).json()
    assert data["today_coladas"] == 0
    assert data["today_descoladas"] == 0
    assert data["total_events"] == 0
    assert data["last_activity"] is None
    assert data["days_to_complete"] is None


def test_activity_counts_coladas_and_descoladas(client, sticker_factory, h):
    sticker_factory(code="BRA1", quantity=0)
    # colada (0→1)
    client.patch("/api/stickers/BRA1", json={"quantity": 1}, headers=h)
    # vira repetida (1→2) — não conta como colada nem descolada
    client.patch("/api/stickers/BRA1", json={"quantity": 2}, headers=h)
    # descolada (2→0)
    client.patch("/api/stickers/BRA1", json={"quantity": 0}, headers=h)
    data = client.get("/api/stats/activity", headers=h).json()
    assert data["today_coladas"] == 1
    assert data["today_descoladas"] == 1
    assert data["week_coladas"] == 1
    assert data["week_descoladas"] == 1
    assert data["total_events"] == 3
    assert data["last_activity"].endswith("Z")
