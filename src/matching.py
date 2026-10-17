from __future__ import annotations

from datetime import date

from .models import Opportunity, RelevanceResult, StudentProfile


def _norm(value: str) -> str:
    return value.strip().lower()


def calculate_relevance(profile: StudentProfile, opportunity: Opportunity, today: date | None = None) -> RelevanceResult:
    skills = {_norm(s) for s in profile.skills}
    required = {_norm(s) for s in opportunity.required_skills}
    interests = {_norm(i) for i in profile.interests}
    category = _norm(opportunity.category)
    overlap = len(skills & required)
    skill_score = round(45 * overlap / len(required)) if required else 0
    interest_score = 20 if category in interests or any(category in interest for interest in interests) else 0
    education_score = 15 if profile.education_level and profile.education_level.lower() in ' '.join(map(str, opportunity.eligibility.get('education_levels', []))).lower() else 0
    location_score = 10 if profile.location_preference in ('', 'Any') or 'remote' in opportunity.location.lower() or _norm(profile.location_preference) in _norm(opportunity.location) else 0
    reference = today or date.today()
    days = (opportunity.deadline_date - reference).days if opportunity.deadline_date else None
    deadline_score = 10 if days is not None and days >= 0 else 0
    components = {"Skills overlap": skill_score, "Interest/category": interest_score, "Education alignment": education_score, "Location fit": location_score, "Deadline suitability": deadline_score}
    score = min(100, sum(components.values()))
    explanation = [f"{name}: {value}/{'45' if name == 'Skills overlap' else '20' if name == 'Interest/category' else '15' if name == 'Education alignment' else '10'}" for name, value in components.items()]
    return RelevanceResult(score, components, explanation)
