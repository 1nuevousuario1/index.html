"""Backend tests for admin security hardening: multi-admin login, brute-force lockout,
audit log, password change, secure logout. Mundo Infantil iteration 3.
"""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
# Fallback: read from frontend/.env if env not exported
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

ADMIN1_EMAIL = "malugarciav86@gmail.com"
ADMIN1_PASSWORD = "sbp?pX8oD&fDdPh?"
ADMIN2_EMAIL = "soloyoyjehova@outlook.com"
ADMIN2_PASSWORD = "P8RFc?l6z?FW1uzp"
OLD_ADMIN_EMAIL = "admin@mundoinfantil.com"
OLD_ADMIN_PASSWORD = "admin123"

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'mundo_infantil')


@pytest.fixture
def db():
    c = MongoClient(MONGO_URL)
    yield c[DB_NAME]
    c.close()


@pytest.fixture(autouse=True)
def clean_attempts(db):
    """Always start with empty login_attempts so prior lockouts don't bleed."""
    db.login_attempts.delete_many({})
    yield
    # Best effort: leave clean for UI
    db.login_attempts.delete_many({})


def _login(email, password, ip=None):
    headers = {"Content-Type": "application/json"}
    if ip:
        headers["x-forwarded-for"] = ip
    return requests.post(f"{BASE_URL}/api/auth/login",
                         json={"email": email, "password": password},
                         headers=headers, timeout=15)


