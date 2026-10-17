from datetime import date

from src.eligibility import check_eligibility
from src.matching import calculate_relevance
from src.models import Opportunity, StudentProfile


def opportunity(**changes):
    data = dict(id="x", title="Test", organization="Demo", category="Internship", description="x", eligibility={"education_levels":["Undergraduate"],"graduation_year_min":2027,"graduation_year_max":2029}, required_skills=["Python", "Git"], location="Remote", deadline="2026-12-31", source_url="https://example.com", last_verified="2026-10-01")
    data.update(changes)
    return Opportunity(**data)


def test_eligible_profile():
    result = check_eligibility(StudentProfile(education_level="Undergraduate", graduation_year=2028, skills=["Python", "Git"], location_preference="Any"), opportunity())
    assert result.status == "Eligible based on available information"


def test_not_eligible_on_education_conflict():
    result = check_eligibility(StudentProfile(education_level="Postgraduate", graduation_year=2028, skills=["Python", "Git"], location_preference="Any"), opportunity())
    assert result.status.startswith("Not eligible")


def test_missing_information_is_not_ineligible():
    result = check_eligibility(StudentProfile(skills=["Python"], location_preference="Any"), opportunity())
    assert result.status.startswith("Possibly eligible")
    assert "graduation year" in result.missing_information


def test_relevance_exposes_components():
    result = calculate_relevance(StudentProfile(education_level="Undergraduate", skills=["Python"], interests=["Internship"], location_preference="Remote"), opportunity(), date(2026, 10, 1))
    assert 0 < result.score <= 100
    assert "Skills overlap" in result.components
    assert result.components["Skills overlap"] > 0
