from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any


@dataclass
class StudentProfile:
    name: str = ""
    education_level: str = ""
    field_of_study: str = ""
    graduation_year: int | None = None
    skills: list[str] = field(default_factory=list)
    interests: list[str] = field(default_factory=list)
    opportunity_types: list[str] = field(default_factory=list)
    location_preference: str = "Any"
    accessibility_preferences: str = ""


@dataclass
class Opportunity:
    id: str
    title: str
    organization: str
    category: str
    description: str
    eligibility: dict[str, Any]
    required_skills: list[str]
    location: str
    deadline: str
    source_url: str
    last_verified: str
    data_source: str = "Demo dataset"
    verification_status: str = "Demo data"

    @property
    def deadline_date(self) -> date | None:
        try:
            return date.fromisoformat(self.deadline)
        except (TypeError, ValueError):
            return None


@dataclass
class RuleResult:
    status: str
    reasons: list[str] = field(default_factory=list)
    missing_information: list[str] = field(default_factory=list)


@dataclass
class RelevanceResult:
    score: int
    components: dict[str, int]
    explanation: list[str]


@dataclass
class FitReport:
    why_match: list[str]
    eligibility_summary: str
    strengths: list[str]
    gaps: list[str]
    next_steps: list[str]
    before_applying: list[str]
    source: str = "Rule-based fallback"


def profile_from_dict(data: dict[str, Any]) -> StudentProfile:
    year = data.get("graduation_year")
    try:
        year = int(year) if year not in (None, "") else None
    except (TypeError, ValueError):
        year = None
    return StudentProfile(
        name=str(data.get("name", "")),
        education_level=str(data.get("education_level", "")),
        field_of_study=str(data.get("field_of_study", "")),
        graduation_year=year,
        skills=list(data.get("skills", [])),
        interests=list(data.get("interests", [])),
        opportunity_types=list(data.get("opportunity_types", [])),
        location_preference=str(data.get("location_preference", "Any")),
        accessibility_preferences=str(data.get("accessibility_preferences", "")),
    )
