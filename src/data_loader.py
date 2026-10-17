from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import Opportunity

REQUIRED_FIELDS = {"id", "title", "organization", "category", "description", "eligibility", "required_skills", "location", "deadline", "source_url", "last_verified"}


def load_opportunities(path: str | Path) -> list[Opportunity]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Opportunity dataset must be a JSON array")
    opportunities: list[Opportunity] = []
    for index, item in enumerate(raw):
        if not isinstance(item, dict) or not REQUIRED_FIELDS.issubset(item):
            missing = sorted(REQUIRED_FIELDS - set(item or {}))
            raise ValueError(f"Opportunity {index} is missing fields: {', '.join(missing)}")
        opportunities.append(Opportunity(**item))
    return opportunities
