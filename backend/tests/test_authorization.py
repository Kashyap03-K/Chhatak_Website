"""Tests for role-based access control — admin vs regular user."""


class TestAdminAccess:
    def test_admin_stats_requires_admin(self, client, auth_headers):
        resp = client.get("/api/v1/orders/admin/stats", headers=auth_headers)
        assert resp.status_code == 403
        assert "Admin access required" in resp.json()["detail"]

    def test_admin_stats_works_for_admin(self, client, admin_headers):
        resp = client.get("/api/v1/orders/admin/stats", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_orders" in data
        assert "total_revenue" in data

    def test_admin_orders_requires_admin(self, client, auth_headers):
        resp = client.get("/api/v1/orders/admin/all", headers=auth_headers)
        assert resp.status_code == 403

    def test_admin_orders_works_for_admin(self, client, admin_headers):
        resp = client.get("/api/v1/orders/admin/all", headers=admin_headers)
        assert resp.status_code == 200

    def test_create_product_requires_admin(self, client, auth_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Hack Product",
            "slug": "hack-product",
            "price": 1.0,
            "stock": 999,
        }, headers=auth_headers)
        assert resp.status_code == 403

    def test_update_product_requires_admin(self, client, auth_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "price": 0.01,
        }, headers=auth_headers)
        assert resp.status_code == 403

    def test_delete_product_requires_admin(self, client, auth_headers, sample_product):
        resp = client.delete(f"/api/v1/products/{sample_product['id']}", headers=auth_headers)
        assert resp.status_code == 403

    def test_update_order_status_requires_admin(self, client, auth_headers):
        resp = client.patch("/api/v1/orders/1/status", json={"status": "confirmed"}, headers=auth_headers)
        assert resp.status_code == 403


class TestDataIsolation:
    def test_user_cannot_see_other_users_orders(self, client, auth_headers, admin_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        client.post("/api/v1/orders/", json={"shipping_address": "Test Address"}, headers=auth_headers)

        resp = client.get("/api/v1/orders/", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_user_cannot_see_other_users_addresses(self, client, auth_headers, admin_headers):
        client.post("/api/v1/addresses/", json={
            "full_name": "Secret", "phone": "1234567890",
            "address_line1": "123 St", "city": "Mumbai", "state": "MH", "pincode": "400001",
        }, headers=auth_headers)

        resp = client.get("/api/v1/addresses/", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_user_cannot_delete_other_users_address(self, client, auth_headers, admin_headers):
        resp = client.post("/api/v1/addresses/", json={
            "full_name": "Owner", "phone": "1234567890",
            "address_line1": "My Street", "city": "Delhi", "state": "DL", "pincode": "110001",
        }, headers=auth_headers)
        addr_id = resp.json()["id"]

        del_resp = client.delete(f"/api/v1/addresses/{addr_id}", headers=admin_headers)
        assert del_resp.status_code == 404
