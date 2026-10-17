# Project Memory

## 2026-10-17 — Local AI verification milestone

The premium UI remains in place. The next milestone hardened `src/ollama_client.py` instead of changing the UI or business rules. Configuration is environment-driven: `OPPORTUNITYKIT_OLLAMA_URL`, `OPPORTUNITYKIT_MODEL`, and `OPPORTUNITYKIT_OLLAMA_TIMEOUT`. The client accepts only loopback Ollama URLs, never downloads models, checks the installed model list when available, and uses the official Ollama Python client with a bounded timeout.

The Fit Report flow remains rules first, AI second. Offline services, missing models, slow/error responses, invalid JSON, malformed report shapes, and model attempts to change eligibility all return the useful deterministic fallback and an explicit source reason.

The repository now includes `DECISIONS.md`, `.env.example`, expanded Ollama tests, and exact macOS setup/troubleshooting instructions in `README.md`. Live Gemma inference still requires manual verification on the user's Mac because this sandbox does not have Ollama or model weights.

## 2026-10-17 — Brand and experience upgrade

OpportunityKit now has an original compass-and-path identity with color, dark, light, monochrome, and favicon SVG assets under `assets/`. The Streamlit shell embeds the light wordmark directly, uses a midnight navy/mint/violet/off-white palette, and presents the four product pillars on Overview: discovery, deterministic fit, progress tracking, and grounded local AI. `BRAND_GUIDELINES.md` documents usage and accessibility rules. Existing data flow, eligibility behavior, local inference boundary, and storage were intentionally preserved.
