import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, String, TypeDecorator
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from main import app
from src.infrastructure.database import Base, get_db
from src.infrastructure.orm.user import UserORM


class StringUUID(TypeDecorator):
    """Platform-independent GUID type for SQLite"""
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return uuid.UUID(value) if isinstance(value, str) else value


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
    
    # Patch UUID column for SQLite compatibility
    for col in Base.metadata.tables.get('users', {}).columns:
        if col.name == 'id':
            col.type = StringUUID()
            break
    
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

