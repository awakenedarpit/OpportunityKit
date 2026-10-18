# OpportunityKit — React Edition

OpportunityKit is a local-first opportunity discovery and eligibility companion for students. It brings internships, scholarships, hackathons, competitions, and fellowships into one calm, transparent dashboard without pretending that a match is a guarantee of selection.

> **Demo-data notice:** The included 15 listings are fictional demonstration entries. Their `example.com` links are placeholders and must not be presented as real application URLs.

## Features

- **Local-first student profile**: Stored locally on the user's browser via secure local storage.
- **Catalogue discovery & filtering**: Search by skills, keywords, category, location, and transparent profile eligibility status.
- **Deterministic eligibility rules**: Education level, graduation year, required skills, and location preferences are evaluated with clear Python/TypeScript logic distinguishing eligible, needs verification, and known conflicts. Missing information is never treated as proof.
- **Explainable 100-point relevance score**: Transparently broken down into:
  - Skills overlap (45 pts)
  - Interest / category alignment (20 pts)
  - Education level alignment (15 pts)
  - Location fit (10 pts)
  - Deadline suitability (10 pts)
- **Grounded Fit Reports**: Generates evidence-based fit summaries with local Gemma through Ollama when available, Google Gemini, OpenRouter, or xAI Grok, backed by an honest deterministic fallback. AI models are strictly constrained never to alter the deterministic eligibility verdict.
- **Saved opportunities & Application Tracker**: Manage opportunities with *Interested*, *Planning*, *Applied*, and *Completed* stages, complete with preparation checklists.
- **Theme support**: Polished dark mode (default) and light mode adhering to the official OpportunityKit brand guidelines.
- **Sample workspace**: Idempotent demo data loader and safe clear controls.

## Architecture

```text
React (Vite + TypeScript + Tailwind CSS)
  ├── lib/opportunities.ts ← data/opportunities.json
  ├── lib/eligibility.ts   ← Deterministic rule engine
  ├── lib/matching.ts      ← Explainable 100-point relevance scoring
  ├── lib/aiProvider.ts    ← Multi-provider AI manager (Ollama, Gemini, OpenRouter, Grok + Fallback)
  └── lib/storage.ts       ← Local client storage (profile & saved tracker items)
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Development

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```

Open `http://localhost:3000` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

## AI Setup & Local Inference

The application works out of the box using the built-in deterministic fallback without requiring any API keys or network requests.

To enable local Gemma inference:
1. Install [Ollama](https://ollama.com).
2. Pull the model:
   ```bash
   ollama pull gemma4:e4b
   # or lighter model
   ollama pull gemma4:e2b
   ```
3. Connect via the About → AI Settings panel in the app.

To use external providers (Google Gemini, OpenRouter, or xAI Grok), navigate to **About → AI Settings**, toggle **Allow external AI providers**, enter your API key, and configure your preferred model identifier.

## License

Apache-2.0. See [LICENSE](LICENSE).
