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
import requests
from fastapi import UploadFile, File, Header, Query as FQuery
from fastapi.responses import Response

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)
from fastapi.staticfiles import StaticFiles

# ------------------ DB ------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tz_aware=True)
db = client[os.environ['DB_NAME']]

# ------------------ App ------------------
app = FastAPI(title="Mundo Infantil API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

# ------------------ Object Storage ------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "mundo-infantil"
_storage_key = None


def init_storage():
    """Initialize storage session. Call once at startup."""
    global _storage_key
    if _storage_key:
        return _storage_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key:
        return None
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": emergent_key},
            timeout=30,
        )
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logging.warning(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to object storage."""
    key = init_storage()
    if not key:
        raise HTTPException(500, "Storage no disponible")
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
        if resp.status_code == 403:
            # session expired, retry
            global _storage_key
            _storage_key = None
            key = init_storage()
            resp = requests.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data,
                timeout=120,
            )
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError as e:
        raise HTTPException(500, f"Storage error: {e}")


def get_object(path: str):
    """Download file from object storage."""
    key = init_storage()
    if not key:
        raise HTTPException(500, "Storage no disponible")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global _storage_key
        _storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


# ------------------ Email notifications ------------------
RESEND_API_URL = "https://api.resend.com/emails"


def _format_order_email_html(order: dict) -> str:
    """Build HTML body for new-order email."""
    items_rows = "".join(
        f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">{it['name']}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{it['quantity']}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${it['unit_price']:.2f}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${it['line_total']:.2f}</td>
        </tr>
        """
        for it in order.get("items", [])
    )
    discount_row = ""
    if order.get("discount", 0) > 0:
        discount_row = f"""
        <tr>
          <td colspan="3" style="padding:8px;text-align:right;color:#6BCB77;">Descuento ({order.get('coupon_code', '')}):</td>
          <td style="padding:8px;text-align:right;color:#6BCB77;font-weight:bold;">−${order['discount']:.2f}</td>
        </tr>
        """
    created = order.get("created_at", "")
    if isinstance(created, str):
        try:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            created = created_dt.strftime("%d/%m/%Y %H:%M")
        except Exception:
            pass
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1F2937;">
      <h1 style="color:#4CAFEE;margin:0 0 8px;">🛍️ ¡Nuevo pedido pagado!</h1>
      <p style="color:#4B5563;margin:0 0 24px;">Pedido <strong>#{order['id'][:8]}</strong> · {created}</p>

      <h3 style="color:#FF6B6B;margin:24px 0 8px;">Datos del cliente</h3>
      <p style="margin:4px 0;"><strong>Nombre:</strong> {order.get('customer_name', '—')}</p>
      <p style="margin:4px 0;"><strong>Email:</strong> {order.get('customer_email', '—')}</p>
      <p style="margin:4px 0;"><strong>Teléfono:</strong> {order.get('customer_phone', '—')}</p>
      <p style="margin:4px 0;"><strong>Dirección de envío:</strong><br>{order.get('shipping_address', '—')}</p>

      <h3 style="color:#FF6B6B;margin:24px 0 8px;">Productos</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F9F9F9;">
            <th style="padding:8px;text-align:left;">Producto</th>
            <th style="padding:8px;text-align:center;">Cant.</th>
            <th style="padding:8px;text-align:right;">Unitario</th>
            <th style="padding:8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {items_rows}
          <tr>
            <td colspan="3" style="padding:8px;text-align:right;">Subtotal:</td>
            <td style="padding:8px;text-align:right;">${order.get('subtotal', 0):.2f}</td>
          </tr>
          {discount_row}
          <tr style="background:#4CAFEE;color:white;">
            <td colspan="3" style="padding:12px;text-align:right;font-size:16px;font-weight:bold;">TOTAL PAGADO:</td>
            <td style="padding:12px;text-align:right;font-size:16px;font-weight:bold;">${order.get('total', 0):.2f} MXN</td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top:32px;color:#4B5563;font-size:13px;">
        Entra al panel para procesar este pedido.<br>
        — Mundo Infantil
      </p>
    </div>
    """


async def notify_admin_new_order(order: dict):
    """Send email notification to all admins when a new order is paid.
    Best-effort: logs but does not raise on failure.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        logging.info("RESEND_API_KEY not set, skipping admin email notification")
        return
    raw_recipients = os.environ.get("ADMIN_NOTIFICATION_EMAILS", "")
    recipients = [e.strip() for e in raw_recipients.split(",") if e.strip()]
    if not recipients:
        logging.info("ADMIN_NOTIFICATION_EMAILS not set, skipping admin email")
        return
    from_email = os.environ.get("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    subject = f"🛍️ Nuevo pedido #{order['id'][:8]} - ${order.get('total', 0):.2f} MXN"
    html = _format_order_email_html(order)
    payload = {
        "from": from_email,
        "to": recipients,
        "subject": subject,
        "html": html,
        "reply_to": order.get("customer_email"),
    }
    try:
        resp = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=15,
        )
        if resp.status_code >= 400:
            logging.warning(f"Resend error {resp.status_code}: {resp.text}")
        else:
            logging.info(f"Notification email sent for order {order['id']} to {recipients}")
    except Exception as e:
        logging.warning(f"Resend request failed: {e}")


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
    customer_name: str = Field(min_length=1, max_length=100)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=1, max_length=20)
    shipping_address: str = Field(min_length=1)
    origin_url: str
    coupon_code: Optional[str] = None


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[dict]
    subtotal: float
    discount: float = 0.0
    coupon_code: Optional[str] = None
    total: float
    status: str = "pending"  # pending, paid, processing, shipped, delivered, cancelled
    payment_status: str = "initiated"  # initiated, paid, failed, expired
    session_id: Optional[str] = None
    shipping_address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ------------------ Coupon Models ------------------
