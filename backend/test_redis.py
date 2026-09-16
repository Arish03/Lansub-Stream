import asyncio
import redis.asyncio as aioredis

async def test():
    for host in ["localhost", "127.0.0.1", "172.27.252.246"]:
        try:
            r = aioredis.from_url(f"redis://{host}:6379/0")
            pong = await r.ping()
            print(f"Redis success on {host}: {pong}")
            await r.close()
        except Exception as e:
            print(f"Redis failed on {host}: {e}")

asyncio.run(test())
