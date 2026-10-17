from src.models import Opportunity, StudentProfile
from src.ollama_client import fallback_report
from src.storage import Storage
from src.eligibility import check_eligibility


def test_sqlite_save_unsave_and_status(tmp_path):
    store = Storage(tmp_path / "test.db")
    store.set_saved("demo-1")
    assert store.is_saved("demo-1")
    store.update_status("demo-1", "Applied")
    assert store.saved_items()["demo-1"]["status"] == "Applied"
    store.set_saved("demo-1", False)
    assert not store.is_saved("demo-1")


def test_fallback_report_is_grounded():
    opp = Opportunity("x", "Title", "Demo", "Hackathon", "desc", {}, ["Python"], "Remote", "2026-12-31", "https://example.com", "2026-10-01")
    profile = StudentProfile(skills=["Python"])
    eligibility = check_eligibility(profile, opp)
    report = fallback_report(profile, opp, eligibility)
    assert report.source == "Rule-based fallback"
    assert "https://example.com" in " ".join(report.before_applying)
    assert "guarantee" not in " ".join(report.next_steps).lower()
