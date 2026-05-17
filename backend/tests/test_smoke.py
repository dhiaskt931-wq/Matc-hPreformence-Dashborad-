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
