"""Smoke tests — verify endpoints return expected shapes without crashing."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert "status" in body
    assert "checks" in body


def test_competitions_returns_list():
    r = client.get("/api/competitions")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_available_features_statsbomb():
    r = client.get("/api/match/3869685/available-features")
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "statsbomb"
    assert "features" in data
    assert data["features"]["pass-network"] == "full"


def test_available_features_understat():
    r = client.get("/api/match/50000001/available-features")
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "understat"
    assert data["features"]["pass-network"] == "unavailable"


def test_live_leagues_returns_list():
    r = client.get("/api/live/leagues")
    assert r.status_code == 200
    leagues = r.json()
    assert isinstance(leagues, list)
    assert len(leagues) > 0


def test_invalid_match_id_returns_error():
    r = client.get("/api/match/999999999999")
    assert r.status_code in (404, 500)


def test_find_match_endpoint():
    r = client.get("/api/find-match?home_team=Argentina&away_team=France&date=2022-12-18")
    assert r.status_code == 200
    data = r.json()
    assert "found" in data


def test_health_checks_keys():
    r = client.get("/health")
    assert r.status_code == 200
    checks = r.json()["checks"]
    assert "statsbomb_index" in checks
    assert "cache_dir" in checks


def test_matches_list_structure():
    r = client.get("/api/matches?competition_id=43&season_id=106")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        item = data[0]
        for key in ["match_id", "home_team", "away_team", "home_score", "away_score", "match_date"]:
            assert key in item, f"Missing key: {key}"


def test_available_features_fdo():
    r = client.get("/api/match/600000001/available-features")
    assert r.status_code == 200
    data = r.json()
    assert data["source"] == "football-data.org"


def test_invalid_match_id_zero():
    r = client.get("/api/match/0")
    assert r.status_code == 422


def test_invalid_match_id_negative():
    r = client.get("/api/match/-1")
    assert r.status_code == 422


def test_invalid_league_id():
    r = client.get("/api/live/scoreboard?league_id=../../etc/passwd")
    assert r.status_code == 422
