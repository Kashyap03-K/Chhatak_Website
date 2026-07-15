"""Tests for security headers, CORS, input sanitization, invoice access, and additional security checks."""


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        resp = client.get("/api/health")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_hsts_header_present(self, client):
        resp = client.get("/api/health")
        assert "max-age=" in resp.headers.get("Strict-Transport-Security", "")

    def test_csp_header_present(self, client):
        resp = client.get("/api/health")
        assert "default-src" in resp.headers.get("Content-Security-Policy", "")

    def test_permissions_policy_present(self, client):
        resp = client.get("/api/health")
        assert "camera=()" in resp.headers.get("Permissions-Policy", "")


class TestInputSanitization:
    def test_xss_in_name_stored_as_text(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "<script>alert('xss')</script>",
            "email": "xss@test.com",
            "password": "SafePass123",
        })
        assert resp.status_code == 201
        assert resp.json()["name"] == "<script>alert('xss')</script>"

    def test_sql_injection_in_email(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "admin@test.com",
            "password": "' OR 1=1 --",
        })
        assert resp.status_code == 401

    def test_sql_injection_in_slug_lookup(self, client):
        resp = client.get("/api/v1/products/slug/' OR 1=1 --")
        assert resp.status_code == 404

    def test_oversized_address_rejected(self, client, auth_headers, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Test", "slug": "oversized-test", "price": 99, "stock": 10,
        }, headers=admin_headers)
        pid = resp.json()["id"]
        client.post("/api/v1/cart/", json={"product_id": pid, "quantity": 1}, headers=auth_headers)

        resp = client.post("/api/v1/orders/", json={
            "shipping_address": "A" * 1001,
        }, headers=auth_headers)
        assert resp.status_code == 422

    def test_pincode_must_be_digits(self, client, auth_headers):
        resp = client.post("/api/v1/addresses/", json={
            "full_name": "Test", "phone": "1234567890",
            "address_line1": "St", "city": "City", "state": "ST", "pincode": "abc123",
        }, headers=auth_headers)
        assert resp.status_code == 422

    def test_oversized_product_name_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "X" * 201, "slug": "big-name", "price": 10, "stock": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_oversized_description_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Test", "slug": "big-desc", "price": 10, "stock": 1,
            "description": "X" * 2001,
        }, headers=admin_headers)
        assert resp.status_code == 422


class TestProductUpdateValidation:
    def test_negative_price_rejected_on_update(self, client, admin_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "price": -10,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_zero_price_rejected_on_update(self, client, admin_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "price": 0,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_negative_stock_rejected_on_update(self, client, admin_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "stock": -1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_oversized_price_rejected_on_update(self, client, admin_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "price": 100001,
        }, headers=admin_headers)
        assert resp.status_code == 422


class TestInvoiceAccess:
    def test_invoice_requires_auth(self, client):
        resp = client.get("/api/v1/orders/1/invoice")
        assert resp.status_code == 401

    def test_invoice_not_for_pending_order(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        order = client.post("/api/v1/orders/", json={"shipping_address": "Test"}, headers=auth_headers).json()

        resp = client.get(f"/api/v1/orders/{order['id']}/invoice", headers=auth_headers)
        assert resp.status_code == 400
        assert "after payment" in resp.json()["detail"]

    def test_invoice_not_accessible_by_other_user(self, client, auth_headers, admin_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        order = client.post("/api/v1/orders/", json={"shipping_address": "Test"}, headers=auth_headers).json()

        resp = client.get(f"/api/v1/orders/{order['id']}/invoice", headers=admin_headers)
        assert resp.status_code == 404


class TestAddressValidation:
    def test_create_address_valid(self, client, auth_headers):
        resp = client.post("/api/v1/addresses/", json={
            "full_name": "Test User", "phone": "9876543210",
            "address_line1": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
        }, headers=auth_headers)
        assert resp.status_code == 201

    def test_empty_name_rejected(self, client, auth_headers):
        resp = client.post("/api/v1/addresses/", json={
            "full_name": "", "phone": "9876543210",
            "address_line1": "123 St", "city": "City", "state": "State", "pincode": "400001",
        }, headers=auth_headers)
        assert resp.status_code == 422

    def test_default_address_flag(self, client, auth_headers):
        client.post("/api/v1/addresses/", json={
            "full_name": "First", "phone": "1111111111",
            "address_line1": "A", "city": "C", "state": "S", "pincode": "100001", "is_default": True,
        }, headers=auth_headers)
        client.post("/api/v1/addresses/", json={
            "full_name": "Second", "phone": "2222222222",
            "address_line1": "B", "city": "C", "state": "S", "pincode": "200002", "is_default": True,
        }, headers=auth_headers)

        addrs = client.get("/api/v1/addresses/", headers=auth_headers).json()
        defaults = [a for a in addrs if a["is_default"]]
        assert len(defaults) == 1
        assert defaults[0]["full_name"] == "Second"


class TestIDORProtection:
    """Insecure Direct Object Reference — ensure users can't access other users' resources."""

    def test_user_cannot_view_other_users_order(self, client, auth_headers, admin_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        order = client.post("/api/v1/orders/", json={"shipping_address": "Secret"}, headers=auth_headers).json()

        resp = client.get(f"/api/v1/orders/{order['id']}", headers=admin_headers)
        assert resp.status_code == 404

    def test_user_cannot_modify_other_users_cart(self, client, auth_headers, admin_headers, sample_product):
        add_resp = client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        item_id = add_resp.json()["id"]

        resp = client.put(f"/api/v1/cart/{item_id}", json={"quantity": 99}, headers=admin_headers)
        assert resp.status_code == 404

    def test_user_cannot_delete_other_users_cart_item(self, client, auth_headers, admin_headers, sample_product):
        add_resp = client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        item_id = add_resp.json()["id"]

        resp = client.delete(f"/api/v1/cart/{item_id}", headers=admin_headers)
        assert resp.status_code == 404


class TestTokenSecurity:
    def test_token_not_leaked_in_error_responses(self, client, auth_headers):
        resp = client.get("/api/v1/orders/99999", headers=auth_headers)
        body = resp.text
        token = auth_headers["Authorization"].split(" ")[1]
        assert token not in body

    def test_password_not_in_login_response(self, client, registered_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123",
        })
        body = resp.text
        assert "TestPass123" not in body
        assert "password_hash" not in body

    def test_password_not_in_register_response(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "NewPass123",
        })
        body = resp.text
        assert "NewPass123" not in body
        assert "password_hash" not in body


class TestMassAssignment:
    """Ensure users cannot elevate privileges through request payloads."""

    def test_cannot_register_as_admin(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Hacker",
            "email": "hacker@test.com",
            "password": "HackPass123",
            "is_admin": True,
        })
        assert resp.status_code == 201
        assert resp.json()["is_admin"] is False

    def test_cannot_set_user_id_in_order(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        resp = client.post("/api/v1/orders/", json={
            "shipping_address": "Test",
            "user_id": 9999,
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["user_id"] != 9999
