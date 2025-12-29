import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.db.init_db import init_db
from app.db.session import init_engine
from app.main import app


@pytest.fixture()
def client(tmp_path):
    config.settings.database_url = f"sqlite:///{tmp_path}/test.db"
    config.settings.admin_api_key = "test-key"
    config.settings.env = "test"
    config.settings.llm_provider = "mock"
    init_engine()
    init_db()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides = {}
