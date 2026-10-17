from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Mapping

from .models import FitReport, Opportunity, RuleResult, StudentProfile
from .ollama_client import (
    OllamaConfigurationError,
    OllamaModelUnavailable,
    _model_names,
    _response_content,
    fallback_report,
    load_ollama_config,
)

PROVIDERS = ("ollama", "openrouter", "gemini", "grok", "fallback")
DEFAULT_PRIORITY = ("ollama", "openrouter", "gemini", "grok", "fallback")
DEFAULT_MODELS = {
    "ollama": "gemma4:e4b",
    "openrouter": "",
    "gemini": "",
    "grok": "",
    "fallback": "deterministic",
}
DEFAULT_TIMEOUT_SECONDS = 30.0

HttpPost = Callable[[str, dict[str, str], dict[str, Any], float], dict[str, Any]]


class ProviderConfigurationError(RuntimeError):
    pass


class ProviderAuthenticationError(RuntimeError):
    pass


class ProviderUnavailable(RuntimeError):
    pass


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    enabled: bool = True
    model: str = ""
    api_key: str = ""
    endpoint: str = ""
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS

    @property
    def configured(self) -> bool:
        if self.name in {"ollama", "fallback"}:
            return True
        return bool(self.api_key and self.model)


@dataclass(frozen=True)
class AISettings:
    priority: tuple[str, ...] = DEFAULT_PRIORITY
    providers: dict[str, ProviderConfig] = field(default_factory=dict)
    external_enabled: bool = False
    max_attempts: int = 4

    def provider(self, name: str) -> ProviderConfig:
        return self.providers.get(name, ProviderConfig(name=name, enabled=False))


def _float_env(env: Mapping[str, str], key: str, default: float) -> float:
    try:
        value = float(env.get(key, str(default)))
        return value if value > 0 else default
    except (TypeError, ValueError):
        return default


def _bool_env(env: Mapping[str, str], key: str, default: bool = False) -> bool:
    return env.get(key, "true" if default else "false").strip().lower() in {"1", "true", "yes", "on"}


def load_ai_settings(environ: Mapping[str, str] | None = None) -> AISettings:
    env = environ or os.environ
    raw_priority = env.get("OPPORTUNITYKIT_AI_PRIORITY", ",".join(DEFAULT_PRIORITY))
    priority = tuple(item.strip().lower() for item in raw_priority.split(",") if item.strip() in PROVIDERS)
    priority = tuple(dict.fromkeys(priority)) or DEFAULT_PRIORITY
    timeout = _float_env(env, "OPPORTUNITYKIT_AI_TIMEOUT", DEFAULT_TIMEOUT_SECONDS)
    ollama = load_ollama_config(env)
    providers = {
        "ollama": ProviderConfig("ollama", True, ollama.model, "", ollama.url, ollama.timeout_seconds),
        "openrouter": ProviderConfig("openrouter", _bool_env(env, "OPPORTUNITYKIT_OPENROUTER_ENABLED"), env.get("OPPORTUNITYKIT_OPENROUTER_MODEL", "").strip(), env.get("OPENROUTER_API_KEY", ""), env.get("OPPORTUNITYKIT_OPENROUTER_URL", "https://openrouter.ai/api/v1").rstrip("/"), timeout),
        "gemini": ProviderConfig("gemini", _bool_env(env, "OPPORTUNITYKIT_GEMINI_ENABLED"), env.get("OPPORTUNITYKIT_GEMINI_MODEL", "").strip(), env.get("GEMINI_API_KEY", ""), env.get("OPPORTUNITYKIT_GEMINI_URL", "https://generativelanguage.googleapis.com/v1beta").rstrip("/"), timeout),
        "grok": ProviderConfig("grok", _bool_env(env, "OPPORTUNITYKIT_GROK_ENABLED"), env.get("OPPORTUNITYKIT_GROK_MODEL", "").strip(), env.get("XAI_API_KEY", ""), env.get("OPPORTUNITYKIT_GROK_URL", "https://api.x.ai/v1").rstrip("/"), timeout),
        "fallback": ProviderConfig("fallback", True, "deterministic", "", "", timeout),
    }
    try:
        raw_attempts = int(env.get("OPPORTUNITYKIT_AI_MAX_ATTEMPTS", "4"))
    except (TypeError, ValueError):
        raw_attempts = 4
    return AISettings(priority=priority, providers=providers, external_enabled=_bool_env(env, "OPPORTUNITYKIT_ENABLE_EXTERNAL_AI"), max_attempts=min(max(raw_attempts, 1), 5))


def masked_key(value: str) -> str:
    if not value:
        return "Not configured"
    return f"{value[:4]}…{value[-4:]}" if len(value) > 8 else "Configured"