class CouponCreate(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    description: Optional[str] = Field(default=None, max_length=200)
    discount_type: str = Field(pattern="^(percent|fixed)$")
    discount_value: float = Field(gt=0)
    min_purchase: Optional[float] = Field(default=None, ge=0)
    expires_at: Optional[datetime] = None
    usage_limit: Optional[int] = Field(default=None, ge=1)
    active: bool = True


class CouponValidate(BaseModel):
    code: str
    items: List[CartItem]


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
MAX_FAILED_ATTEMPTS = 5
ATTEMPT_WINDOW_MIN = 15
LOCKOUT_MIN = 30
GENERIC_AUTH_ERROR = "Credenciales inválidas"


def _client_ip(request: Request) -> str:
    """Best-effort client IP extraction, respecting common proxy headers."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "unknown"


async def _record_attempt(ip: str, email: str, success: bool, reason: str = ""):
    await db.login_attempts.insert_one({
        "id": str(uuid.uuid4()),
        "ip": ip,
        "email": email,
        "success": success,
        "reason": reason,
        "created_at": datetime.now(timezone.utc),
    })


async def _is_locked_out(ip: str) -> Optional[int]:
    """Returns remaining lockout seconds, or None if not locked out."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=ATTEMPT_WINDOW_MIN)
    failed = await db.login_attempts.count_documents({
        "ip": ip, "success": False, "created_at": {"$gte": window_start}
    })
    if failed < MAX_FAILED_ATTEMPTS:
        return None
    # Find oldest failed attempt inside the window — lockout valid until oldest_failed + LOCKOUT_MIN
    last_failed = await db.login_attempts.find(
        {"ip": ip, "success": False, "created_at": {"$gte": window_start}},
        {"_id": 0, "created_at": 1}
    ).sort("created_at", -1).to_list(1)
    if not last_failed:
        return None
    last_time = last_failed[0]["created_at"]
    unlock_at = last_time + timedelta(minutes=LOCKOUT_MIN)
    if unlock_at <= now:
        return None
    return int((unlock_at - now).total_seconds())


@api_router.post("/auth/login")
async def login(payload: UserLogin, request: Request, response: Response):
    email = payload.email.lower().strip()
    ip = _client_ip(request)

    # Brute force protection
    locked = await _is_locked_out(ip)
    if locked is not None:
        minutes = max(1, locked // 60)
        await _record_attempt(ip, email, False, "locked_out")
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos. Intenta de nuevo en {minutes} minuto(s).",
        )

    user = await db.users.find_one({"email": email})
    if not user or user.get("role") != "admin" or not verify_password(payload.password, user["password_hash"]):
        await _record_attempt(ip, email, False, "invalid_credentials")
        raise HTTPException(status_code=401, detail=GENERIC_AUTH_ERROR)

    await _record_attempt(ip, email, True, "ok")
    token = create_access_token(user["id"], email, user.get("role", "admin"))
    set_auth_cookie(response, token)
    return {"user": user_to_public(user), "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=10, max_length=128)


@api_router.post("/auth/change-password")
async def change_password(payload: PasswordChange, request: Request, response: Response, user: dict = Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.current_password, full["password_hash"]):
        await _record_attempt(_client_ip(request), user["email"], False, "wrong_current_password")
        raise HTTPException(status_code=401, detail=GENERIC_AUTH_ERROR)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(payload.new_password)}}
    )
    # Force re-login by clearing cookie
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/admin/audit-log")
async def admin_audit_log(admin: dict = Depends(require_admin)):
    """Last 100 login attempts (success and failed). Admin-only."""
    rows = await db.login_attempts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rows


