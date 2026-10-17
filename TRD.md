# Technical Requirements Document — UI Architecture

## Frontend choice

OpportunityKit remains a Streamlit application. A framework migration was not necessary because the existing business logic, local storage, and AI integration were already functional. The redesign uses native Streamlit layout primitives, forms, reruns, session state, and scoped CSS.

## Application shell

`app.py` owns the presentation shell and routes among seven workspace views: Overview, Discover, Opportunity details, Fit Report, Saved opportunities, Application tracker, Student profile, and About. The sidebar radio is the primary navigation. Button actions call a small `go()` helper that writes the destination and selected opportunity into session state before rerunning.

## Shared presentation primitives

The app defines shared color tokens, system-font typography, spacing, responsive breakpoints, surfaces, metric cards, opportunity cards, badges, semantic status classes, progress lines, report panels, and empty states in one scoped style block. Repeated content uses `metric()`, `page_intro()`, `status_html()`, and the same card markup patterns rather than page-specific palettes.

## Data flow

The UI reads opportunities through the cached JSON loader, reads profiles and saved records from SQLite, computes eligibility with `check_eligibility()`, computes relevance with `calculate_relevance()`, and requests Fit Reports through `generate_fit_report()`. No page duplicates or modifies those business rules.

## Responsive behavior

The main content uses wide columns on desktop and reduces padding and card minimum height below 800px. Streamlit's native column stacking handles narrow windows. Inputs remain native controls for keyboard and accessibility compatibility.

## Trust requirements

Demo data, source URL, last verified date, and the non-guarantee meaning of relevance are visible in discovery, details, dashboard, and Fit Report contexts. The app does not invent analytics, notifications, application outcomes, or verification claims.
