import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hackai_dev.db")

# connect_args only needed for SQLite (for local dev without Docker)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Add new columns to existing tables (safe to run multiple times)."""
    with engine.connect() as conn:
        if conn.dialect.name == "sqlite":
            r = conn.execute(text("PRAGMA table_info(nodes)"))
            cols = [row[1] for row in r.fetchall()]
            if "goal_id" not in cols:
                conn.execute(text("ALTER TABLE nodes ADD COLUMN goal_id INTEGER"))
                conn.commit()
            r = conn.execute(text("PRAGMA table_info(user_goals)"))
            cols = [row[1] for row in r.fetchall()]
            if "goal_id" not in cols:
                conn.execute(text("ALTER TABLE user_goals ADD COLUMN goal_id INTEGER"))
                conn.commit()
        else:
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'nodes' AND column_name = 'goal_id'
            """))
            if r.fetchone() is None:
                conn.execute(text("ALTER TABLE nodes ADD COLUMN goal_id INTEGER REFERENCES learning_goals(id) ON DELETE CASCADE"))
                conn.commit()
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'user_goals' AND column_name = 'goal_id'
            """))
            if r.fetchone() is None:
                conn.execute(text("ALTER TABLE user_goals ADD COLUMN goal_id INTEGER REFERENCES learning_goals(id) ON DELETE SET NULL"))
                conn.commit()