# ------------------ Image Upload (Admin) ------------------
ALLOWED_IMG_EXT = {"jpg", "jpeg", "png", "webp", "gif"}
MIME_BY_EXT = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif",
}


@api_router.post("/admin/upload-image")
async def admin_upload_image(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    """Admin uploads an image. Returns relative URL to use in product image_url."""
    if not file.filename:
        raise HTTPException(400, "Archivo sin nombre")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(400, f"Formato no permitido. Usa: {', '.join(ALLOWED_IMG_EXT)}")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(400, "Imagen muy grande (max 10MB)")
    content_type = MIME_BY_EXT.get(ext, "application/octet-stream")
    file_id = str(uuid.uuid4())
    storage_path = f"{APP_NAME}/products/{file_id}.{ext}"
    put_object(storage_path, data, content_type)
    # Save record in DB
    await db.uploads.insert_one({
        "id": file_id,
        "storage_path": storage_path,
        "content_type": content_type,
        "size": len(data),
        "uploaded_by": admin["id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Return URL that will route through our backend
    return {
        "url": f"/api/uploads/{file_id}",
        "id": file_id,
    }


@api_router.get("/uploads/{file_id}")
async def serve_upload(file_id: str):
    """Serve uploaded image publicly (anyone with the URL can view)."""
    record = await db.uploads.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Imagen no encontrada")
    data, ct = get_object(record["storage_path"])
    return Response(content=data, media_type=record.get("content_type", ct))


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
def _normalize_code(code: str) -> str:
    return (code or "").strip().upper()


async def _validate_and_calc_coupon(code: str, items_detailed: List[dict], subtotal: float):
    """
    Validates coupon and returns (coupon_doc, discount_amount, eligible_subtotal).
    Raises HTTPException with user-friendly Spanish messages.
    Coupon ONLY applies to items with no existing per-product discount.
    """
    normalized = _normalize_code(code)
    coupon = await db.coupons.find_one({"code": normalized}, {"_id": 0})
    if not coupon or not coupon.get("active", True):
        raise HTTPException(400, "Cupón inválido o inactivo")

    now = datetime.now(timezone.utc)
    expires_at = coupon.get("expires_at")
    if expires_at:
        # expires_at may be stored as datetime (tz-aware) or ISO string
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            except Exception:
                expires_at = None
        if expires_at and expires_at < now:
            raise HTTPException(400, "Este cupón ya expiró")

    usage_limit = coupon.get("usage_limit")
    times_used = coupon.get("times_used", 0)
    if usage_limit is not None and times_used >= usage_limit:
        raise HTTPException(400, "Este cupón ya alcanzó su límite de usos")

    # Eligible = items WITHOUT existing product discount (no descuento sobre descuento)
    eligible_subtotal = sum(it["line_total"] for it in items_detailed if not it.get("on_sale", False))
    eligible_subtotal = round(eligible_subtotal, 2)

    if eligible_subtotal <= 0:
        raise HTTPException(400, "Este cupón no se puede aplicar: todos tus productos ya tienen descuento")

    min_purchase = coupon.get("min_purchase")
    if min_purchase and subtotal < min_purchase:
        raise HTTPException(400, f"Este cupón requiere una compra mínima de ${min_purchase:.2f} MXN")

    if coupon["discount_type"] == "percent":
        discount = round(eligible_subtotal * coupon["discount_value"] / 100, 2)
    else:  # fixed
        discount = round(min(float(coupon["discount_value"]), eligible_subtotal), 2)

    return coupon, discount, eligible_subtotal


@api_router.post("/coupons/validate")
async def validate_coupon_public(payload: CouponValidate):
    """Public endpoint - lets the checkout page preview the discount before paying."""
    if not payload.items:
        raise HTTPException(400, "Carrito vacío")
    product_ids = [i.product_id for i in payload.items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(len(product_ids))
    products_map = {p["id"]: p for p in products}

    items_detailed = []
    subtotal = 0.0
    for item in payload.items:
        p = products_map.get(item.product_id)
        if not p:
            raise HTTPException(400, "Producto inválido en el carrito")
        on_sale = p.get("discount_percent", 0) > 0
        price = float(p["price"]) * (1 - p.get("discount_percent", 0) / 100)
        line_total = round(price * item.quantity, 2)
        subtotal += line_total
        items_detailed.append({"line_total": line_total, "on_sale": on_sale})
    subtotal = round(subtotal, 2)

    coupon, discount, eligible_subtotal = await _validate_and_calc_coupon(payload.code, items_detailed, subtotal)
    return {
        "valid": True,
        "code": coupon["code"],
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
        "discount_amount": discount,
        "eligible_subtotal": eligible_subtotal,
        "subtotal": subtotal,
        "total": round(subtotal - discount, 2),
        "description": coupon.get("description"),
    }


@api_router.post("/orders/checkout")
async def create_checkout(payload: OrderCreate, request: Request):
    """Public guest checkout - no login required."""
    if not payload.items:
        raise HTTPException(400, "El carrito está vacío")
    # Batch fetch all products to avoid N+1 query
    product_ids = [item.product_id for item in payload.items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(len(product_ids))
    products_map = {p["id"]: p for p in products}

    items_detailed = []
    subtotal = 0.0
    for item in payload.items:
        p = products_map.get(item.product_id)
        if not p:
            raise HTTPException(400, f"Producto {item.product_id} no encontrado")
        on_sale = p.get("discount_percent", 0) > 0
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
            "on_sale": on_sale,
        })
    subtotal = round(subtotal, 2)
    discount = 0.0
    coupon_code_applied = None
    if payload.coupon_code:
        coupon, discount, _ = await _validate_and_calc_coupon(payload.coupon_code, items_detailed, subtotal)
        coupon_code_applied = coupon["code"]
    total = round(max(0.0, subtotal - discount), 2)

    order_id = str(uuid.uuid4())
    customer_email = payload.customer_email.lower()
    customer_name = payload.customer_name.strip()
    customer_phone = payload.customer_phone.strip()
    shipping_address = payload.shipping_address.strip()

    # Stripe
    host_url = payload.origin_url.rstrip("/")
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/carrito"
    checkout_req = CheckoutSessionRequest(
        amount=float(total),
        currency="mxn",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": order_id, "customer_email": customer_email},
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    order_doc = {
        "id": order_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "items": items_detailed,
        "subtotal": subtotal,
        "discount": discount,
        "coupon_code": coupon_code_applied,
        "total": total,
        "status": "pending",
        "payment_status": "initiated",
        "session_id": session.session_id,
        "shipping_address": shipping_address,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)

    # Payment transaction record
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "order_id": order_id,
        "customer_email": customer_email,
        "customer_name": customer_name,
        "amount": total,
        "currency": "mxn",
        "payment_status": "initiated",
        "status": "initiated",
        "metadata": {"order_id": order_id, "customer_email": customer_email},
        "processed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id, "order_id": order_id}


@api_router.get("/orders/status/{session_id}")
async def order_status(session_id: str, request: Request):
    """Public endpoint - guest can poll status using session_id."""
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transacción no encontrada")

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    try:
        status_resp: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception:
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

    # If paid and not yet processed, update order
    if new_payment_status == "paid" and not tx.get("processed", False):
        await _mark_order_paid(tx)

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "order_id": tx["order_id"],
        "amount": tx["amount"],
    }


async def _mark_order_paid(tx: dict):
    """Centralized: update order to paid, increment coupon usage, send notification email."""
    order = await db.orders.find_one({"id": tx["order_id"]}, {"_id": 0})
    if not order:
        return
    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": {"payment_status": "paid", "status": "processing"}}
    )
    await db.payment_transactions.update_one(
        {"session_id": tx["session_id"]},
        {"$set": {"processed": True, "payment_status": "paid", "status": "complete"}}
    )
    # Increment coupon usage if any
    if order.get("coupon_code"):
        await db.coupons.update_one(
            {"code": order["coupon_code"]},
            {"$inc": {"times_used": 1}}
        )
    # Fire admin email notification (best-effort, non-blocking)
    try:
        await notify_admin_new_order(order)
    except Exception as e:
        logging.warning(f"Email notify failed for order {order['id']}: {e}")


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
        if tx and not tx.get("processed", False):
            await _mark_order_paid(tx)
    return {"received": True}


# ------------------ Admin: Coupons ------------------
@api_router.get("/admin/coupons")
async def admin_list_coupons(admin: dict = Depends(require_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return coupons


@api_router.post("/admin/coupons")
async def admin_create_coupon(payload: CouponCreate, admin: dict = Depends(require_admin)):
    code = _normalize_code(payload.code)
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(400, "Ya existe un cupón con ese código")
    doc = payload.model_dump()
    doc["code"] = code
    doc["id"] = str(uuid.uuid4())
    doc["times_used"] = 0
    doc["created_at"] = datetime.now(timezone.utc)
    if doc.get("expires_at") and isinstance(doc["expires_at"], datetime) and doc["expires_at"].tzinfo is None:
        doc["expires_at"] = doc["expires_at"].replace(tzinfo=timezone.utc)
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/coupons/{coupon_id}")
async def admin_update_coupon(coupon_id: str, payload: CouponCreate, admin: dict = Depends(require_admin)):
    existing = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Cupón no encontrado")
    new_code = _normalize_code(payload.code)
    if new_code != existing["code"]:
        conflict = await db.coupons.find_one({"code": new_code, "id": {"$ne": coupon_id}})
        if conflict:
            raise HTTPException(400, "Ya existe otro cupón con ese código")
    update = payload.model_dump()
    update["code"] = new_code
    if update.get("expires_at") and isinstance(update["expires_at"], datetime) and update["expires_at"].tzinfo is None:
        update["expires_at"] = update["expires_at"].replace(tzinfo=timezone.utc)
    await db.coupons.update_one({"id": coupon_id}, {"$set": update})
    existing.update(update)
    return existing


@api_router.delete("/admin/coupons/{coupon_id}")
async def admin_delete_coupon(coupon_id: str, admin: dict = Depends(require_admin)):
    res = await db.coupons.delete_one({"id": coupon_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Cupón no encontrado")
    return {"ok": True}


@api_router.get("/admin/orders/pending-count")
async def admin_pending_count(admin: dict = Depends(require_admin)):
    """Count of paid orders not yet shipped/delivered/cancelled - for admin notification bell."""
    count = await db.orders.count_documents({
        "payment_status": "paid",
        "status": {"$in": ["pending", "processing"]}
    })
    return {"count": count}


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

    # Unique customers (by email) from paid orders
    total_customers = len({o.get("customer_email") for o in orders if o.get("customer_email")})

    return {
        "total_sales": round(total_sales, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "by_day": by_day,
        "top_products": top_products,
    }


@api_router.get("/admin/customers")
async def admin_customers(admin: dict = Depends(require_admin)):
    """Aggregate guest customers from orders by email."""
    pipeline = [
        {"$match": {"customer_email": {"$ne": None}}},
        {"$group": {
            "_id": "$customer_email",
            "name": {"$last": "$customer_name"},
            "phone": {"$last": "$customer_phone"},
            "address": {"$last": "$shipping_address"},
            "orders_count": {"$sum": 1},
            "total_spent": {"$sum": {"$cond": [{"$eq": ["$payment_status", "paid"]}, "$total", 0]}},
            "last_order_at": {"$max": "$created_at"},
        }},
        {"$sort": {"last_order_at": -1}},
        {"$limit": 500},
    ]
    rows = await db.orders.aggregate(pipeline).to_list(500)
    return [
        {
            "email": r["_id"],
            "name": r.get("name") or "",
            "phone": r.get("phone") or "",
            "address": r.get("address") or "",
            "orders_count": r.get("orders_count", 0),
            "total_spent": round(r.get("total_spent", 0), 2),
            "last_order_at": r.get("last_order_at"),
        }
        for r in rows
    ]


# ------------------ Messages (Customer → Admin) ------------------
class MessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)


@api_router.post("/messages")
async def send_message(payload: MessageCreate):
    """Public endpoint - anyone can send a message to admin."""
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "phone": payload.phone.strip() if payload.phone else None,
        "subject": payload.subject.strip(),
        "message": payload.message.strip(),
        "is_read": False,
        "is_archived": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/admin/messages")
async def admin_list_messages(admin: dict = Depends(require_admin)):
    msgs = await db.messages.find(
        {"is_archived": False}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    unread_count = sum(1 for m in msgs if not m.get("is_read"))
    return {"messages": msgs, "unread_count": unread_count}


@api_router.put("/admin/messages/{message_id}/read")
async def admin_mark_read(message_id: str, admin: dict = Depends(require_admin)):
    res = await db.messages.update_one(
        {"id": message_id}, {"$set": {"is_read": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Mensaje no encontrado")
    return {"ok": True}


@api_router.delete("/admin/messages/{message_id}")
async def admin_delete_message(message_id: str, admin: dict = Depends(require_admin)):
    res = await db.messages.delete_one({"id": message_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Mensaje no encontrado")
    return {"ok": True}


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
    # Init object storage
    init_storage()

    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.login_attempts.create_index("ip")
    await db.login_attempts.create_index("created_at")
    await db.coupons.create_index("code", unique=True)

    # Seed admin accounts (multi-admin via ADMIN_ACCOUNTS JSON in .env)
    import json as _json
    raw_accounts = os.environ.get("ADMIN_ACCOUNTS", "").strip()
    admin_accounts = []
    if raw_accounts:
        try:
            admin_accounts = _json.loads(raw_accounts)
        except Exception as e:
            logging.error(f"ADMIN_ACCOUNTS JSON inválido: {e}")
            admin_accounts = []

    # Fallback for legacy single-admin .env vars
    if not admin_accounts:
        legacy_email = os.environ.get("ADMIN_EMAIL")
        legacy_pwd = os.environ.get("ADMIN_PASSWORD")
        if legacy_email and legacy_pwd:
            admin_accounts = [{"email": legacy_email, "password": legacy_pwd, "name": "Admin"}]

    configured_emails = set()
    for acc in admin_accounts:
        email = acc["email"].lower().strip()
        password = acc["password"]
        name = acc.get("name", "Admin")
        configured_emails.add(email)
        existing = await db.users.find_one({"email": email})
        if existing is None:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "password_hash": hash_password(password),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        else:
            update = {"role": "admin", "name": name}
            if not verify_password(password, existing["password_hash"]):
                update["password_hash"] = hash_password(password)
            await db.users.update_one({"email": email}, {"$set": update})

    # Remove legacy non-admin users and old admin@mundoinfantil.com (customer accounts no longer used)
    await db.users.delete_many({"role": {"$ne": "admin"}})
    if configured_emails:
        await db.users.delete_many({"role": "admin", "email": {"$nin": list(configured_emails)}})

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

# Serve product images from /api/static/*
static_dir = ROOT_DIR / "static"
if static_dir.exists():
    app.mount("/api/static", StaticFiles(directory=str(static_dir)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
