from __future__ import annotations

from src.models import StudentProfile

DEMO_PROFILE = StudentProfile(
    name="Aarav Mehta",
    education_level="Undergraduate",
    field_of_study="B.Tech in Computer Science",
    graduation_year=2028,
    skills=["Python", "SQL", "Git", "Streamlit", "Basic machine learning"],
    interests=["AI/ML", "Hackathons", "Software development", "Research", "Internships"],
    opportunity_types=["Internship", "Scholarship", "Hackathon", "Competition", "Fellowship"],
    location_preference="India",
    accessibility_preferences="",
)

# Three seeded saves create a useful overview. Two are deliberately in progress.
DEMO_SAVED_RECORDS = {
    "demo-python-internship": "Planning",
    "demo-ai-research": "Applied",
    "demo-innovation-challenge": "Interested",
}

DEMO_OPPORTUNITY_IDS = {
    "demo-python-internship",
    "demo-ai-research",
    "demo-innovation-challenge",
    "demo-open-source",
    "demo-ml-hackathon",
    "demo-data-internship",
    "demo-research-assistant",
    "demo-developer-scholarship",
}
