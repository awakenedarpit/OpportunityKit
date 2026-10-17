# OpportunityKit — SETU 2026

OpportunityKit is a local-first, open-source opportunity discovery and eligibility companion for students. It brings internships, scholarships, hackathons, competitions, and fellowships into one calm dashboard without pretending that a match is a guarantee of selection.

> **Demo-data notice:** the included 15 listings are fictional demonstration entries. Their `example.com` links are placeholders and must not be presented as real application URLs.

## What the MVP does

- Stores an editable student profile locally.
- Searches, filters, and sorts opportunities by deadline or transparent profile relevance.
- Uses ordinary Python rules for eligibility: education level, graduation year, skills, and location.
- Distinguishes eligible, possibly eligible, and known conflicts. Missing information is never treated as proof.
- Explains a 100-point relevance score using skills (45), interest/category (20), education (15), location (10), and deadline suitability (10).
- Generates a grounded Opportunity Fit Report with local Gemma through Ollama when available.
- Falls back to a useful rule-based report when Ollama is unavailable or returns invalid output.
- Saves opportunities in SQLite with Interested, Planning, Applied, and Completed statuses plus a preparation checklist.
- Shows source URLs, last-verified dates, demo-data labels, and privacy notes.

The score is a measure of profile relevance. It is not a probability of selection or winning.

## Architecture

```text
Streamlit UI (app.py)
  ├── data_loader.py → data/opportunities.json
  ├── eligibility.py → deterministic rules
  ├── matching.py → explainable score
  ├── ollama_client.py → local Gemma + validated JSON + fallback
  └── storage.py → local SQLite (profile and saved items)
```

## macOS setup

The core demo requires no API key or paid service.

```bash
git clone https://github.com/awakenedarpit/OpportunityKit.git
cd OpportunityKit
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
streamlit run app.py
```

Open the local URL Streamlit prints, usually `http://localhost:8501`.

### Optional local AI setup

Install [Ollama](https://ollama.com/download) for macOS, then verify it:

```bash
ollama --version
ollama pull gemma4:e4b
# lighter fallback for machines that need it:
ollama pull gemma4:e2b
ollama list
```

The current Ollama and Google documentation list `gemma4:e4b` and `gemma4:e2b` as supported Gemma 4 tags. The E4B download is listed at roughly 6.6–9.5 GB and E2B at roughly 4.6–7.5 GB on the Ollama model page; disk usage is not the same as runtime memory usage. A 16 GB MacBook may need the E2B fallback depending on other workloads and available unified memory.

OpportunityKit only calls Ollama at `localhost` through the official Python library. It does not silently send profiles or prompts to a cloud model. The Fit Report prompt contains only the selected profile fields, selected opportunity, and deterministic rule results. Structured JSON output is requested and validated before display.

## Tests

```bash
pytest -q
```

The tests cover eligible, conflicting, and incomplete profiles; relevance components; SQLite save/unsave and status updates; and the grounded fallback report. Live Ollama inference is not claimed as tested in environments where Ollama is not installed.

## Dataset format

Add or edit JSON objects in `data/opportunities.json` with:

- `id`, `title`, `organization`, `category`, `description`
- `eligibility` with optional `education_levels`, `graduation_year_min`, `graduation_year_max`, and `locations`
- `required_skills`, `location`, `deadline` in `YYYY-MM-DD`
- `source_url`, `last_verified`, `data_source`, and `verification_status`

Do not mark a listing as verified without a real verification process. Future official feeds, authorized APIs, or verified manual submissions can populate the same schema without changing the UI or business logic. Do not scrape websites without permission.

## Privacy and limitations

Profile and saved-item data are local by default in `opportunitykit.db`. Do not commit that file. The MVP does not send notifications, guarantee eligibility, verify external listings automatically, or make application submissions. Users should confirm every requirement, deadline, and URL on the official source before applying.

## Open-source contribution

Issues and pull requests are welcome. Suggested next improvements are: a verified-source ingestion workflow, a richer rule schema with explicit tests for every new requirement type, and optional encrypted local storage. Keep AI grounded in supplied evidence and preserve the deterministic eligibility boundary.

## Live demo script

1. Open Discover and show the relevance score plus its component breakdown.
2. Create a profile with Python, Git, and an undergraduate graduation year.
3. Filter to Internships and open a Fit Report.
4. Explain that eligibility comes from Python rules, not the LLM.
5. Generate the report with Ollama, or demonstrate the honest fallback if Ollama is unavailable.
6. Save the opportunity, set status to Planning, and add a checklist.
7. Point out the fictional demo-data label and the official-source verification reminder.

## License

Apache-2.0. See [LICENSE](LICENSE).

## References

- [Ollama Gemma 4 model library](https://ollama.com/library/gemma4)
- [Google Gemma with Ollama](https://ai.google.dev/gemma/docs/integrations/ollama)
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
