"""Update the 61 products with real names and prices, matching PDF page order."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

BACKEND_URL = os.environ.get("PUBLIC_BACKEND_URL", "")

# (page_number, name, price) — exactly as user provided
PRODUCTS = [
    (1,  "Figura Surtida Dora", 80),
    (2,  "Smooshees Figure Luvzees", 200),
    (3,  "Goo Jit Zu Figura de Acción Surtido", 280),
    (4,  "Super Mario 4\" Figures W45", 240),
    (5,  "Peppa Pig Vehículo Pequeño Surtido", 200),
    (6,  "GJC Vehículo Goo Sonic", 200),
    (7,  None, 0),  # Sin Artículo
    (8,  "Disney Princess & Frozen Shoe & Tiara Bundle", 250),
    (9,  "Encanto Luisa Madrigal", 50),
    (10, "KPZ Dora Backpack 3 en 1 Puzzle Sólido", 250),
    (11, "Sonic 4\" Articulated Figures W/Accy Wave 20", 250),
    (12, "Rompecabezas Foamy Paw Patrol", 160),
    (13, None, 0),  # Sin Artículo
    (14, "Vamos a Pescar - Spin Master", 220),
    (15, "Cubo 3x3 Batman y Joker Rubik (Oferta)", 450),
    (16, "Paw Patrol Vehículos de Lujo Die Cast", 120),
    (17, "Play-Doh Airplane Explorer Starter Set", 340),
    (18, "Crayola Unicorn Magic", 100),
    (19, "Carrito de Dulces de Dora", 700),
    (20, "Play-Doh Care Carry Kit Veterinario", 340),
    (21, "KPZ Dora Backpack 3 en 1 Puzzle Sólido", 250),
    (22, "Bat VHC Batman y Vehículo", 420),
    (23, "Rompecabezas de Tubo Gabby", 170),
    (24, "Miraculous Ladybug Roleplay Surtido", 285),
    (25, "Pinocchio Pinocho Doll", 650),
    (26, "Baby Alive Rainbow Spa Baby Blonde", 420),
    (27, "Baby Alive Pretend Shampoo Snuggle Blonde Harper", 420),
    (28, "Mi Villano Favorito 4 Goo Jit Zu Minions", 280),
    (29, None, 0),  # Sin Artículo
    (30, "Peppa Pig Best Friends", 160),
    (31, "Peppa Pig Best Friends", 160),
    (32, "Star Wars 4D Build Palacio de Jabba", 300),
    (33, "Star Wars 4D Build Palacio de Jabba", 300),
    (34, "Bathtime Sirenita Ariel F25 5L Box", 560),
    (35, "Cabeza de Peinados Elsa Disney Frozen", 700),
    (36, "Goo Jit Zu One Piece Figura de Acción", 300),
    (37, "Mario 5\" Surtido 10 Modelos", 140),
    (38, "Super Mario 4\" Figures W45 (s/caja)", 240),
    (39, "Promoción 2x1: Compra 1 caja, Regalo 2da", 120),
    (40, "Cubo de Actividades", 350),
    (41, "Nerf Elite 2.0 Slash", 85),
    (42, "Peppa Pig Pista de Carro Rojo", 640),
    (43, "Star Wars Phantom Feature Toy", 320),
    (44, "Star Wars Force & Telling", 320),
    (45, "Mario Galaxy Novelty Yoyo Lumas (c/12)", 180),
    (46, "Mario Galaxy Novelty Yoyo Lumas (caja con 6)", 850),
    (47, "Mario Galaxy Novelty Yoyo Lumas (c/12)", 180),
    (48, "Mario Galaxy Feature Fig Bowser Jr", 600),
    (49, "Mario Galaxy Mini Figura W/Feat Accy Surtido", 220),
    (50, "KAZ 4 Fig My Hero Academia Froppy S6", 280),
    (51, "KAZ 4 Fig Solo Jinwoo S1", 280),
    (52, "Paw Patrol Estación de Bomberos", 1000),
    (53, "Peppa Pig Everyday Experiences", 420),
    (54, "Peppa Pig Everyday Experiences", 420),
    (55, "Cubo Rubik Roll 5 en 1", 180),
    (56, "Buzón", 320),
    (57, "Buzón", 320),
    (58, "Buzón", 320),
    (59, "Play-Doh Photo Fun Set", 250),
    (60, "The Simpsons 2.5\" Krusty the Clown Multipack", 400),
    (61, "The Simpsons 2.5\" Family Multipack", 400),
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # Delete all
    res = await db.products.delete_many({})
    print(f"Deleted {res.deleted_count} products")

    added = 0
    skipped = 0
    for page_num, name, price in PRODUCTS:
        # Skip "Sin Artículo"
        if name is None:
            skipped += 1
            continue

        page_str = f"{page_num:02d}"
        doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": "",
            "price": float(price),
            "image_url": f"/api/static/products/page-{page_str}.jpg",
            "category": "Sin categoría",
            "age_range": "Todas",
            "stock": 10,
            "discount_percent": 0,
            "featured": added < 8,  # first 8 visible products are featured
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.products.insert_one(doc)
        added += 1

    total = await db.products.count_documents({})
    print(f"Added: {added}, Skipped (Sin Artículo): {skipped}, Total: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
