
## 2026-10-17 — Local AI integration and verification

- Added environment-driven local Ollama configuration for URL, model tag, and timeout.
- Restricted AI calls to loopback URLs and prevented automatic model downloads.
- Added installed-model checks and explicit fallback reasons for offline, missing-model, timeout, and invalid-output cases.
- Preserved deterministic eligibility as the authoritative result and rejected model responses that attempt to change it.
- Added tests for configuration, remote endpoint rejection, offline Ollama, missing models, and invalid output.
- Expanded README setup and troubleshooting instructions and added `.env.example` and `DECISIONS.md`.
