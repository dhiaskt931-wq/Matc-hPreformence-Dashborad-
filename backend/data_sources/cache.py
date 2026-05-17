"""Simple file-based JSON cache with TTL."""
import json, hashlib, time
from pathlib import Path

_DIR = Path(__file__).parent.parent / "cache"
_DIR.mkdir(exist_ok=True)


def _paths(ns: str, key: str):
    h = hashlib.md5(f"{ns}|{key}".encode()).hexdigest()[:14]
    base = _DIR / f"{ns}_{h}"
    return base.with_suffix(".json"), base.with_suffix(".meta.json")


def get(ns: str, key: str, ttl: int = 86400):
    data_p, meta_p = _paths(ns, key)
    if not data_p.exists():
        return None
    if meta_p.exists():
        ts = json.loads(meta_p.read_text(encoding="utf-8")).get("ts", 0)
        if time.time() - ts > ttl:
            return None
    return json.loads(data_p.read_text(encoding="utf-8"))


def put(ns: str, key: str, data):
    data_p, meta_p = _paths(ns, key)
    data_p.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    meta_p.write_text(json.dumps({"ts": time.time()}), encoding="utf-8")
