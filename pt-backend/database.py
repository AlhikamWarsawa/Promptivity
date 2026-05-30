import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "promptivity.db")

def init_db():
    # No tables required — app operates fully locally via frontend localStorage.
    # DB kept as a stub for potential future use.
    pass

@contextmanager
def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database stub at {DB_PATH} (no tables needed)")
