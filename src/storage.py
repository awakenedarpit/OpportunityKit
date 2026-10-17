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
                CREATE TABLE IF NOT EXISTS saved (opportunity_id TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'Interested', tasks TEXT NOT NULL DEFAULT '[]', saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, origin TEXT NOT NULL DEFAULT 'user');
                CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            """)
            columns = {row["name"] for row in db.execute("PRAGMA table_info(saved)").fetchall()}
            if "origin" not in columns:
                db.execute("ALTER TABLE saved ADD COLUMN origin TEXT NOT NULL DEFAULT 'user'")

    def save_profile(self, profile: StudentProfile, origin: str = "user") -> None:
        with self._connect() as db:
            db.execute("INSERT OR REPLACE INTO profile(id, payload) VALUES (1, ?)", (json.dumps(profile.__dict__),))
            db.execute("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('profile_origin', ?)", (origin,))

    def load_profile(self) -> StudentProfile | None:
        with self._connect() as db:
            row = db.execute("SELECT payload FROM profile WHERE id=1").fetchone()
        if not row:
            return None
        return StudentProfile(**json.loads(row["payload"]))

    def set_saved(self, opportunity_id: str, saved: bool = True, origin: str = "user") -> None:
        with self._connect() as db:
            if saved:
                db.execute("INSERT OR IGNORE INTO saved(opportunity_id, origin) VALUES (?, ?)", (opportunity_id, origin))
            else:
                db.execute("DELETE FROM saved WHERE opportunity_id=?", (opportunity_id,))

    def is_saved(self, opportunity_id: str) -> bool:
        with self._connect() as db:
            return db.execute("SELECT 1 FROM saved WHERE opportunity_id=?", (opportunity_id,)).fetchone() is not None

    def saved_items(self) -> dict[str, dict]:
        with self._connect() as db:
            rows = db.execute("SELECT opportunity_id, status, tasks, origin FROM saved").fetchall()
        return {r["opportunity_id"]: {"status": r["status"], "tasks": json.loads(r["tasks"]), "origin": r["origin"]} for r in rows}

    def update_status(self, opportunity_id: str, status: str) -> None:
        with self._connect() as db:
            db.execute("UPDATE saved SET status=? WHERE opportunity_id=?", (status, opportunity_id))

    def update_tasks(self, opportunity_id: str, tasks: list[str]) -> None:
        with self._connect() as db:
            db.execute("UPDATE saved SET tasks=? WHERE opportunity_id=?", (json.dumps(tasks), opportunity_id))

    def get_meta(self, key: str, default: str | None = None) -> str | None:
        with self._connect() as db:
            row = db.execute("SELECT value FROM app_meta WHERE key=?", (key,)).fetchone()
        return row["value"] if row else default

    def has_any_records(self) -> bool:
        with self._connect() as db:
            profile = db.execute("SELECT 1 FROM profile LIMIT 1").fetchone()
            saved = db.execute("SELECT 1 FROM saved LIMIT 1").fetchone()
        return profile is not None or saved is not None

    def seed_demo_data(self, profile: StudentProfile, records: dict[str, str]) -> None:
        """Seed demo records without overwriting any existing user-owned records."""
        with self._connect() as db:
            profile_exists = db.execute("SELECT 1 FROM profile WHERE id=1").fetchone() is not None
            if not profile_exists:
                db.execute("INSERT INTO profile(id, payload) VALUES (1, ?)", (json.dumps(profile.__dict__),))
                db.execute("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('profile_origin', 'demo')")
            for opportunity_id, status in records.items():
                db.execute(
                    "INSERT OR IGNORE INTO saved(opportunity_id, status, origin) VALUES (?, ?, 'demo')",
                    (opportunity_id, status),
                )
            db.execute("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('demo_seeded', '1')")
            db.execute("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('demo_disabled', '0')")

    def clear_demo_data(self) -> None:
        """Remove only records created by the demo seed; never delete user-owned data."""
        with self._connect() as db:
            db.execute("DELETE FROM saved WHERE origin='demo'")
            profile_origin = db.execute("SELECT value FROM app_meta WHERE key='profile_origin'").fetchone()
            if profile_origin and profile_origin["value"] == "demo":
                db.execute("DELETE FROM profile WHERE id=1")
                db.execute("DELETE FROM app_meta WHERE key='profile_origin'")
            db.execute("INSERT OR REPLACE INTO app_meta(key, value) VALUES ('demo_disabled', '1')")
