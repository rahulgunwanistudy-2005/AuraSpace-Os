# AuraSpace OS

Live: https://auraspace-os.vercel.app

A browser-based orbital conjunction console. You pick a close-approach scenario, scrub a
timeline from T-72h toward closest approach, and watch the collision probability move as
the covariance tightens. Pick an avoidance burn and it re-propagates and recomputes Pc.
There's also an operations side — a CelesTrak catalog feed, CDM ingest, a triage queue,
and a Gemini "explain this score" endpoint — backed by FastAPI.

The orbital math runs in the browser (`src/orbital`). The 3D console works on its own with
nothing else running. The backend only powers the dashboard/ops views.

## Stack

- Frontend: React 19, React Three Fiber, Zustand, Tailwind v4, Vite (single-file build).
- Backend: FastAPI. SGP4 from `satellite.js` on the client; the server does catalog,
  CDM parsing, threat scoring, and Gemini calls.
- Hosting: one Vercel project. Static frontend + FastAPI as a Python serverless function
  mounted at `/api`, so the browser hits the API same-origin (no CORS in prod).

## Running it locally

Frontend:

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # Vitest, 8 physics/pipeline tests
npm run build    # production bundle
npm run lint
```

Backend (only if you want the ops views to pull live data):

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
echo "GEMINI_API_KEY=..." > .env                  # only the Gemini endpoints need this
uvicorn main:app --reload --port 8000
```

In prod the frontend calls `/api/v1/...` same-origin. Locally the backend runs on `:8000`
and the components currently have that hardcoded — so local dev works as-is without any
extra config.

## What needs the backend

The 3D investigation flow doesn't. Everything else does:

| View                              | Backend? | Endpoint                                                    |
|-----------------------------------|----------|------------------------------------------------------------|
| 3D timeline / B-plane / Pc / burns| no       | client-side engine                                         |
| Command Center alerts             | optional | `/api/v1/cdms` (falls back to demo data)                   |
| Catalog                           | yes      | `/api/v1/catalog` (proxies CelesTrak, cached 1h)           |
| Conjunctions / triage             | yes      | `/api/v1/triage_queue`, `/agent_activity`, `/.../reasoning`|
| Operations                        | yes      | `/api/v1/operations`                                       |
| Reports                           | yes      | `/api/v1/reports`                                          |
| Copilot                           | yes      | `/api/v1/cdms/{id}/evaluate` (Gemini)                      |

No key, no crash — the Gemini endpoints just return an error string instead of a brief.

## What's real, what's faked

Real: every Pc, covariance ellipse, B-plane mean, and post-burn Pc is computed from the
scenario TLEs. The triage score (`backend/triage_engine.py`) is a deterministic 0–100
weighting of Pc, miss distance, time-to-TCA, asset class, and relative velocity — Gemini
only writes prose around the number it's handed, it never scores anything itself.

Faked: dollar values, downtime, the per-strategy "recommendation" labels, and the
active-CDM / operations / reports lists (mock fixtures). The CelesTrak catalog is live.

## The physics

- Propagation: SGP4 (`satellite.js`).
- Encounter plane: relative state projected into the B-plane; the 2D covariance is the
  3D position covariance projected onto that plane.
- Pc: 2D Foster point-mass integral. For near-singular geometry (very low relative
  velocity, where the B-plane projection blows up) it falls back to an Alfriend–Akella
  CWH Monte Carlo instead.
- Maneuvers: burn applied at the maneuver epoch, then coasted to TCA and re-evaluated.
- TLEs are checksum-validated on load and fail loud rather than propagating garbage.

Three bundled scenarios, each a real propagatable pair around 2026-06-10 12:00 UTC:

| Scenario | Encounter                          | Miss   | Pc     | Tier     |
|----------|------------------------------------|--------|--------|----------|
| A        | Comm sat vs spent rocket body      | ~7 km  | 1.5e-4 | Critical |
| B        | Earth-obs sat vs debris            | ~14 km | 1.5e-5 | Warning  |
| C        | Starlink-like sat vs CubeSat       | ~40 km | 7.3e-7 | Safe     |

Space toggles immersive mode, Esc exits. "Judge Mode" plays a scripted triage-to-maneuver
walkthrough.

## Layout

```
src/
  orbital/      SGP4 wrapper, B-plane, Foster Pc, CWH Monte Carlo, maneuvers, TLE parser
  components/   R3F scene, HUD, and the dashboard/ops views
  scenes/       top-level scene composition
  state/        Zustand store + the cinematic sequence orchestration
  data/         scenario definitions (TLE pairs + strategies)
  tests/        Vitest
public/textures/ Earth + Moon maps (~2.5 MB, served static)
backend/
  main.py         FastAPI app + endpoints
  cdm_parser.py   CCSDS CDM (KVP) parser
  triage_engine.py deterministic scoring
  gemini_agent.py  Gemini reasoning (needs GEMINI_API_KEY)
```

## Roadmap — next round

- **Persistent state layer.** Move the active-CDM store, agent activity log, catalog cache,
  and escalation set out of in-memory module globals into a durable store (Vercel KV /
  Redis / Postgres). This makes ingested conjunctions survive across requests and unlocks
  multi-operator sessions and historical replay.
- **Live CDM ingestion from real feeds.** Wire the parser to a real Space-Track / CelesTrak
  SOCRATES pull on a schedule, so the triage queue runs on genuine daily conjunction data
  instead of the current fixture set, while keeping the bundled scenarios as a deterministic
  demo mode.
- **Full covariance propagation.** Replace the heuristic time-to-TCA covariance scaling with
  covariance carried directly from the CDM (or propagated via the state-transition matrix),
  so the B-plane ellipse and Pc reflect the actual reported uncertainty rather than a
  modeled approximation.
- **Configurable API base + environments.** Route all frontend calls through `VITE_API_BASE`
  so local, preview, and prod builds target the right backend cleanly, and lock CORS down to
  the deployed origin instead of the demo-wide `*`.
- **Maneuver optimizer.** Move from three preset burns (radial / in-track / cross-track) to a
  solver that searches Δv direction and magnitude for the minimum-fuel maneuver that drops
  Pc below the operator's threshold, with a Pareto fuel-vs-risk view.
- **Hardening pass.** Upgrade the Gemini SDK to `google-genai`, clear the Three.js r168
  deprecations, trim unused deps, and add CI (lint + Vitest) on every push.
- ...and continued iteration on the 3D ops console UX based on round-one judge feedback.