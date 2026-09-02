import json
import logging
import time
from typing import Any, Optional
import redis

from app.core.config import get_settings

logger = logging.getLogger("techsahaya.redis")


class EphemeralStore:
    """
    Ephemeral in-memory / Redis key-value store with strict TTL.
    Raw bytes are NEVER stored. Derived structured OCR fields (e.g. age, income hint)
    are retained strictly for short TTL (e.g. 5 minutes) and purged thereafter.
    """

    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None
        self._memory_cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._init_redis()

    def _init_redis(self) -> None:
        settings = get_settings()
        try:
            r = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            r.ping()
            self._redis = r
            logger.info("Connected to Redis ephemeral store at %s", settings.redis_url)
        except Exception as exc:
            logger.info("Redis unavailable (%s); using in-memory ephemeral store with TTL", exc)
            self._redis = None

    def set(self, key: str, data: dict[str, Any], ttl_seconds: int = 300) -> bool:
        if self._redis:
            try:
                self._redis.setex(key, ttl_seconds, json.dumps(data))
                return True
            except Exception as exc:
                logger.warning("Redis setex failed (%s); writing to ephemeral memory fallback", exc)

        self._memory_cache[key] = (time.time() + ttl_seconds, data)
        return True

    def get(self, key: str) -> Optional[dict[str, Any]]:
        if self._redis:
            try:
                raw = self._redis.get(key)
                if raw:
                    return json.loads(raw)
                return None
            except Exception as exc:
                logger.warning("Redis get failed (%s); checking memory fallback", exc)

        if key in self._memory_cache:
            expires_at, data = self._memory_cache[key]
            if time.time() < expires_at:
                return data
            del self._memory_cache[key]
        return None

    def delete(self, key: str) -> bool:
        deleted = False
        if self._redis:
            try:
                self._redis.delete(key)
                deleted = True
            except Exception:
                pass
        if key in self._memory_cache:
            del self._memory_cache[key]
            deleted = True
        return deleted


ephemeral_store = EphemeralStore()
