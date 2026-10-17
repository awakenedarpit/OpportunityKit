# OpportunityKit UI/UX Audit — 2026-10-17

## What the live preview showed

The product was functional and coherent, but the visual language still read as a familiar Streamlit dashboard. The sidebar and main canvas were both light, so navigation had weak separation from the content. The Overview hero was strong but followed by a sequence of similarly weighted cards, which diluted the primary next action. Discover repeated large cards in a uniform grid, making 15 listings feel longer than necessary and making deadline, identity, and match information compete for attention. The default-profile state left large quiet areas without a clear first-run rhythm. The active route was indicated mostly by the radio control rather than by a deliberate navigation treatment.

The live screenshot also showed that the product's best differentiator—transparent fit assessment—was present in copy but not yet expressed as a distinctive editorial product experience. The app needed more information hierarchy, a stronger contrast between navigation and workspace, fewer rounded containers, and denser opportunity rows.

## Redesign direction

The reset uses an editorial workspace: a dark navigation rail, warm off-white canvas, a restrained midnight/mint/violet palette, compact type hierarchy, thin borders, and one strong hero surface only where it improves orientation. Opportunities become structured rows with a clear identity block, deadline block, fit state, and explicit actions. Overview becomes a first-run command center with one primary action, real deadline attention, and an evidence-led explanation of how the product works.

The redesign deliberately avoids adding decorative charts, fake activity, gradients, remote fonts, or new dependencies. Existing Python eligibility, relevance scoring, SQLite persistence, and local Ollama boundaries remain unchanged.
