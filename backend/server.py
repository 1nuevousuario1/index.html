from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

# ------------------ DB ------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ------------------ App ------------------
app = FastAPI(title="Mundo Infantil API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


# ------------------ Models ------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str
    points: int = 0
    tier: str = "Bronce"


class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    image_url: str
    category: str
    age_range: str
    stock: int = 100
    discount_percent: int = 0
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str
    age_range: str
    stock: int = 100
    discount_percent: int = 0
    featured: bool = False


class CartItem(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    origin_url: str


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    items: List[dict]
    subtotal: float
    total: float
    points_earned: int = 0
    status: str = "pending"  # pending, paid, processing, shipped, delivered, cancelled
    payment_status: str = "initiated"  # initiated, paid, failed, expired
    session_id: Optional[str] = None
    shipping_address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ------------------ Helpers ------------------
def compute_tier(points: int) -> str:
    if points >= 500:
        return "Oro"
    if points >= 100:
        return "Plata"
    return "Bronce"


def user_to_public(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "role": u.get("role", "customer"),
        "points": u.get("points", 0),
        "tier": compute_tier(u.get("points", 0)),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol admin")
    return user


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=7 * 24 * 3600, path="/",
    )


# ------------------ Auth routes ------------------
@api_router.post("/auth/register")
async def register(payload: UserRegister, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "points": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id, email, "customer")
    set_auth_cookie(response, token)
    return {"user": user_to_public(user_doc), "token": token}


@api_router.post("/auth/login")
async def login(payload: UserLogin, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token(user["id"], email, user.get("role", "customer"))
    set_auth_cookie(response, token)
    return {"user": user_to_public(user), "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


# ------------------ Product routes ------------------
@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, age_range: Optional[str] = None, featured: Optional[bool] = None):
    q = {}
    if category:
        q["category"] = category
    if age_range:
        q["age_range"] = age_range
    if featured is not None:
        q["featured"] = featured
    items = await db.products.find(q, {"_id": 0}).to_list(500)
    return items


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    return p


@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, admin: dict = Depends(require_admin)):
    prod = Product(**payload.model_dump())
    doc = prod.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return prod


@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductCreate, admin: dict = Depends(require_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Producto no encontrado")
    update = payload.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update})
    existing.update(update)
    return existing


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    await db.products.delete_one({"id": product_id})
    return {"ok": True}


# ------------------ Orders / Checkout ------------------
@api_router.post("/orders/checkout")
async def create_checkout(payload: OrderCreate, request: Request, user: dict = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(400, "El carrito está vacío")
    # Compute subtotal from server-side prices
    items_detailed = []
    subtotal = 0.0
    for item in payload.items:
        p = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(400, f"Producto {item.product_id} no encontrado")
        price = float(p["price"]) * (1 - p.get("discount_percent", 0) / 100)
        line_total = round(price * item.quantity, 2)
        subtotal += line_total
        items_detailed.append({
            "product_id": p["id"],
            "name": p["name"],
            "image_url": p["image_url"],
            "unit_price": round(price, 2),
            "quantity": item.quantity,
            "line_total": line_total,
        })
    subtotal = round(subtotal, 2)
    total = subtotal
    points_earned = int(total)

    order_id = str(uuid.uuid4())

    # Stripe
    host_url = payload.origin_url.rstrip("/")
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/cart"
    checkout_req = CheckoutSessionRequest(
        amount=float(total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": order_id, "user_id": user["id"]},
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "items": items_detailed,
        "subtotal": subtotal,
        "total": total,
        "points_earned": points_earned,
        "status": "pending",
        "payment_status": "initiated",
        "session_id": session.session_id,
        "shipping_address": payload.shipping_address,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)

    # Payment transaction record
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "order_id": order_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "amount": total,
        "currency": "usd",
        "payment_status": "initiated",
        "status": "initiated",
        "metadata": {"order_id": order_id, "user_id": user["id"]},
        "points_credited": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id, "order_id": order_id}


@api_router.get("/orders/status/{session_id}")
async def order_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transacción no encontrada")

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    try:
        status_resp: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        # Stripe may not have the session ready immediately, or test key limitation
        return {
            "status": tx.get("status", "pending"),
            "payment_status": tx.get("payment_status", "initiated"),
            "order_id": tx["order_id"],
            "amount": tx["amount"],
            "note": "pending",
        }

    # Update payment transaction
    new_status = status_resp.status
    new_payment_status = status_resp.payment_status

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": new_status, "payment_status": new_payment_status}}
    )

    # If paid and points not yet credited, credit them now
    if new_payment_status == "paid" and not tx.get("points_credited", False):
        order = await db.orders.find_one({"id": tx["order_id"]}, {"_id": 0})
        if order:
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {"payment_status": "paid", "status": "processing"}}
            )
            await db.users.update_one(
                {"id": order["user_id"]},
                {"$inc": {"points": order.get("points_earned", 0)}}
            )
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"points_credited": True}}
            )

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "order_id": tx["order_id"],
        "amount": tx["amount"],
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {e}")

    if event.payment_status == "paid":
        tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
        if tx and not tx.get("points_credited", False):
            order = await db.orders.find_one({"id": tx["order_id"]}, {"_id": 0})
            if order:
                await db.orders.update_one(
                    {"id": order["id"]},
                    {"$set": {"payment_status": "paid", "status": "processing"}}
                )
                await db.users.update_one(
                    {"id": order["user_id"]},
                    {"$inc": {"points": order.get("points_earned", 0)}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"points_credited": True, "payment_status": "paid", "status": "complete"}}
                )
    return {"received": True}


