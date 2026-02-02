import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, String, TypeDecorator
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects import postgresql
import uuid

# Monkey patch PostgreSQL UUID to work with SQLite
original_uuid = postgresql.UUID

class SQLiteUUID(TypeDecorator):
    """UUID type for SQLite"""
    impl = String
    cache_ok = True
    
    def __init__(self, as_uuid=False):
        super().__init__(36)
        self.as_uuid = as_uuid
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if self.as_uuid:
            return uuid.UUID(value) if isinstance(value, str) else value
        return value

# Replace PostgreSQL UUID with SQLite-compatible one for tests
postgresql.UUID = SQLiteUUID

from main import app
from src.infrastructure.database import Base, get_db
from src.infrastructure.orm.user import UserORM


@pytest.fixture(scope='function')
def test_db():
    engine = create_engine(
        'sqlite:///:memory:',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def client(test_db):
    def override_get_db():
        return test_db
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

