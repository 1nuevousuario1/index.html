"""
Backend tests for guest-only checkout flow + admin notification bell.
Mundo Infantil - iteration 2.
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to read frontend env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mundoinfantil.com"
ADMIN_PASSWORD = "admin123"


# -------- Fixtures --------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def product_id(http):
    r = http.get(f"{API}/products")
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0, "No products seeded"
    return items[0]["id"]


@pytest.fixture(scope="session")
def mongo_db():
    env = {}
    with open("/app/backend/.env") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v.strip().strip('"').strip("'")
    return MongoClient(env["MONGO_URL"])[env["DB_NAME"]]


@pytest.fixture
def fresh_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Public products & messages --------
def test_products_public(http):
    r = http.get(f"{API}/products")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_messages_public(http):
    r = http.post(f"{API}/messages", json={
        "name": "TEST_Guest",
        "email": "test_msg@example.com",
        "subject": "TEST Subject",
        "message": "Hola, este es un mensaje de prueba"
    })
    assert r.status_code == 200
    assert r.json().get("ok") is True


# -------- Auth (admin only) --------
def test_admin_login_works(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert isinstance(data["token"], str) and len(data["token"]) > 0


def test_auth_me_admin(http, admin_token):
    r = http.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL
    assert r.json()["role"] == "admin"


# -------- Guest checkout --------
def test_checkout_guest_success(http, product_id):
    payload = {
        "items": [{"product_id": product_id, "quantity": 1}],
        "customer_name": "TEST Guest Buyer",
        "customer_email": "test_guest@example.com",
        "customer_phone": "+525511223344",
        "shipping_address": "Calle Falsa 123, CDMX",
        "origin_url": BASE_URL,
    }
    r = http.post(f"{API}/orders/checkout", json=payload)
    assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
    data = r.json()
    assert "url" in data and data["url"].startswith("https://")
    assert "session_id" in data and len(data["session_id"]) > 0
    assert "order_id" in data and len(data["order_id"]) > 0


def test_checkout_empty_cart(http):
    r = http.post(f"{API}/orders/checkout", json={
        "items": [],
        "customer_name": "TEST",
        "customer_email": "e@e.com",
        "customer_phone": "1234567",
        "shipping_address": "addr",
        "origin_url": BASE_URL,
    })
    assert r.status_code == 400


def test_checkout_invalid_product(http):
    r = http.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": "non-existent-id-xyz", "quantity": 1}],
        "customer_name": "TEST",
        "customer_email": "e@e.com",
        "customer_phone": "1234567",
        "shipping_address": "addr",
        "origin_url": BASE_URL,
    })
    assert r.status_code == 400


def test_checkout_invalid_email(http, product_id):
    r = http.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": product_id, "quantity": 1}],
        "customer_name": "TEST",
        "customer_email": "not-an-email",
        "customer_phone": "1234567",
        "shipping_address": "addr",
        "origin_url": BASE_URL,
    })
    assert r.status_code == 422


def test_checkout_no_auth_required(http, product_id):
    """No Authorization header - should still work."""
    # Use a fresh session without cookies
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": product_id, "quantity": 2}],
        "customer_name": "TEST NoAuth",
        "customer_email": "noauth@example.com",
        "customer_phone": "+5215512345678",
        "shipping_address": "Av Reforma 100",
        "origin_url": BASE_URL,
    })
    assert r.status_code == 200


def test_order_status_public(http, product_id):
    # create order
    r = http.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": product_id, "quantity": 1}],
        "customer_name": "TEST Status",
        "customer_email": "status@example.com",
        "customer_phone": "1234567",
        "shipping_address": "addr",
        "origin_url": BASE_URL,
    })
    assert r.status_code == 200
    sid = r.json()["session_id"]
    # poll (public, no auth) - Stripe test key may yield 'pending' fallback
    s = requests.Session()
    r2 = s.get(f"{API}/orders/status/{sid}")
    assert r2.status_code == 200, f"status failed: {r2.text}"
    data = r2.json()
    assert "payment_status" in data
    assert "order_id" in data


def test_order_status_not_found(http):
    r = http.get(f"{API}/orders/status/cs_test_doesnotexist_xyz")
    assert r.status_code == 404


# -------- Removed legacy endpoints --------
def test_orders_mine_removed(http, admin_token):
    r = http.get(f"{API}/orders/mine", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code in (404, 405), f"expected removed, got {r.status_code}"


# -------- Admin notification bell --------
def test_admin_pending_count_requires_auth(fresh_session):
    r = fresh_session.get(f"{API}/admin/orders/pending-count")
    assert r.status_code == 401


def test_admin_pending_count_returns_count(http, admin_headers, product_id, mongo_db):
    # baseline
    r = http.get(f"{API}/admin/orders/pending-count", headers=admin_headers)
    assert r.status_code == 200
    baseline = r.json().get("count", 0)
    assert isinstance(baseline, int)

    # Simulate a paid+pending order directly via Mongo
    order_id = str(uuid.uuid4())
    mongo_db.orders.insert_one({
        "id": order_id,
        "customer_name": "TEST PendingCount",
        "customer_email": "pending@test.com",
        "customer_phone": "1234567",
        "items": [],
        "subtotal": 100.0,
        "total": 100.0,
        "status": "pending",
        "payment_status": "paid",
        "session_id": f"cs_test_{order_id}",
        "shipping_address": "addr",
        "created_at": "2026-01-01T00:00:00+00:00",
    })
    try:
        r2 = http.get(f"{API}/admin/orders/pending-count", headers=admin_headers)
        assert r2.status_code == 200
        assert r2.json()["count"] == baseline + 1
    finally:
        mongo_db.orders.delete_one({"id": order_id})


# -------- Admin orders --------
def test_admin_orders_lists_guest_fields(http, admin_headers, product_id):
    # ensure at least one order exists with customer info
    payload = {
        "items": [{"product_id": product_id, "quantity": 1}],
        "customer_name": "TEST AdminViewName",
        "customer_email": "adminview@test.com",
        "customer_phone": "+525599887766",
        "shipping_address": "Insurgentes 999",
        "origin_url": BASE_URL,
    }
    r0 = http.post(f"{API}/orders/checkout", json=payload)
    assert r0.status_code == 200
    order_id = r0.json()["order_id"]

    r = http.get(f"{API}/admin/orders", headers=admin_headers)
    assert r.status_code == 200
    orders = r.json()
    assert isinstance(orders, list)
    target = next((o for o in orders if o["id"] == order_id), None)
    assert target is not None, "Created order not found in admin list"
    assert target["customer_name"] == "TEST AdminViewName"
    assert target["customer_email"] == "adminview@test.com"
    assert target["customer_phone"] == "+525599887766"
    assert target["shipping_address"] == "Insurgentes 999"


def test_admin_orders_requires_auth(fresh_session):
    r = fresh_session.get(f"{API}/admin/orders")
    assert r.status_code == 401


# -------- Admin customers aggregation --------
def test_admin_customers_aggregated(http, admin_headers, product_id):
    # Create an order to ensure aggregation has data
    http.post(f"{API}/orders/checkout", json={
        "items": [{"product_id": product_id, "quantity": 1}],
        "customer_name": "TEST CustAgg",
        "customer_email": "custagg@test.com",
        "customer_phone": "9991112222",
        "shipping_address": "Calle X 1",
        "origin_url": BASE_URL,
    })

    r = http.get(f"{API}/admin/customers", headers=admin_headers)
    assert r.status_code == 200
    customers = r.json()
    assert isinstance(customers, list)
    if customers:
        first = customers[0]
        for k in ("email", "name", "phone", "address", "orders_count", "total_spent", "last_order_at"):
            assert k in first, f"missing key: {k}"
    target = next((c for c in customers if c["email"] == "custagg@test.com"), None)
    assert target is not None
    assert target["name"] == "TEST CustAgg"
    assert target["phone"] == "9991112222"
    assert target["orders_count"] >= 1


def test_admin_customers_requires_auth(fresh_session):
    r = fresh_session.get(f"{API}/admin/customers")
    assert r.status_code == 401
