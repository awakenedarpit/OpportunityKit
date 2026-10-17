# Architecture Decisions

## 2026-10-17 — Local Ollama configuration

OpportunityKit reads `OPPORTUNITYKIT_OLLAMA_URL`, `OPPORTUNITYKIT_MODEL`, and `OPPORTUNITYKIT_OLLAMA_TIMEOUT` from the environment. Defaults are `http://127.0.0.1:11434`, `gemma4:e4b`, and 60 seconds. The model name is therefore configured once and is not duplicated through the UI or client call sites.

Only loopback Ollama endpoints are accepted. This keeps the product honest about local inference and prevents an accidental cloud or remote endpoint from receiving student profile data. The app never runs `ollama pull` or downloads weights automatically.

Before a report request, the client checks the local model list when available. Offline services, missing models, timeouts, invalid JSON, invalid schema shapes, and attempts to change the deterministic eligibility summary all fall back to a useful rule-based report. The fallback source label includes a short reason so a student or judge can distinguish local AI output from deterministic text.

## 2026-10-17 — Deterministic eligibility remains authoritative

The Python eligibility result is passed to Gemma as evidence and is checked again after generation. A model response with a different eligibility summary is rejected. The Fit Report is explanatory; it never changes eligibility or relevance ranking.
