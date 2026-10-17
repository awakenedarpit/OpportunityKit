from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .models import StudentProfile


class Storage:
    def __init__(self, path: str | Path = "opportunitykit.db") -> None:
        self.path = str(path)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS saved (opportunity_id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'Interested', tasks TEXT NOT NULL DEFAULT '[]', saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
            """)

    def save_profile(self, profile: StudentProfile) -> None:
        with self._connect() as db:
            db.execute("INSERT OR REPLACE INTO profile(id, payload) VALUES (1, ?)", (json.dumps(profile.__dict__),))

    def load_profile(self) -> StudentProfile | None:
        with self._connect() as db:
            row = db.execute("SELECT payload FROM profile WHERE id=1").fetchone()
        if not row:
            return None
        return StudentProfile(**json.loads(row["payload"]))

    def set_saved(self, opportunity_id: str, saved: bool = True) -> None:
        with self._connect() as db:
            if saved:
                db.execute("INSERT OR IGNORE INTO saved(opportunity_id) VALUES (?)", (opportunity_id,))
            else:
                db.execute("DELETE FROM saved WHERE opportunity_id=?", (opportunity_id,))

    def is_saved(self, opportunity_id: str) -> bool:
        with self._connect() as db:
            return db.execute("SELECT 1 FROM saved WHERE opportunity_id=?", (opportunity_id,)).fetchone() is not None

    def saved_items(self) -> dict[str, dict]:
        with self._connect() as db:
            rows = db.execute("SELECT opportunity_id, status, tasks FROM saved").fetchall()
        return {r["opportunity_id"]: {"status": r["status"], "tasks": json.loads(r["tasks"])} for r in rows}

    def update_status(self, opportunity_id: str, status: str) -> None:
        with self._connect() as db:
            db.execute("UPDATE saved SET status=? WHERE opportunity_id=?", (status, opportunity_id))

    def update_tasks(self, opportunity_id: str, tasks: list[str]) -> None:
        with self._connect() as db:
            db.execute("UPDATE saved SET tasks=? WHERE opportunity_id=?", (json.dumps(tasks), opportunity_id))
