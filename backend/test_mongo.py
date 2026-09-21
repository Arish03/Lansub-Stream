
import asyncio
from app.mongo import test_mongodb


async def main():
    result = await test_mongodb()
    print("MongoDB connection successful!")
    print(result)


asyncio.run(main())