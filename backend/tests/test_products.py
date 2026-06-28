"""Tests for product endpoints — CRUD, slug lookup, input validation."""


class TestProductList:
    def test_list_products_public(self, client, sample_product):
        resp = client.get("/api/v1/products/")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_product_by_slug(self, client, sample_product):
        resp = client.get("/api/v1/products/slug/test-crunch")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Crunch"

    def test_slug_not_found(self, client):
        resp = client.get("/api/v1/products/slug/nonexistent")
        assert resp.status_code == 404


class TestProductValidation:
    def test_negative_price_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Bad", "slug": "bad", "price": -10, "stock": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_invalid_slug_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Bad", "slug": "BAD SLUG!", "price": 10, "stock": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_zero_price_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Free", "slug": "free", "price": 0, "stock": 1,
        }, headers=admin_headers)
        assert resp.status_code == 422

    def test_negative_stock_rejected(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Bad", "slug": "bad-stock", "price": 10, "stock": -5,
        }, headers=admin_headers)
        assert resp.status_code == 422


class TestProductCRUD:
    def test_create_product(self, client, admin_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "New Snack", "slug": "new-snack", "price": 149, "stock": 100,
        }, headers=admin_headers)
        assert resp.status_code == 201
        assert resp.json()["slug"] == "new-snack"

    def test_update_product(self, client, admin_headers, sample_product):
        resp = client.put(f"/api/v1/products/{sample_product['id']}", json={
            "price": 249,
        }, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["price"] == 249

    def test_deactivate_product(self, client, admin_headers, sample_product):
        resp = client.delete(f"/api/v1/products/{sample_product['id']}", headers=admin_headers)
        assert resp.status_code == 204

        resp = client.get(f"/api/v1/products/slug/test-crunch")
        assert resp.status_code == 404
