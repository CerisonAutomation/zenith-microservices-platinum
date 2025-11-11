"""
Zenith Cache Module
Redis-based caching with fallback to in-memory cache
"""

import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from contextlib import asynccontextmanager

from .config import settings

logger = logging.getLogger(__name__)

class CacheClient:
    """Unified cache client with Redis and in-memory fallback"""

    def __init__(self):
        self.redis_client = None
        self.memory_cache = {}
        self.enabled = True

    async def init(self) -> None:
        """Initialize cache client"""
        try:
            self.redis_client = redis.from_url(settings.redis_url)
            await self.redis_client.ping()
            logger.info("Redis cache initialized successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed, using memory cache: {e}")
            self.redis_client = None

    async def close(self) -> None:
        """Close cache connections"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis cache connection closed")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled:
            return None

        try:
            if self.redis_client:
                value = await self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                return self.memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        if not self.enabled:
            return False

        try:
            if self.redis_client:
                serialized_value = json.dumps(value)
                if ttl:
                    await self.redis_client.setex(key, ttl, serialized_value)
                else:
                    await self.redis_client.set(key, serialized_value)
                return True
            else:
                self.memory_cache[key] = value
                return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled:
            return False

        try:
            if self.redis_client:
                return bool(await self.redis_client.delete(key))
            else:
                return bool(self.memory_cache.pop(key, None))
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.enabled:
            return False

        try:
            if self.redis_client:
                return bool(await self.redis_client.exists(key))
            else:
                return key in self.memory_cache
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    async def clear(self) -> bool:
        """Clear all cache"""
        if not self.enabled:
            return False

        try:
            if self.redis_client:
                await self.redis_client.flushdb()
            else:
                self.memory_cache.clear()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False

# Global cache instance
cache_client: Optional[CacheClient] = None
"""Unified cache client with Redis and in-memory fallback"""

@asynccontextmanager
async def lifespan_cache():
    """Cache lifespan context manager"""
    global cache_client
    cache_client = CacheClient()
    await cache_client.init()
    try:
        yield
    finally:
        if cache_client:
            await cache_client.close()

# Convenience functions
async def get_cache(key: str) -> Optional[Any]:
    """Get value from global cache"""
    if cache_client:
        return await cache_client.get(key)
    return None

async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in global cache"""
    if cache_client:
        return await cache_client.set(key, value, ttl)
    return False

async def delete_cache(key: str) -> bool:
    """Delete value from global cache"""
    if cache_client:
        return await cache_client.delete(key)
    return False

async def exists_cache(key: str) -> bool:
    """Check if key exists in global cache"""
    if cache_client:
        return await cache_client.exists(key)
    return False

async def clear_cache() -> bool:
    """Clear all global cache"""
    if cache_client:
        return await cache_client.clear()
    return False