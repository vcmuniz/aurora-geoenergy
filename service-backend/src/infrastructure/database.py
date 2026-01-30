from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "10"))

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=DATABASE_POOL_SIZE,
    max_overflow=0,
    echo=os.getenv("ENVIRONMENT") == "development"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency para injetar session no FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Cria todas as tabelas"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Remove todas as tabelas (apenas para desenvolvimento)"""
    Base.metadata.drop_all(bind=engine)
