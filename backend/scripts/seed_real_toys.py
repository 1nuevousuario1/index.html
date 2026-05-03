"""Script to add real popular toys to the Mundo Infantil catalog."""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv("/app/backend/.env")

REAL_TOYS = [
    # Peppa Pig (del PDF)
    {"name": "Peppa Pig Vehículo Whizz-Around", "description": "Set de vehículo whizz-around con figura de Peppa Pig. Rueda libre y diversión garantizada.", "price": 16.99, "category": "Personajes", "age_range": "0-3", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800&q=80"},
    {"name": "Peppa Pig Casa Familiar Deluxe", "description": "Casa de juguete de Peppa Pig con 4 figuras incluidas y accesorios.", "price": 49.99, "category": "Juegos de Rol", "age_range": "0-3", "discount_percent": 10, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=800&q=80"},

    # Dora la Exploradora (del PDF)
    {"name": "Dora la Exploradora Figura Clásica", "description": "Figura articulada de Dora con mochila y accesorios.", "price": 12.99, "category": "Figuras", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1599689018034-48e2ead82951?w=800&q=80"},
    {"name": "Dora & Friends - Set 3 Figuras", "description": "Pack de Dora, Botas y Swiper. Para crear aventuras juntos.", "price": 24.99, "category": "Figuras", "age_range": "4-7", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1607734834519-d8576ae60ea4?w=800&q=80"},

    # LEGO
    {"name": "LEGO City Policía Set 301 piezas", "description": "Set de construcción LEGO City con estación de policía, 3 minifiguras y vehículo.", "price": 79.99, "category": "Construcción", "age_range": "4-7", "discount_percent": 15, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80"},
    {"name": "LEGO Classic Caja Creativa", "description": "Caja grande con 790 piezas LEGO de varios colores. Creatividad sin límites.", "price": 59.99, "category": "Construcción", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1558877385-8c1a19c4b4bd?w=800&q=80"},
    {"name": "LEGO Duplo Tren Grande", "description": "Tren LEGO Duplo con vías, perfecto para los más pequeños.", "price": 89.99, "category": "Construcción", "age_range": "0-3", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1611113232117-e5fe2f03867b?w=800&q=80"},

    # Barbie
    {"name": "Muñeca Barbie Fashionistas", "description": "Barbie con vestido de moda y accesorios. Incluye zapatos y bolso.", "price": 19.99, "category": "Muñecas", "age_range": "4-7", "discount_percent": 20, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1617303467204-fdc8aad83a8c?w=800&q=80"},
    {"name": "Barbie Casa de Ensueño", "description": "Casa de 3 pisos con muebles, piscina y ascensor. Para horas de juego.", "price": 179.99, "category": "Juegos de Rol", "age_range": "4-7", "discount_percent": 10, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80"},

    # Hot Wheels
    {"name": "Hot Wheels Pack 10 Autos", "description": "Colección de 10 autos Hot Wheels a escala. Diferentes modelos y colores.", "price": 22.99, "category": "Vehículos", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&q=80"},
    {"name": "Hot Wheels Pista Mega Loop", "description": "Pista de carreras con doble loop y 2 autos incluidos.", "price": 44.99, "category": "Vehículos", "age_range": "4-7", "discount_percent": 15, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1568805499062-c1a3c6d44cf2?w=800&q=80"},

    # Paw Patrol
    {"name": "Paw Patrol Torre de Vigilancia", "description": "Base principal de la Patrulla Canina con luces, sonidos y 2 figuras.", "price": 89.99, "category": "Juegos de Rol", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1625571070050-4c25fc9a3d52?w=800&q=80"},
    {"name": "Paw Patrol Figura Chase con Vehículo", "description": "Figura de Chase con su camioneta de rescate. Luces y sonidos.", "price": 24.99, "category": "Personajes", "age_range": "0-3", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1591375372223-b4a5869f5bd1?w=800&q=80"},

    # Play-Doh
    {"name": "Play-Doh Kit Pastelería", "description": "Set completo de plastilina con moldes de pastelería. 10 colores incluidos.", "price": 29.99, "category": "Arte", "age_range": "4-7", "discount_percent": 10, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800&q=80"},
    {"name": "Play-Doh Mega Pack 24 Botes", "description": "Megapack de 24 botes de Play-Doh en colores variados.", "price": 34.99, "category": "Arte", "age_range": "4-7", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1503945438517-f65904a52ce6?w=800&q=80"},

    # Nerf
    {"name": "Nerf Elite Pistola Disruptor", "description": "Pistola Nerf de dardos con tambor giratorio. Incluye 6 dardos.", "price": 39.99, "category": "Acción", "age_range": "8+", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80"},

    # Mickey Mouse
    {"name": "Peluche Mickey Mouse Gigante", "description": "Peluche gigante de Mickey Mouse de 80cm. Suave y seguro.", "price": 49.99, "category": "Peluches", "age_range": "0-3", "discount_percent": 20, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1578091879915-76a3c3d2c4a6?w=800&q=80"},

    # Frozen
    {"name": "Muñeca Elsa Frozen Cantante", "description": "Muñeca de Elsa con vestido brillante que canta 'Let it Go'.", "price": 34.99, "category": "Muñecas", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?w=800&q=80"},

    # Spider-Man
    {"name": "Figura Spider-Man Articulada 30cm", "description": "Figura de acción de Spider-Man con 15 puntos de articulación.", "price": 27.99, "category": "Figuras", "age_range": "4-7", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800&q=80"},

    # Rubik's Cube
    {"name": "Cubo Rubik 3x3 Profesional", "description": "Cubo de Rubik original 3x3. Mecanismo suave y preciso.", "price": 14.99, "category": "Didácticos", "age_range": "8+", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1591991564021-0662a8573199?w=800&q=80"},

    # Funko Pop
    {"name": "Funko Pop Batman Coleccionable", "description": "Figura coleccionable Funko Pop de Batman. Edición especial.", "price": 16.99, "category": "Figuras", "age_range": "8+", "discount_percent": 0, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1608889335941-32ac5f2041b9?w=800&q=80"},

    # Monopoly
    {"name": "Monopoly Clásico Edición Familiar", "description": "Juego de mesa Monopoly en su versión clásica. 2-8 jugadores.", "price": 32.99, "category": "Juegos de Mesa", "age_range": "8+", "discount_percent": 10, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800&q=80"},

    # Slime
    {"name": "Slime Kit Unicornio con Glitter", "description": "Kit para crear slime con 6 colores, brillos y toppings.", "price": 19.99, "category": "Arte", "age_range": "8+", "discount_percent": 15, "featured": False,
     "image_url": "https://images.unsplash.com/photo-1620148091195-c04d3bf2b8e5?w=800&q=80"},

    # Uno
    {"name": "UNO Cartas Clásico", "description": "Juego de cartas UNO original. Para 2-10 jugadores.", "price": 9.99, "category": "Juegos de Mesa", "age_range": "4-7", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=800&q=80"},

    # Fisher-Price
    {"name": "Fisher-Price Mesa de Actividades", "description": "Mesa interactiva con luces, música y 10+ actividades para bebés.", "price": 54.99, "category": "Bebés", "age_range": "0-3", "discount_percent": 0, "featured": True,
     "image_url": "https://images.unsplash.com/photo-1559454403-b8fb88521f38?w=800&q=80"},
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    added = 0
    skipped = 0
    for t in REAL_TOYS:
        existing = await db.products.find_one({"name": t["name"]})
        if existing:
            skipped += 1
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "stock": 50,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **t,
        }
        await db.products.insert_one(doc)
        added += 1
    total = await db.products.count_documents({})
    print(f"Added: {added}, Skipped (duplicates): {skipped}, Total products now: {total}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
