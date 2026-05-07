"""Delete all products and seed 61 placeholder products from PDF pages."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

BACKEND_URL = os.environ.get("PUBLIC_BACKEND_URL", "")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # Delete all products
    res = await db.products.delete_many({})
    print(f"Deleted {res.deleted_count} products")

    # Create 61 placeholder products from PDF pages
    added = 0
    for i in range(1, 62):
        page_num = f"{i:02d}"
        doc = {
            "id": str(uuid.uuid4()),
            "name": f"Juguete #{i}",
            "description": "",
            "price": 0.0,
            "image_url": f"/api/static/products/page-{page_num}.jpg",
            "category": "Sin categoría",
            "age_range": "0-3",
            "stock": 0,
            "discount_percent": 0,
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.products.insert_one(doc)
        added += 1

    total = await db.products.count_documents({})
    print(f"Added: {added}, Total products now: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
