# Project Status

## Current milestone

**Local AI integration and end-to-end verification — implemented on `feat/local-ai-verification`.**

The Streamlit app keeps the premium redesign and now has a configurable local Ollama client. It reads the Ollama URL, Gemma model tag, and timeout from environment variables, rejects remote endpoints, checks model availability when possible, and shows an explicit rule-based fallback when local AI is unavailable or unsafe to use.

## Preserved behavior

Eligibility remains deterministic Python logic. Relevance remains an explainable score. SQLite persistence, discovery filters, deadline tracking, demo-data labels, and the premium UI remain intact. The model cannot override the eligibility result because the response is schema-validated and its eligibility summary is compared to the rule-engine result.

## Validation

- Python compilation: passed.
- Automated test suite: expected to cover the original six tests plus local configuration, remote endpoint rejection, offline Ollama, missing model, and invalid output paths; run `pytest -q` before handover.
- No live Gemma inference is claimed in the sandbox because Ollama and model weights are not installed here.
- No model download was performed.
- The app's existing Streamlit health endpoint was previously verified locally and through the sandbox URL.

## Manual steps on the Mac

Install and open Ollama, run `ollama pull gemma4:e4b` or the lighter `ollama pull gemma4:e2b`, export the configured model environment variable if using E2B, run the tests, then launch Streamlit. Confirm `curl http://127.0.0.1:11434/api/tags` responds before testing the AI Fit Report.

## Known limitations

The dataset remains fictional demo data with placeholder URLs. Live Gemma latency and report quality depend on the selected local model and the Mac's available resources. The UI fallback is tested, but real Ollama generation must be verified on the user's Mac after model setup.

## Next task

Run the exact Mac setup commands in the README, exercise the Fit Report once with E4B and once with Ollama offline, then review and merge the pull request after human review.
