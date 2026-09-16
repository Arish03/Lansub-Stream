import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect("postgresql://lansub:lansub@172.27.252.246:5432/lansub")
        val = await conn.fetchval("SELECT 1")
        print(f"Success on WSL IP! val={val}")
        await conn.close()
    except Exception as e:
        print(f"Failed on WSL IP: {e}")

asyncio.run(test())
