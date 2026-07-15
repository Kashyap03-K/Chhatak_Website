"""Tests for authentication, JWT, password validation, and brute force protection."""


class TestRegistration:
    def test_register_success(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "SecurePass1",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["name"] == "Alice"
        assert data["is_admin"] is False

    def test_register_duplicate_email(self, client, registered_user):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Dupe",
            "email": "test@example.com",
            "password": "TestPass123",
        })
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]

    def test_register_weak_password_no_uppercase(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Bob",
            "email": "bob@example.com",
            "password": "weakpass1",
        })
        assert resp.status_code == 422

    def test_register_weak_password_no_digit(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Bob",
            "email": "bob@example.com",
            "password": "WeakPasss",
        })
        assert resp.status_code == 422

    def test_register_short_password(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Bob",
            "email": "bob@example.com",
            "password": "Ab1",
        })
        assert resp.status_code == 422

    def test_register_invalid_email(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "name": "Bob",
            "email": "not-an-email",
            "password": "TestPass123",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, registered_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "TestPass123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPass1",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "nobody@example.com",
            "password": "TestPass123",
        })
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid email or password"


class TestJWT:
    def test_invalid_token_rejected(self, client):
        resp = client.get("/api/v1/cart/", headers={"Authorization": "Bearer fake.token.here"})
        assert resp.status_code == 401

    def test_missing_token_rejected(self, client):
        resp = client.get("/api/v1/cart/")
        assert resp.status_code == 401

    def test_expired_token_rejected(self, client):
        from app.core.security import create_access_token
        from datetime import timedelta
        token = create_access_token({"sub": "999"}, expires_delta=timedelta(seconds=-1))
        resp = client.get("/api/v1/cart/", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