@api_router.get("/orders/mine")
async def my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders


# ------------------ Admin ------------------
@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(require_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders


@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, status: str = Query(...), admin: dict = Depends(require_admin)):
    allowed = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in allowed:
        raise HTTPException(400, "Estado inválido")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(404, "Pedido no encontrado")
    return {"ok": True}


@api_router.get("/admin/reports/sales")
async def admin_sales_report(admin: dict = Depends(require_admin)):
    pipeline = [
        {"$match": {"payment_status": "paid"}},
    ]
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    total_sales = sum(o.get("total", 0) for o in orders)
    total_orders = len(orders)
    # Sales by day (last 14 days)
    daily = {}
    for o in orders:
        d = o["created_at"][:10] if isinstance(o["created_at"], str) else o["created_at"].isoformat()[:10]
        daily[d] = daily.get(d, 0) + o.get("total", 0)
    by_day = [{"date": k, "sales": round(v, 2)} for k, v in sorted(daily.items())]

    # Top products
    product_sales = {}
    for o in orders:
        for it in o.get("items", []):
            pid = it["product_id"]
            product_sales.setdefault(pid, {"name": it["name"], "quantity": 0, "revenue": 0})
            product_sales[pid]["quantity"] += it["quantity"]
            product_sales[pid]["revenue"] += it["line_total"]
    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    # Customer count
    total_customers = await db.users.count_documents({"role": "customer"})

    return {
        "total_sales": round(total_sales, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "by_day": by_day,
        "top_products": top_products,
    }


@api_router.get("/admin/customers")
async def admin_customers(admin: dict = Depends(require_admin)):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(500)
    for u in users:
        u["tier"] = compute_tier(u.get("points", 0))
    return users


# ------------------ Seeding ------------------
SEED_PRODUCTS = [
    {
        "name": "Oso de Peluche Clásico",
        "description": "Adorable oso de peluche suave y seguro. Perfecto para abrazos y siestas.",
        "price": 24.99, "category": "Peluches", "age_range": "0-3",
        "image_url": "https://images.pexels.com/photos/10003874/pexels-photo-10003874.jpeg",
        "stock": 50, "discount_percent": 10, "featured": True,
    },
    {
        "name": "Set de Bloques de Construcción",
        "description": "200 bloques coloridos para estimular la creatividad y motricidad fina.",
        "price": 39.99, "category": "Construcción", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
        "stock": 30, "discount_percent": 0, "featured": True,
    },
    {
        "name": "Muñeca Princesa",
        "description": "Muñeca con vestido brillante y accesorios. Inspira juegos imaginativos.",
        "price": 19.99, "category": "Muñecas", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1741389570311-783e71b138db?w=800&q=80",
        "stock": 40, "discount_percent": 15, "featured": False,
    },
    {
        "name": "Auto Control Remoto Turbo",
        "description": "Auto rápido y resistente con control remoto. Alcanza 20 km/h.",
        "price": 54.99, "category": "Vehículos", "age_range": "8+",
        "image_url": "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&q=80",
        "stock": 20, "discount_percent": 0, "featured": True,
    },
    {
        "name": "Rompecabezas Mundo Animal",
        "description": "Rompecabezas de 100 piezas con ilustraciones de animales coloridos.",
        "price": 14.99, "category": "Didácticos", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1611604548018-d56bbd85d681?w=800&q=80",
        "stock": 60, "discount_percent": 0, "featured": False,
    },
    {
        "name": "Set de Arte y Pintura",
        "description": "Kit completo con pinturas, crayones, marcadores y papel para artistas.",
        "price": 29.99, "category": "Arte", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1503945438517-f65904a52ce6?w=800&q=80",
        "stock": 35, "discount_percent": 20, "featured": True,
    },
    {
        "name": "Dinosaurio Interactivo",
        "description": "Dinosaurio que ruge, camina y responde a tus toques. ¡Horas de diversión!",
        "price": 44.99, "category": "Interactivos", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&q=80",
        "stock": 25, "discount_percent": 0, "featured": False,
    },
    {
        "name": "Cocinita de Madera",
        "description": "Cocinita de madera sustentable con utensilios y alimentos de juguete.",
        "price": 89.99, "category": "Juegos de Rol", "age_range": "4-7",
        "image_url": "https://images.unsplash.com/photo-1558877385-8c1a19c4b4bd?w=800&q=80",
        "stock": 15, "discount_percent": 0, "featured": True,
    },
    {
        "name": "Sonajero Musical",
        "description": "Sonajero suave con melodías relajantes para los más pequeños.",
        "price": 12.99, "category": "Bebés", "age_range": "0-3",
        "image_url": "https://images.unsplash.com/photo-1596700006583-5c79fb8e6a13?w=800&q=80",
        "stock": 80, "discount_percent": 0, "featured": False,
    },
    {
        "name": "Pista de Tren Eléctrico",
        "description": "Tren eléctrico con 3 vagones, luces y sonidos. Incluye 5m de pista.",
        "price": 79.99, "category": "Vehículos", "age_range": "8+",
        "image_url": "https://images.unsplash.com/photo-1584824388878-699e5f3523cd?w=800&q=80",
        "stock": 12, "discount_percent": 10, "featured": True,
    },
    {
        "name": "Figuras de Superhéroes (Pack x5)",
        "description": "Pack de 5 figuras articuladas de superhéroes. ¡Crea tus aventuras!",
        "price": 34.99, "category": "Figuras", "age_range": "8+",
        "image_url": "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800&q=80",
        "stock": 40, "discount_percent": 0, "featured": False,
    },
    {
        "name": "Mesa de Actividades Bebé",
        "description": "Mesa interactiva con luces, sonidos y actividades educativas.",
        "price": 49.99, "category": "Bebés", "age_range": "0-3",
        "image_url": "https://images.unsplash.com/photo-1559454403-b8fb88521f38?w=800&q=80",
        "stock": 20, "discount_percent": 15, "featured": True,
    },
]


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mundoinfantil.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "points": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        if not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}}
            )

    # Seed products if empty
    count = await db.products.count_documents({})
    if count == 0:
        docs = []
        for p in SEED_PRODUCTS:
            prod = Product(**p)
            d = prod.model_dump()
            d["created_at"] = d["created_at"].isoformat()
            docs.append(d)
        await db.products.insert_many(docs)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ------------------ include & CORS ------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
