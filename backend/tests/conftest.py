import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
app.state.limiter = Limiter(key_func=get_remote_address, enabled=False)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    resp = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "TestPass123",
    })
    data = resp.json()
    return {"token": data["access_token"], "user_id": data["user_id"]}


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest.fixture
def admin_user(client):
    resp = client.post("/api/v1/auth/register", json={
        "name": "Admin",
        "email": "admin@example.com",
        "password": "AdminPass123",
    })
    data = resp.json()
    db = TestSession()
    from app.models.user import User
    user = db.query(User).filter(User.id == data["user_id"]).first()
    user.is_admin = True
    db.commit()
    db.close()
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "AdminPass123",
    })
    return {"token": login_resp.json()["access_token"], "user_id": data["user_id"]}


@pytest.fixture
def admin_headers(admin_user):
    return {"Authorization": f"Bearer {admin_user['token']}"}


@pytest.fixture
def sample_product(admin_headers, client):
    resp = client.post("/api/v1/products/", json={
        "name": "Test Crunch",
        "slug": "test-crunch",
        "description": "Crunchy test snack",
        "price": 199.0,
        "stock": 50,
        "flavor": "Original",
    }, headers=admin_headers)
    return resp.json()