# ----- Multi-admin login -----
class TestMultiAdminLogin:
    def test_admin1_login_success(self):
        r = _login(ADMIN1_EMAIL, ADMIN1_PASSWORD, ip=f"10.0.0.{uuid.uuid4().int % 250 + 1}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
        assert data["user"]["email"] == ADMIN1_EMAIL
        assert data["user"]["role"] == "admin"

    def test_admin2_login_success(self):
        r = _login(ADMIN2_EMAIL, ADMIN2_PASSWORD, ip=f"10.0.1.{uuid.uuid4().int % 250 + 1}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == ADMIN2_EMAIL
        assert data["user"]["role"] == "admin"

    def test_old_admin_removed(self):
        r = _login(OLD_ADMIN_EMAIL, OLD_ADMIN_PASSWORD, ip=f"10.0.2.{uuid.uuid4().int % 250 + 1}")
        assert r.status_code == 401
        assert r.json().get("detail") == "Credenciales inválidas"

    def test_wrong_password_generic_error(self):
        r = _login(ADMIN1_EMAIL, "wrong-password", ip=f"10.0.3.{uuid.uuid4().int % 250 + 1}")
        assert r.status_code == 401
        assert r.json().get("detail") == "Credenciales inválidas"

    def test_nonexistent_email_same_error(self):
        r = _login("ghost-nonexistent@example.com", "whatever", ip=f"10.0.4.{uuid.uuid4().int % 250 + 1}")
        assert r.status_code == 401
        assert r.json().get("detail") == "Credenciales inválidas"


# ----- Brute force lockout -----
class TestBruteForce:
    def test_lockout_after_5_failures(self, db):
        ip = f"10.99.99.{uuid.uuid4().int % 250 + 1}"
        db.login_attempts.delete_many({"ip": ip})
        # 5 wrong attempts should all be 401
        for i in range(5):
            r = _login(ADMIN1_EMAIL, "wrong", ip=ip)
            assert r.status_code == 401, f"Attempt {i+1}: expected 401, got {r.status_code}"
        # 6th attempt should be 429
        r = _login(ADMIN1_EMAIL, "wrong", ip=ip)
        assert r.status_code == 429, f"6th attempt expected 429, got {r.status_code} body={r.text}"
        body = r.json()
        assert "Demasiados intentos" in body.get("detail", "")
        # Even valid creds should be blocked while locked
        r2 = _login(ADMIN1_EMAIL, ADMIN1_PASSWORD, ip=ip)
        assert r2.status_code == 429
        # Cleanup
        db.login_attempts.delete_many({"ip": ip})


# ----- Audit log -----
class TestAuditLog:
    def test_audit_log_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/audit-log", timeout=10)
        assert r.status_code == 401

    def test_audit_log_returns_attempts_sorted_desc(self):
        # Generate a known attempt
        ip = f"10.55.55.{uuid.uuid4().int % 250 + 1}"
        _login(ADMIN1_EMAIL, "wrong", ip=ip)
        # Now login as admin
        r = _login(ADMIN1_EMAIL, ADMIN1_PASSWORD, ip=f"10.55.56.{uuid.uuid4().int % 250 + 1}")
        token = r.json()["token"]
        r2 = requests.get(f"{BASE_URL}/api/admin/audit-log",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 200
        rows = r2.json()
        assert isinstance(rows, list) and len(rows) >= 2
        # Verify schema
        for row in rows[:3]:
            assert set(["ip", "email", "success", "reason", "created_at"]).issubset(row.keys())
        # Sorted desc by created_at
        ts = [row["created_at"] for row in rows]
        assert ts == sorted(ts, reverse=True), "audit log not sorted desc"


# ----- Change password -----
class TestChangePassword:
    def test_wrong_current_password_rejected(self):
        r = _login(ADMIN2_EMAIL, ADMIN2_PASSWORD, ip=f"10.77.77.{uuid.uuid4().int % 250 + 1}")
        token = r.json()["token"]
        r2 = requests.post(f"{BASE_URL}/api/auth/change-password",
                           json={"current_password": "wrong-current", "new_password": "NewPasswordXYZ123"},
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 401
        assert r2.json().get("detail") == "Credenciales inválidas"

    def test_change_password_then_restore(self):
        # Use admin2 to avoid stomping admin1 tests in parallel
        ip = f"10.88.88.{uuid.uuid4().int % 250 + 1}"
        r = _login(ADMIN2_EMAIL, ADMIN2_PASSWORD, ip=ip)
        assert r.status_code == 200
        token = r.json()["token"]
        new_pw = "TempStrongPwd!2026"
        r2 = requests.post(f"{BASE_URL}/api/auth/change-password",
                           json={"current_password": ADMIN2_PASSWORD, "new_password": new_pw},
                           headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 200
        # Cookie should be cleared (Set-Cookie with deletion)
        sc = r2.headers.get("set-cookie", "").lower()
        assert "access_token=" in sc
        # Old password no longer works
        r3 = _login(ADMIN2_EMAIL, ADMIN2_PASSWORD, ip=f"10.88.89.{uuid.uuid4().int % 250 + 1}")
        assert r3.status_code == 401
        # New password works
        r4 = _login(ADMIN2_EMAIL, new_pw, ip=f"10.88.90.{uuid.uuid4().int % 250 + 1}")
        assert r4.status_code == 200
        # Restore back to original (important for subsequent tests / UI usage)
        token2 = r4.json()["token"]
        r5 = requests.post(f"{BASE_URL}/api/auth/change-password",
                           json={"current_password": new_pw, "new_password": ADMIN2_PASSWORD},
                           headers={"Authorization": f"Bearer {token2}"}, timeout=10)
        assert r5.status_code == 200


# ----- Logout -----
class TestLogout:
    def test_logout_clears_cookie(self):
        s = requests.Session()
        ip = f"10.66.66.{uuid.uuid4().int % 250 + 1}"
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": ADMIN1_EMAIL, "password": ADMIN1_PASSWORD},
                   headers={"x-forwarded-for": ip}, timeout=10)
        assert r.status_code == 200
        # Cookie set
        assert "access_token" in s.cookies.get_dict() or "access_token" in r.headers.get("set-cookie", "")
        r2 = s.post(f"{BASE_URL}/api/auth/logout", timeout=10)
        assert r2.status_code == 200
        # delete_cookie sends Set-Cookie with expired/empty
        sc = r2.headers.get("set-cookie", "").lower()
        assert "access_token=" in sc


# ----- Guest checkout still works -----
class TestGuestCheckoutStillWorks:
    def test_guest_can_create_checkout(self, db):
        # Need a product id
        product = db.products.find_one({}, {"id": 1, "_id": 0})
        assert product, "No products seeded"
        payload = {
            "items": [{"product_id": product["id"], "quantity": 1}],
            "customer_name": "TEST_Guest",
            "customer_email": "test_guest_iter3@example.com",
            "customer_phone": "5512345678",
            "shipping_address": "Calle Test 123, CDMX",
            "origin_url": "https://example.com"
        }
        r = requests.post(f"{BASE_URL}/api/orders/checkout", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data and "url" in data and "order_id" in data


# ----- Admin-gated endpoints -----
class TestAdminGuards:
    def test_pending_count_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/admin/orders/pending-count", timeout=10)
        assert r.status_code == 401

    def test_pending_count_with_admin(self):
        r = _login(ADMIN1_EMAIL, ADMIN1_PASSWORD, ip=f"10.33.33.{uuid.uuid4().int % 250 + 1}")
        token = r.json()["token"]
        r2 = requests.get(f"{BASE_URL}/api/admin/orders/pending-count",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert r2.status_code == 200
        assert "count" in r2.json()
