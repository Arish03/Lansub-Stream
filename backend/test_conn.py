import asyncio
import asyncpg

async def test():
    for host in ["localhost", "127.0.0.1", "::1"]:
        print(f"Trying host {host}...")
        try:
            conn = await asyncpg.connect(f"postgresql://lansub:lansub@{host}:5432/lansub")
            val = await conn.fetchval("SELECT 1")
            print(f"Success on {host}! val={val}")
            await conn.close()
            return
        except Exception as e:
            print(f"Failed on {host}: {e}")

asyncio.run(test())
