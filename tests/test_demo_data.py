from src.data_loader import load_opportunities
from src.demo_data import DEMO_OPPORTUNITY_IDS, DEMO_PROFILE, DEMO_SAVED_RECORDS
from src.models import StudentProfile
from src.storage import Storage


def test_demo_seed_is_idempotent_and_has_expected_application_counts(tmp_path):
    store = Storage(tmp_path / "demo.db")
    store.seed_demo_data(DEMO_PROFILE, DEMO_SAVED_RECORDS)
    store.seed_demo_data(DEMO_PROFILE, DEMO_SAVED_RECORDS)

    saved = store.saved_items()
    assert set(saved) == set(DEMO_SAVED_RECORDS)
    assert sum(item["status"] in {"Planning", "Applied"} for item in saved.values()) == 2
    assert all(item["origin"] == "demo" for item in saved.values())
    assert store.load_profile().field_of_study == "B.Tech in Computer Science"


def test_demo_seed_never_overwrites_user_records(tmp_path):
    store = Storage(tmp_path / "separation.db")
    user_profile = StudentProfile(name="User", education_level="Undergraduate")
    store.save_profile(user_profile)
    store.set_saved("demo-python-internship", origin="user")
    store.seed_demo_data(DEMO_PROFILE, DEMO_SAVED_RECORDS)

    assert store.load_profile().name == "User"
    assert store.saved_items()["demo-python-internship"]["origin"] == "user"
    assert store.saved_items()["demo-python-internship"]["status"] == "Interested"


def test_clear_demo_data_preserves_user_records(tmp_path):
    store = Storage(tmp_path / "clear.db")
    store.set_saved("user-created", origin="user")
    store.seed_demo_data(DEMO_PROFILE, DEMO_SAVED_RECORDS)
    store.clear_demo_data()

    saved = store.saved_items()
    assert set(saved) == {"user-created"}
    assert store.load_profile() is None
    assert store.get_meta("demo_disabled") == "1"


def test_new_catalogue_records_are_explicit_synthetic_data():
    opportunities = load_opportunities("data/opportunities.json")
    seeded = {opportunity.id: opportunity for opportunity in opportunities if opportunity.id in DEMO_OPPORTUNITY_IDS}
    assert len(seeded) == 8
    assert all("DEMO DATA" in opportunity.description for opportunity in seeded.values())
    assert all(not opportunity.source_url for opportunity in seeded.values())
