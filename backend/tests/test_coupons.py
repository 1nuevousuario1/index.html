"""Backend tests for the Coupons feature (admin CRUD + public validation + checkout integration).

Mundo Infantil - iteration 4.
Covers:
  - POST /api/admin/coupons (create + auth gating + duplicate)
  - GET /api/admin/coupons (admin only, sorted desc)
  - PUT /api/admin/coupons/{id}
  - DELETE /api/admin/coupons/{id}
  - POST /api/coupons/validate (public): valid, invalid, all-discounted cart, min purchase, expired, usage limit
  - POST /api/orders/checkout with coupon_code (valid + invalid)
  - Discount only applied to non-discounted line items (no descuento sobre descuento)
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "malugarciav86@gmail.com"
ADMIN_PASSWORD = "sbp?pX8oD&fDdPh?"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "mundo_infantil")


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def db():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(autouse=True)
def clean_login_attempts(db):
    """Prevent brute-force lockout from bleeding between tests."""
    db.login_attempts.delete_many({})
    yield
    db.login_attempts.delete_many({})


@pytest.fixture(scope="module")
def admin_token():
    ip = f"10.44.{uuid.uuid4().int % 250 + 1}.{uuid.uuid4().int % 250 + 1}"
    r = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"x-forwarded-for": ip},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def products(db):
    """Find a non-discounted product and a discounted product for tests."""
    plain = db.products.find_one({"discount_percent": {"$in": [0, None]}}, {"_id": 0})
    if not plain:
        plain = db.products.find_one({}, {"_id": 0})
    assert plain, "No products seeded"

    discounted = db.products.find_one({"discount_percent": {"$gt": 0}}, {"_id": 0})
    # Temporarily mark a second product as on-sale if no discounted product exists
    temp_marked = None
    if not discounted:
        other = db.products.find_one(
            {"id": {"$ne": plain["id"]}}, {"_id": 0}
        )
        assert other, "Need at least 2 products"
        db.products.update_one({"id": other["id"]}, {"$set": {"discount_percent": 20}})
        temp_marked = other["id"]
        discounted = db.products.find_one({"id": other["id"]}, {"_id": 0})

    yield {"plain": plain, "discounted": discounted}

    if temp_marked:
        db.products.update_one({"id": temp_marked}, {"$set": {"discount_percent": 0}})


@pytest.fixture
def cleanup_test_coupons(db):
    """Delete coupons created during tests (TEST_ prefix)."""
    created = []
    yield created
    for code in created:
        db.coupons.delete_one({"code": code})


# ---------------- Helpers ----------------
def _new_code(prefix="TESTCPN"):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


# ---------------- Admin CRUD ----------------
class TestAdminCouponCRUD:
    def test_create_requires_auth(self):
        r = requests.post(
            f"{API}/admin/coupons",
            json={
                "code": "TESTNOAUTH",
                "discount_type": "percent",
                "discount_value": 10,
                "active": True,
            },
            timeout=10,
        )
        assert r.status_code == 401

    def test_list_requires_auth(self):
        r = requests.get(f"{API}/admin/coupons", timeout=10)
        assert r.status_code == 401

    def test_create_coupon_success(self, admin_headers, db, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        payload = {
            "code": code,
            "description": "Test coupon",
            "discount_type": "percent",
            "discount_value": 10,
            "min_purchase": 100,
            "usage_limit": 5,
            "active": True,
        }
        r = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["code"] == code
        assert data["discount_type"] == "percent"
        assert data["discount_value"] == 10
        assert data["times_used"] == 0
        assert "id" in data
        assert "created_at" in data
        assert "_id" not in data

        # GET to verify persistence
        list_r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=10)
        assert list_r.status_code == 200
        coupons = list_r.json()
        codes = [c["code"] for c in coupons]
        assert code in codes

    def test_create_duplicate_code(self, admin_headers, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        payload = {"code": code, "discount_type": "percent", "discount_value": 5, "active": True}
        r1 = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=10)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/admin/coupons", json=payload, headers=admin_headers, timeout=10)
        assert r2.status_code == 400
        assert "Ya existe un cupón con ese código" in r2.json().get("detail", "")

    def test_list_sorted_desc(self, admin_headers, cleanup_test_coupons):
        # Create 2 coupons, the newer must appear first
        c1 = _new_code("AAA")
        c2 = _new_code("BBB")
        cleanup_test_coupons.extend([c1, c2])
        requests.post(
            f"{API}/admin/coupons",
            json={"code": c1, "discount_type": "fixed", "discount_value": 20, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        requests.post(
            f"{API}/admin/coupons",
            json={"code": c2, "discount_type": "fixed", "discount_value": 30, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        r = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        coupons = r.json()
        idx1 = next((i for i, c in enumerate(coupons) if c["code"] == c1), None)
        idx2 = next((i for i, c in enumerate(coupons) if c["code"] == c2), None)
        assert idx1 is not None and idx2 is not None
        assert idx2 < idx1, "Coupons not sorted desc by created_at"

    def test_update_coupon(self, admin_headers, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        r = requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 5, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        cid = r.json()["id"]
        upd = {
            "code": code,
            "discount_type": "percent",
            "discount_value": 25,
            "active": False,
            "description": "Updated desc",
        }
        r2 = requests.put(f"{API}/admin/coupons/{cid}", json=upd, headers=admin_headers, timeout=10)
        assert r2.status_code == 200
        # GET to confirm persistence
        r3 = requests.get(f"{API}/admin/coupons", headers=admin_headers, timeout=10)
        target = next(c for c in r3.json() if c["id"] == cid)
        assert target["discount_value"] == 25
        assert target["active"] is False
        assert target["description"] == "Updated desc"

    def test_delete_coupon(self, admin_headers, db, cleanup_test_coupons):
        code = _new_code()
        r = requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "fixed", "discount_value": 10, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        cid = r.json()["id"]
        r2 = requests.delete(f"{API}/admin/coupons/{cid}", headers=admin_headers, timeout=10)
        assert r2.status_code == 200
        # Verify removed
        gone = db.coupons.find_one({"id": cid})
        assert gone is None

    def test_delete_requires_auth(self, admin_headers, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        r = requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 5, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        cid = r.json()["id"]
        r2 = requests.delete(f"{API}/admin/coupons/{cid}", timeout=10)
        assert r2.status_code == 401


# ---------------- Public coupon validation ----------------
class TestPublicCouponValidate:
    def test_valid_coupon_returns_discount(self, admin_headers, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={
                "code": code,
                "discount_type": "percent",
                "discount_value": 10,
                "active": True,
            },
            headers=admin_headers,
            timeout=10,
        )
        plain = products["plain"]
        payload = {
            "code": code.lower(),  # ensure case-insensitive
            "items": [{"product_id": plain["id"], "quantity": 2}],
        }
        r = requests.post(f"{API}/coupons/validate", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["valid"] is True
        assert data["code"] == code
        line_total = round(float(plain["price"]) * 2, 2)
        assert abs(data["eligible_subtotal"] - line_total) < 0.5
        assert data["discount_amount"] > 0
        assert abs(data["total"] - (data["subtotal"] - data["discount_amount"])) < 0.01

    def test_invalid_coupon_code(self, products):
        r = requests.post(
            f"{API}/coupons/validate",
            json={
                "code": "DOES-NOT-EXIST-XYZ",
                "items": [{"product_id": products["plain"]["id"], "quantity": 1}],
            },
            timeout=10,
        )
        assert r.status_code == 400
        assert "Cupón inválido" in r.json().get("detail", "")

    def test_inactive_coupon(self, admin_headers, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 10, "active": False},
            headers=admin_headers,
            timeout=10,
        )
        r = requests.post(
            f"{API}/coupons/validate",
            json={"code": code, "items": [{"product_id": products["plain"]["id"], "quantity": 1}]},
            timeout=10,
        )
        assert r.status_code == 400
        assert "Cupón inválido" in r.json().get("detail", "")

    def test_all_discounted_cart_rejects(self, admin_headers, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 15, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        discounted = products["discounted"]
        r = requests.post(
            f"{API}/coupons/validate",
            json={"code": code, "items": [{"product_id": discounted["id"], "quantity": 1}]},
            timeout=10,
        )
        assert r.status_code == 400, r.text
        assert "todos tus productos ya tienen descuento" in r.json().get("detail", "")

    def test_min_purchase_not_met(self, admin_headers, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        plain = products["plain"]
        # Set min_purchase well above the line total
        huge_min = float(plain["price"]) * 1000
        requests.post(
            f"{API}/admin/coupons",
            json={
                "code": code,
                "discount_type": "percent",
                "discount_value": 10,
                "min_purchase": huge_min,
                "active": True,
            },
            headers=admin_headers,
            timeout=10,
        )
        r = requests.post(
            f"{API}/coupons/validate",
            json={"code": code, "items": [{"product_id": plain["id"], "quantity": 1}]},
            timeout=10,
        )
        assert r.status_code == 400
        assert "compra mínima" in r.json().get("detail", "")

    def test_expired_coupon(self, admin_headers, db, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 10, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        # Set expires_at to the past via Mongo directly
        past = datetime.now(timezone.utc) - timedelta(days=2)
        db.coupons.update_one({"code": code}, {"$set": {"expires_at": past}})
        r = requests.post(
            f"{API}/coupons/validate",
            json={"code": code, "items": [{"product_id": products["plain"]["id"], "quantity": 1}]},
            timeout=10,
        )
        assert r.status_code == 400
        assert "expiró" in r.json().get("detail", "")

    def test_usage_limit_reached(self, admin_headers, db, products, cleanup_test_coupons):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={
                "code": code,
                "discount_type": "percent",
                "discount_value": 10,
                "usage_limit": 1,
                "active": True,
            },
            headers=admin_headers,
            timeout=10,
        )
        # Set times_used = usage_limit
        db.coupons.update_one({"code": code}, {"$set": {"times_used": 1}})
        r = requests.post(
            f"{API}/coupons/validate",
            json={"code": code, "items": [{"product_id": products["plain"]["id"], "quantity": 1}]},
            timeout=10,
        )
        assert r.status_code == 400
        assert "límite" in r.json().get("detail", "")

    def test_mixed_cart_discount_only_on_non_discounted(self, admin_headers, products, cleanup_test_coupons):
        """Coupon applies only to non-discounted line totals (no descuento sobre descuento)."""
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 50, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        plain = products["plain"]
        discounted = products["discounted"]
        r = requests.post(
            f"{API}/coupons/validate",
            json={
                "code": code,
                "items": [
                    {"product_id": plain["id"], "quantity": 1},
                    {"product_id": discounted["id"], "quantity": 1},
                ],
            },
            timeout=10,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # eligible_subtotal should equal only the plain product's line total (full price)
        expected_eligible = round(float(plain["price"]), 2)
        assert abs(data["eligible_subtotal"] - expected_eligible) < 0.5, (
            f"eligible_subtotal={data['eligible_subtotal']} expected~{expected_eligible}"
        )
        # discount = 50% of eligible_subtotal (NOT the full subtotal)
        expected_discount = round(expected_eligible * 0.5, 2)
        assert abs(data["discount_amount"] - expected_discount) < 0.5


# ---------------- Checkout integration ----------------
class TestCheckoutWithCoupon:
    def test_checkout_with_valid_coupon_persists_discount(
        self, admin_headers, products, db, cleanup_test_coupons
    ):
        code = _new_code()
        cleanup_test_coupons.append(code)
        requests.post(
            f"{API}/admin/coupons",
            json={"code": code, "discount_type": "percent", "discount_value": 10, "active": True},
            headers=admin_headers,
            timeout=10,
        )
        plain = products["plain"]
        payload = {
            "items": [{"product_id": plain["id"], "quantity": 2}],
            "customer_name": "TEST_CouponBuyer",
            "customer_email": "test_coupon_buyer@example.com",
            "customer_phone": "+5215512345678",
            "shipping_address": "Calle Cupón 1, CDMX",
            "origin_url": BASE_URL,
            "coupon_code": code,
        }
        r = requests.post(f"{API}/orders/checkout", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        order_id = r.json()["order_id"]
        # Verify order has coupon_code, discount > 0 and total = subtotal - discount
        order = db.orders.find_one({"id": order_id}, {"_id": 0})
        assert order is not None
        assert order.get("coupon_code") == code
        assert order.get("discount", 0) > 0
        subtotal = order.get("subtotal", 0)
        total = order.get("total", 0)
        discount = order.get("discount", 0)
        assert abs((subtotal - discount) - total) < 0.01

    def test_checkout_with_invalid_coupon_rejects(self, products, db):
        payload = {
            "items": [{"product_id": products["plain"]["id"], "quantity": 1}],
            "customer_name": "TEST_BadCoupon",
            "customer_email": "test_badcoupon@example.com",
            "customer_phone": "+5215511111111",
            "shipping_address": "Calle Mala 1",
            "origin_url": BASE_URL,
            "coupon_code": "DOES-NOT-EXIST-XYZ",
        }
        before = db.orders.count_documents({"customer_email": "test_badcoupon@example.com"})
        r = requests.post(f"{API}/orders/checkout", json=payload, timeout=20)
        assert r.status_code == 400
        # No order should be created
        after = db.orders.count_documents({"customer_email": "test_badcoupon@example.com"})
        assert after == before
