
## 2026-10-17 — Premium colour system

- Migrated the application tokens to the required Midnight Navy, Deep Navy, Royal Indigo, Soft Lavender, Champagne Gold, Soft Ivory, Pure White, Slate Grey, and semantic state palette.
- Updated primary buttons, active navigation, focus rings, hero accents, cards, filters, and status indicators to use the shared tokens.
- Updated logo and favicon SVG assets to match the Indigo and Champagne identity.

## 2026-10-17 — Premium UI/UX reset

- Added a live visual audit in `UI_AUDIT.md` before implementation.
- Reworked the shell into a dark navigation rail with clearer workspace separation.
- Replaced the repeated Discover card grid with a denser opportunity index showing identity, deadline, fit, and actions in one row.
- Tightened type scale, spacing, border, radius, and shadow rules for a more editorial product feel.
- Preserved deterministic eligibility, relevance scoring, SQLite persistence, local Ollama boundaries, and all existing interactions.

## 2026-10-17 — Product identity and experience upgrade

- Added original compass-and-path logo assets, favicon, wordmark variants, and `BRAND_GUIDELINES.md`.
- Refined the application palette around midnight navy, mint, soft violet, and off-white surfaces.
- Upgraded Overview into a clearer product introduction with capability cards and grounded trust messaging.
- Added embedded logo rendering and reduced-motion support without introducing remote assets or new runtime services.

## 2026-10-17 — Local AI integration and verification

- Added environment-driven local Ollama configuration for URL, model tag, and timeout.
- Restricted AI calls to loopback URLs and prevented automatic model downloads.
- Added installed-model checks and explicit fallback reasons for offline, missing-model, timeout, and invalid-output cases.
- Preserved deterministic eligibility as the authoritative result and rejected model responses that attempt to change it.
- Added tests for configuration, remote endpoint rejection, offline Ollama, missing models, and invalid output.
- Expanded README setup and troubleshooting instructions and added `.env.example` and `DECISIONS.md`.
