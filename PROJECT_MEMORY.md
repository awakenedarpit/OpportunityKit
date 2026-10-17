# Project Memory

## 2026-10-17 — Premium redesign

The original app was a compact single-file Streamlit dashboard. The redesign intentionally kept that architecture and changed the presentation layer only. Navigation is stateful through `st.session_state["page"]`, so actions such as Details, Create Fit Report, Browse opportunities, and Build my profile now move to real pages instead of decorative controls.

The visual system uses midnight ink, warm off-white canvas, white surfaces, cobalt/indigo actions, slate metadata, and semantic green/amber/red states. The CSS uses system font stacks so the core app does not depend on a remote font service. Demo listings remain visibly labeled, and source/freshness context is repeated at the detail and Fit Report layers.

The strongest demo path is Overview → Discover → Opportunity Details → Fit Report → Saved opportunities → Application tracker. The Fit Report still receives deterministic results from Python first; local Gemma only explains supplied evidence and cannot override the result.

Next recommended task: perform browser screenshots at desktop and narrow widths, then open the focused branch as a pull request for review.
