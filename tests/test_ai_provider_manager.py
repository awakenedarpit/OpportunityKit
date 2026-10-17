from dataclasses import replace

from src.ai_provider_manager import (
    AIProviderManager,
    AISettings,
    ProviderAuthenticationError,
    ProviderConfig,
    ProviderUnavailable,
    load_ai_settings,
)
from src.eligibility import check_eligibility
from src.models import Opportunity, StudentProfile


def inputs():
    profile = StudentProfile(education_level="Undergraduate", graduation_year=2028, skills=["Python"], interests=["AI/ML"])
    opportunity = Opportunity("x", "Synthetic role", "Demo Org", "Internship", "DEMO DATA", {"education_levels": ["Undergraduate"]}, ["Python"], "Remote", "2027-01-01", "", "2026-10-17")
    return profile, opportunity, check_eligibility(profile, opportunity)


def report_payload(eligibility):
    return {"choices": [{"message": {"content": '{"why_match":["Python overlaps"],"eligibility_summary":"%s","strengths":["Python"],"gaps":[],"next_steps":["Verify the listing"],"before_applying":["Check the deadline"]}' % eligibility.status}}]}


def settings(*names, external=True):
    providers = {
        "ollama": ProviderConfig("ollama", "ollama" in names, "gemma4:e4b", "", "http://127.0.0.1:11434"),
        "openrouter": ProviderConfig("openrouter", "openrouter" in names, "test-model", "secret-openrouter", "https://openrouter.test/v1"),
        "gemini": ProviderConfig("gemini", "gemini" in names, "test-gemini", "secret-gemini", "https://gemini.test/v1beta"),
        "grok": ProviderConfig("grok", "grok" in names, "test-grok", "secret-grok", "https://grok.test/v1"),
        "fallback": ProviderConfig("fallback", True, "deterministic"),
    }
    return AISettings(tuple(names) + ("fallback",), providers, external, 5)


def test_ollama_failure_then_openrouter_succeeds_without_real_requests(monkeypatch):
    profile, opportunity, eligibility = inputs()
    calls = []
    manager = AIProviderManager(settings("ollama", "openrouter"), http_post=lambda url, headers, payload, timeout: (calls.append(url) or report_payload(eligibility)))
    monkeypatch.setattr(manager, "_ollama", lambda *args: (_ for _ in ()).throw(ProviderUnavailable("offline")))

    report = manager.generate_fit_report(profile, opportunity, eligibility)

    assert report.source == "OpenRouter (test-model)"
    assert manager.last_status["ollama"] == "failed"
    assert manager.last_status["openrouter"] == "success"
    assert len(calls) == 1


def test_openrouter_failure_then_gemini_succeeds(monkeypatch):
    profile, opportunity, eligibility = inputs()
    calls = []

    def fake_post(url, headers, payload, timeout):
        calls.append(url)
        if "openrouter" in url:
            raise ProviderUnavailable("rate limited")
        return {"candidates": [{"content": {"parts": [{"text": report_payload(eligibility)["choices"][0]["message"]["content"]}]}}]}

    manager = AIProviderManager(settings("openrouter", "gemini"), http_post=fake_post)
    report = manager.generate_fit_report(profile, opportunity, eligibility)
    assert report.source == "Google Gemini (test-gemini)"
    assert calls == ["https://openrouter.test/v1/chat/completions", "https://gemini.test/v1beta/models/test-gemini:generateContent?key=secret-gemini"]


def test_gemini_failure_then_grok_succeeds():
    profile, opportunity, eligibility = inputs()
    calls = []

    def fake_post(url, headers, payload, timeout):
        calls.append(url)
        if "gemini" in url:
            raise ProviderUnavailable("timeout")
        return report_payload(eligibility)

    manager = AIProviderManager(settings("gemini", "grok"), http_post=fake_post)
    report = manager.generate_fit_report(profile, opportunity, eligibility)
    assert report.source == "xAI Grok (test-grok)"
    assert len(calls) == 2


def test_missing_key_is_skipped_and_deterministic_fallback_works():
    profile, opportunity, eligibility = inputs()
    providers = settings("openrouter", external=True).providers
    providers["openrouter"] = replace(providers["openrouter"], api_key="")
    manager = AIProviderManager(AISettings(("openrouter", "fallback"), providers, True, 2))
    report = manager.generate_fit_report(profile, opportunity, eligibility)
    assert report.source.startswith("Rule-based fallback")
    assert manager.last_status["openrouter"] == "not configured"
    assert report.eligibility_summary == eligibility.status


def test_authentication_error_does_not_retry_same_provider_or_expose_key():
    profile, opportunity, eligibility = inputs()
    calls = []

    def fake_post(url, headers, payload, timeout):
        calls.append(url)
        raise ProviderAuthenticationError("authentication failed (401)")

    manager = AIProviderManager(settings("openrouter"), http_post=fake_post)
    report = manager.generate_fit_report(profile, opportunity, eligibility)
    assert report.source.startswith("Rule-based fallback")
    assert len(calls) == 1
    assert "secret-openrouter" not in manager.last_error


def test_invalid_provider_output_cannot_change_deterministic_eligibility():
    profile, opportunity, eligibility = inputs()
    invalid = {"choices": [{"message": {"content": '{"why_match":[],"eligibility_summary":"Eligible","strengths":[],"gaps":[],"next_steps":[],"before_applying":[]}'}}]}
    manager = AIProviderManager(settings("openrouter"), http_post=lambda *args: invalid)
    report = manager.generate_fit_report(profile, opportunity, eligibility)
    assert report.source.startswith("Rule-based fallback")
    assert report.eligibility_summary == eligibility.status


def test_external_providers_are_disabled_by_default_and_invalid_attempts_are_bounded():
    settings = load_ai_settings({"OPPORTUNITYKIT_OLLAMA_URL": "http://127.0.0.1:11434", "OPPORTUNITYKIT_AI_MAX_ATTEMPTS": "not-a-number"})
    assert settings.external_enabled is False
    assert settings.max_attempts == 4
    assert settings.provider("openrouter").enabled is False
