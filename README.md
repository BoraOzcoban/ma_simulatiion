# Astorium M&A Stock Dashboard

Local-only single-page financial dashboard for M&A simulation.

## Run locally

1. `npm install`
2. `npm run dev`

Then open the local Vite URL (typically `http://localhost:5173`).

## Notes

- Fully client-side (no backend, no database, no external APIs).
- Stock price auto-updates every 30s using a truncated normal move distribution centered near 0%.
- Financial statement simulation keeps accounting identities consistent and rebalances the balance sheet via Investments as a plug item.
