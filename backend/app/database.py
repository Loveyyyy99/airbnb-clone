"""SQLAlchemy engine/session setup.

Two backends: SQLite for local development (and the assignment's required DB) and PostgreSQL when
DATABASE_URL points at one (needed on Vercel, where the filesystem is not persistent). Booking atomicity:
SQLite uses BEGIN IMMEDIATE; PostgreSQL locks the listing row (SELECT ... FOR UPDATE) before the overlap check.

SQLite runs in WAL mode with foreign keys enabled. Transactions are started with
BEGIN IMMEDIATE (for write requests) so that two concurrent bookings for the same dates are serialised:
the second one waits for the first to commit and then fails the overlap check.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

_is_sqlite = settings.database_url.startswith("sqlite")
if _is_sqlite:
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False, "timeout": 30})
else:
    # PostgreSQL (hosted, e.g. Neon): serverless functions are short-lived, so keep the pool tiny
    from sqlalchemy.pool import NullPool
    if settings.on_vercel:
        engine = create_engine(settings.database_url, poolclass=NullPool, pool_pre_ping=True)
    else:
        engine = create_engine(settings.database_url, pool_size=5, pool_pre_ping=True)

if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _on_connect(dbapi_conn, _):
        dbapi_conn.isolation_level = None  # we emit BEGIN ourselves (see below)
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA synchronous=NORMAL")
        cur.close()

    @event.listens_for(engine, "begin")
    def _on_begin(conn):
        # Write requests use `write_engine` (immediate=True) so they take the write lock up front.
        immediate = conn.get_execution_options().get("immediate", False)
        conn.exec_driver_sql("BEGIN IMMEDIATE" if immediate else "BEGIN")


write_engine = engine.execution_options(immediate=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
WriteSession = sessionmaker(bind=write_engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Read-only request session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_write_db():
    """Session for POST/PUT/PATCH/DELETE: BEGIN IMMEDIATE serialises concurrent writers."""
    db = WriteSession()
    try:
        yield db
    finally:
        db.close()
