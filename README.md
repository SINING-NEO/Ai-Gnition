# OneLastThing (Ai-Gnition)

> The last productivity tool you'll need. It **notices** repetitive work, **proposes** an automation, and a team of AI agents **builds and runs** it — with your approval.

Hackathon plan: [`docs/PLAN.md`](./docs/PLAN.md)

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Load Priya's week**, then **Automate** on a pattern.

Demo mode works without a Gemini key (deterministic Architect / Pattern Hunter fallbacks).

## What's in the MVP

| Surface | What it does |
|---|---|
| **Dashboard** | Seeded week of activity → mined patterns → time-saved meter |
| **Automate** | Architect builds a `WorkflowSpec`; Studio shows it in React Flow |
| **Guardian** | Risk badges + dry-run preview; approval before side effects |
| **Executor** | Mock tool registry with live SSE run log |
| **Ask** | Plain-English → workflow (`/chat`) |

### Agents

Observer → Pattern Hunter → Architect → Guardian → Executor → Reporter

### Stack

Next.js (App Router) · TypeScript · Tailwind · SQLite + Drizzle · `@google/genai` · React Flow

## API sketch

- `POST /api/seed` — reset demo data + detect patterns
- `GET /api/patterns` — list patterns (auto-seeds if empty)
- `POST /api/workflows` — `{ patternId }` or `{ prompt }`
- `POST /api/workflows/:id/approve`
- `POST /api/runs` + `GET /api/runs/:id/stream` (SSE)
- `POST /api/chat`

## Demo script (3 min)

1. Load Priya's week — ~7h of grind surfaces as pattern cards  
2. Automate **Order emails → Sheet** — Architect + Guardian  
3. Approve & watch the live Executor log  
4. Ask chat for a Friday status email  
5. Time-saved meter ticks up
