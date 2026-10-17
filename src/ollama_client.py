from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Mapping
from urllib.parse import urlparse

from .models import FitReport, Opportunity, RuleResult, StudentProfile

DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "gemma4:e4b"
DEFAULT_TIMEOUT_SECONDS = 60.0


@dataclass(frozen=True)
class OllamaConfig:
    """Local Ollama connection settings loaded from environment variables."""

    url: str = DEFAULT_OLLAMA_URL
    model: str = DEFAULT_MODEL
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS


class OllamaConfigurationError(RuntimeError):
    pass


class OllamaModelUnavailable(RuntimeError):
    pass


def load_ollama_config(environ: Mapping[str, str] | None = None) -> OllamaConfig:
    env = environ or os.environ
    url = env.get("OPPORTUNITYKIT_OLLAMA_URL", DEFAULT_OLLAMA_URL).rstrip("/")
    model = env.get("OPPORTUNITYKIT_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    raw_timeout = env.get("OPPORTUNITYKIT_OLLAMA_TIMEOUT", str(DEFAULT_TIMEOUT_SECONDS))
    try:
        timeout = float(raw_timeout)
    except ValueError:
        timeout = DEFAULT_TIMEOUT_SECONDS
    if timeout <= 0:
        timeout = DEFAULT_TIMEOUT_SECONDS
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise OllamaConfigurationError("Ollama must use a local URL such as http://127.0.0.1:11434")
    return OllamaConfig(url=url, model=model, timeout_seconds=timeout)


def fallback_report(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult, reason: str | None = None) -> FitReport:
    skills = {s.lower() for s in profile.skills}
    strengths = [f"Matching skill: {s}" for s in opportunity.required_skills if s.lower() in skills]
    gaps = eligibility.missing_information or [f"Review the requirement: {item}" for item in eligibility.reasons if "matches" not in item.lower()]
    if not strengths:
        strengths = ["Your profile has been compared using the information you entered."]
    source = "Rule-based fallback" if not reason else f"Rule-based fallback · {reason}"
    source_reference = f"Official source: {opportunity.source_url}" if opportunity.source_url else "Source: synthetic demo record — no external application link"
    return FitReport(
        why_match=[f"This is a {opportunity.category.lower()} opportunity from {opportunity.organization}.", *strengths[:2]],
        eligibility_summary=eligibility.status,
        strengths=strengths,
        gaps=gaps or ["No specific gaps were identified by the available rules; verify the official listing."],
        next_steps=["Read the official listing carefully.", "Prepare evidence for the required skills.", "Confirm all eligibility details before applying."],
        before_applying=[f"Deadline: {opportunity.deadline}", source_reference, "This is demo data; verify current details before applying."],
        source=source,
    )


def _model_names(client: Any) -> list[str]:
    response = client.list()
    models = response.get("models", []) if isinstance(response, dict) else getattr(response, "models", [])
    names: list[str] = []
    for item in models:
        if isinstance(item, dict):
            name = item.get("name") or item.get("model")
        else:
            name = getattr(item, "name", None) or getattr(item, "model", None)
        if name:
            names.append(str(name))
    return names


def _response_content(response: Any) -> str:
    message = response.get("message") if isinstance(response, dict) else getattr(response, "message", None)
    content = message.get("content") if isinstance(message, dict) else getattr(message, "content", None)
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Ollama returned an empty response")
    return content


def generate_fit_report(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult, model: str | None = None) -> FitReport:
    """Generate a grounded report locally, or return an honest useful fallback."""
    try:
        config = load_ollama_config()
        if model:
            config = OllamaConfig(config.url, model, config.timeout_seconds)
        from ollama import Client

        client = Client(host=config.url, timeout=config.timeout_seconds)
        try:
            installed = _model_names(client)
        except Exception as exc:
            raise RuntimeError("Ollama is offline or not responding") from exc
        if installed and config.model not in installed:
            raise OllamaModelUnavailable(f"model {config.model} is not installed")

        evidence = {"profile": profile.__dict__, "opportunity": opportunity.__dict__, "eligibility": eligibility.__dict__}
        fields = ["why_match", "strengths", "gaps", "next_steps", "before_applying"]
        schema = {"type": "object", "properties": {key: {"type": "array", "items": {"type": "string"}} for key in fields} | {"eligibility_summary": {"type": "string"}}, "required": fields + ["eligibility_summary"]}
        prompt = "Return only JSON matching this schema. Use only the supplied evidence. Never invent facts, URLs, deadlines, or guarantees. Clearly note uncertainty.\nSCHEMA:\n" + json.dumps(schema) + "\nEVIDENCE:\n" + json.dumps(evidence, default=str)
        response = client.chat(model=config.model, messages=[{"role": "user", "content": prompt}], format=schema, options={"temperature": 0})
        payload: Any = json.loads(_response_content(response))
        if not isinstance(payload, dict) or any(key not in payload or not isinstance(payload[key], (str, list)) for key in fields + ["eligibility_summary"]):
            raise ValueError("Ollama returned invalid Fit Report shape")
        if any(not isinstance(payload[key], list) or any(not isinstance(item, str) for item in payload[key]) for key in fields):
            raise ValueError("Ollama returned non-text Fit Report items")
        if payload["eligibility_summary"] != eligibility.status:
            raise ValueError("model changed deterministic eligibility")
        return FitReport(source=f"Gemma via local Ollama ({config.model})", **payload)
    except OllamaConfigurationError as exc:
        return fallback_report(profile, opportunity, eligibility, str(exc))
    except OllamaModelUnavailable as exc:
        return fallback_report(profile, opportunity, eligibility, str(exc))
    except Exception as exc:
        message = str(exc).lower()
        reason = "Ollama unavailable" if any(term in message for term in ["offline", "connect", "timeout", "refused", "timed out"]) else "local model response unavailable"
        return fallback_report(profile, opportunity, eligibility, reason)
