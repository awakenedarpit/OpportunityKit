from __future__ import annotations

import json
from typing import Any

from .models import FitReport, Opportunity, RuleResult, StudentProfile


def fallback_report(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult) -> FitReport:
    skills = {s.lower() for s in profile.skills}
    required = {s.lower() for s in opportunity.required_skills}
    strengths = [f"Matching skill: {s}" for s in opportunity.required_skills if s.lower() in skills]
    gaps = eligibility.missing_information or [f"Review the requirement: {reason}" for reason in eligibility.reasons if "matches" not in reason.lower()]
    if not strengths:
        strengths = ["Your profile has been compared using the information you entered."]
    return FitReport(
        why_match=[f"This is a {opportunity.category.lower()} opportunity from {opportunity.organization}.", *strengths[:2]],
        eligibility_summary=eligibility.status,
        strengths=strengths,
        gaps=gaps or ["No specific gaps were identified by the available rules; verify the official listing."],
        next_steps=["Read the official listing carefully.", "Prepare evidence for the required skills.", "Confirm all eligibility details before applying."],
        before_applying=[f"Deadline: {opportunity.deadline}", f"Official source: {opportunity.source_url}", "This is demo data; verify current details on the source page."],
    )


def generate_fit_report(profile: StudentProfile, opportunity: Opportunity, eligibility: RuleResult, model: str = "gemma4:e4b") -> FitReport:
    evidence = {"profile": profile.__dict__, "opportunity": opportunity.__dict__, "eligibility": eligibility.__dict__}
    schema = {"type": "object", "properties": {key: {"type": "array", "items": {"type": "string"}} for key in ["why_match", "strengths", "gaps", "next_steps", "before_applying"]} | {"eligibility_summary": {"type": "string"}}, "required": ["why_match", "eligibility_summary", "strengths", "gaps", "next_steps", "before_applying"]}
    prompt = "Return only JSON matching this schema. Use only the supplied evidence. Never invent facts, URLs, deadlines, or guarantees. Clearly note uncertainty.\nSCHEMA:\n" + json.dumps(schema) + "\nEVIDENCE:\n" + json.dumps(evidence, default=str)
    try:
        from ollama import chat
        response = chat(model=model, messages=[{"role": "user", "content": prompt}], format=schema, options={"temperature": 0})
        payload: Any = json.loads(response.message.content)
        required = ["why_match", "eligibility_summary", "strengths", "gaps", "next_steps", "before_applying"]
        if any(key not in payload or not isinstance(payload[key], (str, list)) for key in required):
            raise ValueError("Invalid Fit Report shape")
        if payload["eligibility_summary"] != eligibility.status:
            raise ValueError("Model changed deterministic eligibility")
        report = FitReport(source=f"Gemma via Ollama ({model})", **payload)
        return report
    except Exception:
        return fallback_report(profile, opportunity, eligibility)