def _http_post(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code in {401, 403}:
            raise ProviderAuthenticationError(f"authentication failed ({exc.code})") from exc
        if exc.code in {408, 429} or exc.code >= 500:
            raise ProviderUnavailable(f"provider HTTP {exc.code}") from exc
        raise ProviderConfigurationError(f"provider rejected request ({exc.code})") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise ProviderUnavailable("connection or timeout") from exc


def _evidence(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> str:
    return json.dumps({"profile": profile.__dict__, "opportunity": opportunity.__dict__, "eligibility": eligibility.__dict__}, default=str)


def _prompt(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> str:
    schema = {"why_match": ["string"], "eligibility_summary": "string", "strengths": ["string"], "gaps": ["string"], "next_steps": ["string"], "before_applying": ["string"]}
    return "Return only JSON matching this schema. Use only the supplied evidence. Never invent facts, URLs, deadlines, stipends, organizations, or guarantees. Preserve the deterministic eligibility_summary exactly.\nSCHEMA:\n" + json.dumps(schema) + "\nEVIDENCE:\n" + _evidence(profile, opportunity, eligibility)


def _parse_report(payload: Any, eligibility: RuleResult, provider_label: str) -> FitReport:
    if isinstance(payload, str):
        text = payload.strip()
        if text.startswith("```"):
            text = text.strip("`").replace("json\n", "", 1).strip()
        payload = json.loads(text)
    fields = ["why_match", "strengths", "gaps", "next_steps", "before_applying"]
    if not isinstance(payload, dict) or any(not isinstance(payload.get(key), list) or any(not isinstance(item, str) for item in payload[key]) for key in fields):
        raise ValueError("provider returned an invalid Fit Report shape")
    if payload.get("eligibility_summary") != eligibility.status:
        raise ValueError("provider changed deterministic eligibility")
    return FitReport(source=provider_label, eligibility_summary=eligibility.status, **{key: payload[key] for key in fields})


class AIProviderManager:
    def __init__(self, settings: AISettings | None = None, http_post: HttpPost | None = None) -> None:
        self.settings = settings or load_ai_settings()
        self.http_post = http_post or _http_post
        self.last_status: dict[str, str] = {}
        self.last_error: str = ""

    def _ollama(self, config: ProviderConfig, profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> FitReport:
        try:
            from ollama import Client
            client = Client(host=config.endpoint, timeout=config.timeout_seconds)
            installed = _model_names(client)
            if installed and config.model not in installed:
                raise OllamaModelUnavailable(f"model {config.model} is not installed")
            response = client.chat(model=config.model, messages=[{"role": "user", "content": _prompt(profile, opportunity, eligibility)}], options={"temperature": 0})
            return _parse_report(_response_content(response), eligibility, f"Gemma via local Ollama ({config.model})")
        except (OllamaConfigurationError, OllamaModelUnavailable):
            raise
        except Exception as exc:
            raise ProviderUnavailable("Ollama unavailable") from exc

    def _openai_compatible(self, config: ProviderConfig, profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult, label: str) -> FitReport:
        if not config.api_key or not config.model:
            raise ProviderConfigurationError(f"{label} key or model is not configured")
        payload = {"model": config.model, "messages": [{"role": "user", "content": _prompt(profile, opportunity, eligibility)}], "temperature": 0, "response_format": {"type": "json_object"}}
        response = self.http_post(config.endpoint + "/chat/completions", {"Authorization": f"Bearer {config.api_key}"}, payload, config.timeout_seconds)
        try:
            content = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError(f"{label} returned an empty response") from exc
        return _parse_report(content, eligibility, f"{label} ({config.model})")

    def _gemini(self, config: ProviderConfig, profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> FitReport:
        if not config.api_key or not config.model:
            raise ProviderConfigurationError("Gemini key or model is not configured")
        url = f"{config.endpoint}/models/{urllib.parse.quote(config.model, safe='')}:generateContent?key={urllib.parse.quote(config.api_key)}"
        response = self.http_post(url, {}, {"contents": [{"parts": [{"text": _prompt(profile, opportunity, eligibility)}]}], "generationConfig": {"temperature": 0}}, config.timeout_seconds)
        try:
            content = response["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Gemini returned an empty response") from exc
        return _parse_report(content, eligibility, f"Google Gemini ({config.model})")

    def _call(self, name: str, config: ProviderConfig, profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> FitReport:
        if name == "ollama":
            return self._ollama(config, profile, opportunity, eligibility)
        if name == "openrouter":
            return self._openai_compatible(config, profile, opportunity, eligibility, "OpenRouter")
        if name == "grok":
            return self._openai_compatible(config, profile, opportunity, eligibility, "xAI Grok")
        if name == "gemini":
            return self._gemini(config, profile, opportunity, eligibility)
        return fallback_report(profile, opportunity, eligibility)

    def generate_fit_report(self, profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> FitReport:
        self.last_status = {}
        self.last_error = ""
        attempts = 0
        for name in self.settings.priority:
            if attempts >= self.settings.max_attempts:
                break
            config = self.settings.provider(name)
            if not config.enabled or (name not in {"ollama", "fallback"} and not self.settings.external_enabled):
                self.last_status[name] = "disabled"
                continue
            if name != "fallback" and not config.configured:
                self.last_status[name] = "not configured"
                continue
            attempts += 1
            try:
                report = self._call(name, config, profile, opportunity, eligibility)
                self.last_status[name] = "success"
                return report
            except ProviderAuthenticationError as exc:
                self.last_status[name] = "authentication error"
                self.last_error = f"{name}: authentication failed"
                continue
            except (ProviderConfigurationError, ProviderUnavailable, OllamaConfigurationError, OllamaModelUnavailable, ValueError) as exc:
                self.last_status[name] = "failed"
                self.last_error = f"{name}: {str(exc)[:160]}"
                continue
            except Exception:
                self.last_status[name] = "failed"
                self.last_error = f"{name}: provider request failed"
                continue
        self.last_status["fallback"] = "success"
        reason = self.last_error or "all configured providers unavailable"
        return fallback_report(profile, opportunity, eligibility, reason)

    def test_provider(self, name: str) -> tuple[bool, str]:
        config = self.settings.provider(name)
        if name == "fallback":
            return True, "Deterministic fallback is available"
        if not config.enabled:
            return False, "Provider is disabled"
        if name != "ollama" and not self.settings.external_enabled:
            return False, "External AI is disabled"
        if not config.configured:
            return False, "Provider key or model is not configured"
        return True, f"{name} is configured; a live generation test runs when a Fit Report is requested"
