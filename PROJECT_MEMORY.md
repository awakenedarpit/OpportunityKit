# Project Memory

## 2026-10-17 — Local AI verification milestone

The premium UI remains in place. The next milestone hardened `src/ollama_client.py` instead of changing the UI or business rules. Configuration is environment-driven: `OPPORTUNITYKIT_OLLAMA_URL`, `OPPORTUNITYKIT_MODEL`, and `OPPORTUNITYKIT_OLLAMA_TIMEOUT`. The client accepts only loopback Ollama URLs, never downloads models, checks the installed model list when available, and uses the official Ollama Python client with a bounded timeout.

The Fit Report flow remains rules first, AI second. Offline services, missing models, slow/error responses, invalid JSON, malformed report shapes, and model attempts to change eligibility all return the useful deterministic fallback and an explicit source reason.

The repository now includes `DECISIONS.md`, `.env.example`, expanded Ollama tests, and exact macOS setup/troubleshooting instructions in `README.md`. Live Gemma inference still requires manual verification on the user's Mac because this sandbox does not have Ollama or model weights.

## 2026-10-17 — Brand and experience upgrade

OpportunityKit now has an original compass-and-path identity with color, dark, light, monochrome, and favicon SVG assets under `assets/`. The Streamlit shell embeds the light wordmark directly, uses a midnight navy/mint/violet/off-white palette, and presents the four product pillars on Overview: discovery, deterministic fit, progress tracking, and grounded local AI. `BRAND_GUIDELINES.md` documents usage and accessibility rules. Existing data flow, eligibility behavior, local inference boundary, and storage were intentionally preserved.

## 2026-10-17 — Premium UI/UX reset

A live browser audit found the earlier version still looked like a generic Streamlit dashboard: light navigation lacked separation, Discover repeated large cards, and the strongest differentiator—transparent fit assessment—was visually diluted. The reset keeps the existing architecture but moves to a dark navigation rail, warm off-white workspace, tighter editorial hierarchy, fewer decorative containers, and a dense opportunity index. `UI_AUDIT.md` records the reasoning. Live Overview and Discover screens were inspected after the change; 11 tests still pass.

## 2026-10-17 — Exact premium palette

The visual tokens now follow the requested system exactly: Midnight Navy `#10182B`, Deep Navy `#17213A`, Royal Indigo `#6254E8`, Soft Lavender `#EEEAFE`, Champagne Gold `#D6B779`, Soft Ivory `#F7F8FC`, Pure White `#FFFFFF`, Slate Grey `#596780`, Muted Lavender Grey `#B8C2D9`, Border Grey `#E3E7F0`, Success Green `#16866A`, Warning Amber `#A86B16`, and Error Red `#C43D52`. Logo and favicon accents were updated in parallel. The live Overview was refreshed and visually checked after the migration.

## 2026-10-17 — Light/Dark mode and controls

The app now defaults to Light mode and exposes a sidebar Dark mode toggle backed by `st.session_state["theme"]`. The active theme is applied through centralized CSS variables and theme-specific component overrides. Streamlit/BaseWeb select menus, search inputs, text inputs, and forms use white surfaces with navy text in Light mode and `#202B3D` dark-slate surfaces with light text in Dark mode. The Discover Category menu was opened and visually checked in both themes; switching back preserved the Discover page.

## 2026-10-17 — Presentation demo data

The catalogue now has 23 records, including eight new synthetic listings for a hackathon presentation. `src/demo_data.py` owns the fictional profile and seeded save/application plan. `Storage` tracks `origin` on saved records and `profile_origin`/demo metadata in SQLite. Startup seeds only a pristine database; About provides repeatable Load/Clear controls. Demo records have no external URLs and are visibly labeled as not real. Existing user records are preserved during seed and clear operations.
