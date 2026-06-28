"""Tests for cart operations and order creation flow."""


class TestCart:
    def test_add_to_cart(self, client, auth_headers, sample_product):
        resp = client.post("/api/v1/cart/", json={
            "product_id": sample_product["id"], "quantity": 2,
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["quantity"] == 2

    def test_add_duplicate_increments_quantity(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 3}, headers=auth_headers)

        resp = client.get("/api/v1/cart/", headers=auth_headers)
        assert resp.json()[0]["quantity"] == 4

    def test_add_nonexistent_product(self, client, auth_headers):
        resp = client.post("/api/v1/cart/", json={"product_id": 9999, "quantity": 1}, headers=auth_headers)
        assert resp.status_code == 404

    def test_update_cart_quantity(self, client, auth_headers, sample_product):
        add_resp = client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        item_id = add_resp.json()["id"]

        resp = client.put(f"/api/v1/cart/{item_id}", json={"quantity": 5}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["quantity"] == 5

    def test_remove_from_cart(self, client, auth_headers, sample_product):
        add_resp = client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        item_id = add_resp.json()["id"]

        resp = client.delete(f"/api/v1/cart/{item_id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_clear_cart(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 2}, headers=auth_headers)
        resp = client.delete("/api/v1/cart/", headers=auth_headers)
        assert resp.status_code == 204

        cart = client.get("/api/v1/cart/", headers=auth_headers)
        assert len(cart.json()) == 0


class TestOrders:
    def test_create_order(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        resp = client.post("/api/v1/orders/", json={"shipping_address": "123 Test St\nMumbai, MH — 400001"}, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["status"] == "pending_payment"
        assert resp.json()["total_amount"] == 199.0

    def test_create_order_empty_cart(self, client, auth_headers):
        resp = client.post("/api/v1/orders/", json={"shipping_address": "Somewhere"}, headers=auth_headers)
        assert resp.status_code == 400
        assert "Cart is empty" in resp.json()["detail"]

    def test_pending_order_reuse(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        resp1 = client.post("/api/v1/orders/", json={"shipping_address": "Address 1"}, headers=auth_headers)
        resp2 = client.post("/api/v1/orders/", json={"shipping_address": "Address 2"}, headers=auth_headers)
        assert resp1.json()["id"] == resp2.json()["id"]
        assert resp2.json()["shipping_address"] == "Address 2"

    def test_stock_validation_at_cart(self, client, auth_headers, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Limited", "slug": "limited", "price": 99, "stock": 1,
        }, headers=admin_headers)
        pid = resp.json()["id"]

        cart_resp = client.post("/api/v1/cart/", json={"product_id": pid, "quantity": 5}, headers=auth_headers)
        assert cart_resp.status_code == 400
        assert "Only 1 available" in cart_resp.json()["detail"]

    def test_stock_validation_at_order(self, client, auth_headers, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Scarce", "slug": "scarce", "price": 99, "stock": 2,
        }, headers=admin_headers)
        pid = resp.json()["id"]

        client.post("/api/v1/cart/", json={"product_id": pid, "quantity": 2}, headers=auth_headers)
        # Reduce stock after cart add to simulate concurrent purchase
        client.put(f"/api/v1/products/{pid}", json={"stock": 0}, headers=admin_headers)
        order_resp = client.post("/api/v1/orders/", json={"shipping_address": "Test"}, headers=auth_headers)
        assert order_resp.status_code == 400
        assert "only" in order_resp.json()["detail"].lower()

    def test_out_of_stock_rejected_at_cart(self, client, auth_headers, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Gone", "slug": "gone", "price": 99, "stock": 0,
        }, headers=admin_headers)
        pid = resp.json()["id"]

        cart_resp = client.post("/api/v1/cart/", json={"product_id": pid, "quantity": 1}, headers=auth_headers)
        assert cart_resp.status_code == 400
        assert "out of stock" in cart_resp.json()["detail"].lower()

    def test_list_user_orders(self, client, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        client.post("/api/v1/orders/", json={"shipping_address": "Test"}, headers=auth_headers)

        resp = client.get("/api/v1/orders/", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_order_status_update_validates_enum(self, client, admin_headers, auth_headers, sample_product):
        client.post("/api/v1/cart/", json={"product_id": sample_product["id"], "quantity": 1}, headers=auth_headers)
        order = client.post("/api/v1/orders/", json={"shipping_address": "Test"}, headers=auth_headers).json()

        resp = client.patch(f"/api/v1/orders/{order['id']}/status", json={"status": "hacked"}, headers=admin_headers)
        assert resp.status_code == 422
