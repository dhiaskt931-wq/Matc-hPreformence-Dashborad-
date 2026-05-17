"""Simple file-based JSON cache with TTL in seconds.

Named TTL constants (use these instead of raw numbers):
  TTL_LIVE       =   60   —  1 minute  (live scores)
  TTL_TODAY      = 3600   —  1 hour    (today's matches)
  TTL_COMPLETED  = 86400  — 24 hours   (completed matches)
  TTL_HISTORICAL = 365 * 86400  — 1 year  (historical data, never changes)
"""
import json, hashlib, time
from pathlib import Path

_DIR = Path(__file__).parent.parent / "cache"
_DIR.mkdir(exist_ok=True)

# Named TTL constants (seconds)
TTL_LIVE       = 60
TTL_TODAY      = 3600
TTL_COMPLETED  = 86400
TTL_HISTORICAL = 365 * 86400

_MAX_CACHE_AGE_SECS = 30 * 86400  # 30 days — files older than this are pruned


def _paths(ns: str, key: str):
    h = hashlib.md5(f"{ns}|{key}".encode()).hexdigest()  # full 32-char hash
    base = _DIR / f"{ns}_{h}"
    return base.with_suffix(".json"), base.with_suffix(".meta.json")


def get(ns: str, key: str, ttl: int = TTL_COMPLETED):
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


def _cleanup():
    """Remove cache files older than 30 days. Runs once on module import."""
    try:
        now = time.time()
        removed = 0
        for meta_file in _DIR.glob("*.meta.json"):
            try:
                ts = json.loads(meta_file.read_text(encoding="utf-8")).get("ts", 0)
                if now - ts > _MAX_CACHE_AGE_SECS:
                    data_file = Path(str(meta_file).replace(".meta.json", ".json"))
                    if data_file.exists():
                        data_file.unlink(missing_ok=True)
                    meta_file.unlink(missing_ok=True)
                    removed += 1
            except Exception:
                continue
        if removed > 0:
            import logging
            logging.getLogger(__name__).info("Cache cleanup: removed %d expired files", removed)
    except Exception:
        pass


_cleanup()
