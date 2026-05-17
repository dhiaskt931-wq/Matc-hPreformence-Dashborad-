"""Unit tests for the file-based JSON cache module."""
import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from data_sources import cache


def test_put_and_get(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "_DIR", tmp_path)
    cache.put("ns", "key1", {"value": 42})
    result = cache.get("ns", "key1", ttl=3600)
    assert result == {"value": 42}


def test_ttl_expiry(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "_DIR", tmp_path)
    cache.put("ns", "key_ttl", {"x": 1})
    # ttl=0 means always expired
    result = cache.get("ns", "key_ttl", ttl=0)
    assert result is None


def test_miss_returns_none(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "_DIR", tmp_path)
    result = cache.get("ns", "nonexistent_key_xyz", ttl=3600)
    assert result is None


def test_cleanup_removes_old(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "_DIR", tmp_path)
    # Write a cache entry with a very old timestamp
    data_p, meta_p = cache._paths("ns", "old_key")
    data_p.write_text(json.dumps({"stale": True}), encoding="utf-8")
    meta_p.write_text(json.dumps({"ts": 0.0}), encoding="utf-8")  # epoch = very old
    assert meta_p.exists()
    cache._cleanup()
    assert not meta_p.exists()


def test_namespace_isolation(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "_DIR", tmp_path)
    cache.put("ns_a", "shared_key", {"from": "a"})
    cache.put("ns_b", "shared_key", {"from": "b"})
    assert cache.get("ns_a", "shared_key", ttl=3600) == {"from": "a"}
    assert cache.get("ns_b", "shared_key", ttl=3600) == {"from": "b"}
