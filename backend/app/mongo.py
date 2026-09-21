
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# MongoDB client
mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)

# Lansub database
mongo_db = mongo_client[settings.MONGODB_DB]

# Users collection
users_collection = mongo_db["users"]


async def test_mongodb():
    result = await mongo_db.command("ping")
    return result