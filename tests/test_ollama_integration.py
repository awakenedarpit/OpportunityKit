import sys
import types

from src.eligibility import check_eligibility
from src.models import Opportunity, StudentProfile
from src.ollama_client import (
    DEFAULT_MODEL,
    OllamaConfigurationError,
    generate_fit_report,
    load_ollama_config,
)


def sample_inputs():
    opportunity = Opportunity("x", "Title", "Demo", "Hackathon", "desc", {}, ["Python"], "Remote", "2026-12-31", "https://example.com", "2026-10-01")
    profile = StudentProfile(skills=["Python"])
    return profile, opportunity, check_eligibility(profile, opportunity)


def test_config_reads_environment_and_defaults():
    config = load_ollama_config({"OPPORTUNITYKIT_MODEL": "gemma4:e2b", "OPPORTUNITYKIT_OLLAMA_URL": "http://localhost:11434", "OPPORTUNITYKIT_OLLAMA_TIMEOUT": "12"})
    assert config.model == "gemma4:e2b"
    assert config.url == "http://localhost:11434"
    assert config.timeout_seconds == 12
    assert load_ollama_config({}).model == DEFAULT_MODEL


def test_config_rejects_remote_endpoint():
    try:
        load_ollama_config({"OPPORTUNITYKIT_OLLAMA_URL": "https://example.com"})
    except OllamaConfigurationError:
        pass
    else:
        raise AssertionError("remote Ollama endpoints must be rejected")


def test_offline_ollama_returns_useful_fallback(monkeypatch):
    class OfflineClient:
        def __init__(self, **kwargs):
            pass
        def list(self):
            raise ConnectionError("connection refused")

    monkeypatch.setitem(sys.modules, "ollama", types.SimpleNamespace(Client=OfflineClient))
    report = generate_fit_report(*sample_inputs())
    assert report.source.startswith("Rule-based fallback")
    assert "Ollama unavailable" in report.source


def test_missing_model_returns_fallback_without_downloading(monkeypatch):
    class Client:
        def __init__(self, **kwargs):
            pass
        def list(self):
            return {"models": [{"name": "gemma4:e2b"}]}
        def chat(self, **kwargs):
            raise AssertionError("chat must not run for a missing configured model")

    monkeypatch.setenv("OPPORTUNITYKIT_MODEL", "gemma4:e4b")
    monkeypatch.setitem(sys.modules, "ollama", types.SimpleNamespace(Client=Client))
    report = generate_fit_report(*sample_inputs())
    assert "not installed" in report.source


def test_invalid_model_output_cannot_override_eligibility(monkeypatch):
    profile, opportunity, eligibility = sample_inputs()

    class Client:
        def __init__(self, **kwargs):
            pass
        def list(self):
            return {"models": []}
        def chat(self, **kwargs):
            return {"message": {"content": '{"why_match":[],"strengths":[],"gaps":[],"next_steps":[],"before_applying":[],"eligibility_summary":"Eligible"}'}}

    monkeypatch.setitem(sys.modules, "ollama", types.SimpleNamespace(Client=Client))
    report = generate_fit_report(profile, opportunity, eligibility)
    assert report.source.startswith("Rule-based fallback")
    assert report.eligibility_summary == eligibility.status
