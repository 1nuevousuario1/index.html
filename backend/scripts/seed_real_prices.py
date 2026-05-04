"""Delete all products and seed with real names + prices from user's PDF."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

BACKEND_URL = "https://jugueteria-pro.preview.emergentagent.com"

# Cleaned list of real products from PDF (name + price)
REAL_PRODUCTS = [
    # Page 1
    ("Disney Princess & Frozen Shoe & Tiara Bundle", 250),
    ("Rompecabezas Foamy Paw Patrol", 160),
    ("Batman Bat VHC con Vehículo", 420),
    ("Mi Primer Bolsa de Gimnasio Spin Master", 250),
    ("Mario 5in Figura Surtido 10 Modelos", 140),
    ("Baby Alive Pretend Shampoo Snuggle Blond Harper", 420),
    ("Super Mario 4\" Figuras W45", 240),
    ("Encanto Luisa Madrigal Muñeca", 50),
    ("Peppa Pig Vehículo Pequeño Surtido", 200),

    # Page 2
    ("Play-Doh Airplane Explorer Starter Set", 340),
    ("Rompecabezas de Tubo Gabby", 170),
    ("Paw Patrol Vehículos de Lujo Die Cast", 120),
    ("Baby Alive Rainbow Spa Baby Blonde", 420),
    ("Nerf SOA Flip Fill", 250),
    ("Mi Villano Favorito 4 Goo Jit Zu Minions", 280),
    ("Serpientes y Escaleras Spin Master", 220),
    ("Peppa Pig Best Friends Set", 160),
    ("Smooshees Figura Luvzees", 220),

    # Page 3
    ("Crayola Unicorn Magic", 100),
    ("Crayola Perlitas Magic", 120),
    ("Cabeza de Peinados Elsa Disney Frozen", 700),
    ("Play-Doh Photo Fun Set", 250),
    ("Dora Mochila Interactiva", 480),
    ("Miraculous Peluche Tikki Fluffy", 250),
    ("Goo Jit Zu One Piece Figura de Acción", 300),
    ("Figuras Surtidas Dora", 80),
    ("Carrito de Dulces de Dora", 700),

    # Page 4
    ("Set de 10 Juegos Deluxe Spin Master", 700),
    ("Miniplayset Surtido Dora", 180),
    ("Rompecabezas Sonido 8 Pcs Granja", 380),
    ("Sonic 4\" Figuras Articuladas con Accesorios", 250),
    ("Rompecabezas Magnético 16 Pcs Helados", 380),
    ("Miraculous Ladybug Roleplay Surtido", 285),
    ("Star Wars 4D Build Palacio de Jabba", 300),
    ("Juego de Memoria Dora", 160),
    ("Goo Jit Zu Vehículo Goo Sonic", 200),

    # Page 5
    ("Set de Bloques Speed Car Surtido", 140),
    ("Pokémon Clip N Go Pokébola Set", 300),
    ("Dora Backpack 3 en 1 Puzzle Sólido", 250),
    ("Paw Patrol RC 1:24 Radiocontrol", 450),
    ("Peluche Paw Patrol Everest Hora de Dormir", 500),
    ("Cubo de Actividades", 350),
    ("Goo Jit Zu Figura de Acción Surtido", 280),
    ("Play-Doh Care Carry Kit Veterinario", 340),
    ("Play-Doh Picnic Set", 700),

    # Page 6
    ("Play-Doh Imagina Actividades Escolares", 650),
    ("Play-Doh Tools Underwater", 280),
    ("Vamos a Pescar Spin Master", 220),
    ("Bathtime Sirenita Ariel Disney", 560),
    ("Nerf Elite 2.0 Slash", 85),
    ("Pinocchio Pinocho Muñeco", 650),
    ("Headbanz Dora Jr", 250),
    ("Cubo Rubik 3x3 Batman y Joker", 450),
    ("Cubers Rubik Disney Mickey", 250),

    # Page 7
    ("Star Wars Phantom Feature Toy", 320),
    ("Egg Ina Boomables Kittyfly", 1000),
    ("Super Mario Mini Figura G (2x1)", 120),
    ("Set de Bloques Red Fire Force Robot", 120),
    ("Cubo Rubik Roll 5 en 1", 180),
    ("Pokémon 1 Figura Pack Surtido", 250),

    # Page 8
    ("Mario Galaxy Mini Figura con Accesorios", 220),
    ("Mario Galaxy 2.5\" Figura con Vehículo", 450),
    ("The Simpsons 2.5\" Scale Family Multipack", 400),
    ("The Simpsons 2.5\" Krusty The Clown Multipack", 400),
    ("Paw Patrol Estación de Bomberos", 1000),
    ("Smooshees Figura Cutezees 3.5\"", 200),

    # Page 9
    ("Peppa Pig Juego del Tren de Rebecca", 640),
    ("Peppa Pig Pista de Carro Rojo", 640),
    ("Peppa Pig Everyday Experiences", 420),
    ("Rompecabezas Madera Dora", 280),
    ("Mario Galaxy Novelty Yoyo Lumas", 180),
    ("Mario Galaxy Figura Bowser Jr", 600),
    ("Buzón Ruz", 320),
    ("Kaz 4 Fig My Hero Academia Froppy S6", 280),

    # Page 10
    ("Kaz 4 Fig Solo Jinwoo S1", 280),
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # Delete all products
    res = await db.products.delete_many({})
    print(f"Deleted {res.deleted_count} products")

    # Use PDF1 images cycling through available pages (1-61)
    added = 0
    for i, (name, price) in enumerate(REAL_PRODUCTS):
        # Cycle through PDF page images
        img_num = (i % 61) + 1
        page_num = f"{img_num:02d}"

        doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "description": "",
            "price": float(price),
            "image_url": f"{BACKEND_URL}/api/static/products/page-{page_num}.jpg",
            "category": "Sin categoría",
            "age_range": "Todas",
            "stock": 10,
            "discount_percent": 0,
            "featured": i < 8,  # first 8 as featured
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.products.insert_one(doc)
        added += 1

    total = await db.products.count_documents({})
    print(f"Added: {added}, Total products now: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
