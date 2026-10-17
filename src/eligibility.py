from __future__ import annotations

from .models import Opportunity, RuleResult, StudentProfile


def _norm(value: str) -> str:
    return value.strip().lower()


def _tokens(values: list[str]) -> set[str]:
    return {_norm(v) for v in values if v and v.strip()}


def check_eligibility(profile: StudentProfile, opportunity: Opportunity) -> RuleResult:
    reasons: list[str] = []
    missing: list[str] = []
    conflicts: list[str] = []
    rules = opportunity.eligibility or {}

    if rules.get("education_levels"):
        allowed = {_norm(v) for v in rules["education_levels"]}
        if not profile.education_level:
            missing.append("education level")
        elif _norm(profile.education_level) not in allowed:
            conflicts.append(f"Education level must be one of: {', '.join(rules['education_levels'])}.")
        else:
            reasons.append("Your education level matches the stated requirement.")

    if rules.get("graduation_year_min") is not None or rules.get("graduation_year_max") is not None:
        if profile.graduation_year is None:
            missing.append("graduation year")
        else:
            low, high = rules.get("graduation_year_min"), rules.get("graduation_year_max")
            if low is not None and profile.graduation_year < low:
                conflicts.append(f"Graduation year must be {low} or later.")
            elif high is not None and profile.graduation_year > high:
                conflicts.append(f"Graduation year must be {high} or earlier.")
            else:
                reasons.append("Your graduation year fits the stated range.")

    required = _tokens(opportunity.required_skills)
    have = _tokens(profile.skills)
    if required:
        missing_skills = sorted(required - have)
        if missing_skills:
            missing.append(f"skills: {', '.join(missing_skills)}")
        else:
            reasons.append("You list all required skills in your profile.")

    locations = {_norm(v) for v in rules.get("locations", [])}
    if locations:
        preference = _norm(profile.location_preference)
        opportunity_location = _norm(opportunity.location)
        if "remote" in opportunity_location or "remote" in preference or preference in {"any", "anywhere"}:
            reasons.append("Your location preference does not conflict with this listing.")
        elif preference and not any(loc in opportunity_location for loc in locations) and preference not in locations:
            conflicts.append(f"This opportunity is limited to: {', '.join(rules['locations'])}.")
        elif not preference:
            missing.append("location preference")

    if conflicts:
        return RuleResult("Not eligible based on known conflict", conflicts, missing)
    if missing:
        return RuleResult("Possibly eligible / needs verification", reasons, missing)
    return RuleResult("Eligible based on available information", reasons, [])
