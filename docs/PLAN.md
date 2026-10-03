# OneLastThing — AI-Gnition Hackathon Plan

> **Problem statement:** "One last thing that helps us remove daily repetitive tasks with creative solutions and save time for us."
>
> **Our answer:** *OneLastThing* — the last productivity tool you'll need. It **notices** the repetitive work you do, **proposes** an automation, and a team of AI agents **builds and runs** it for you — with your approval.

---

## 1. Ideation summary

| # | Idea | Novelty | Impact | Feasibility | Demo wow | Total /20 |
|---|------|:------:|:------:|:-----------:|:--------:|:---------:|
| 1 | **OneLastThing** – detect repetition + multi-agent automation | 5 | 5 | 3 | 5 | **18** |
| 2 | Plain-English automation builder | 3 | 4 | 4 | 4 | 15 |
| 3 | Daily Autopilot / Morning Brief | 3 | 4 | 4 | 3 | 14 |
| 4 | Meeting-to-Action agent | 2 | 4 | 5 | 3 | 14 |
| 5 | Life-admin form filler | 3 | 3 | 3 | 3 | 12 |

**Decision:** Idea 1. It is the only idea that answers *"one last thing"* literally — instead of automating one task, it discovers *all* your repetitive tasks. Ideas 2–4 become **features** inside it (the natural-language builder, a daily brief, meeting follow-ups).

### Key decisions
| Topic | Decision | Why |
|---|---|---|
| Target user | Office workers / professionals | Most repetitive digital work (email → sheet, reports, follow-ups, scheduling) |
| Platform | Web app (Next.js + TypeScript) | Fast to build, easy to demo, one codebase for UI + API |
| AI model | Google Gemini (`gemini-2.5-flash` default, `pro` for planning) | Free tier, strong function-calling, fast |
| Agent style | Multi-agent pipeline with **human-in-the-loop** approval | Safety + trust = judges' favourite question answered |
| Data for demo | Real Gmail/Calendar/Sheets *optional*; seeded realistic activity log by default | Demo never breaks due to OAuth/network |

---

## 2. User problem & persona

**Persona – "Priya", Operations Executive**
- Copies order details from ~20 emails/day into a Google Sheet.
- Sends the same "weekly status" email every Friday, built from the same sheet.
- Manually books follow-up meetings after every client call.
- Loses **~6–8 hrs/week** to this, but never has time to "set up automation" — and doesn't know Zapier.

**Insight:** People don't automate because (1) they don't *notice* the pattern, and (2) building automations is itself a task. OneLastThing removes both barriers.

---

## 3. Solution — how it works

```
 ┌──────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐   ┌───────────┐
 │ Observe  │──▶│  Detect   │──▶│  Propose  │──▶│ Approve  │──▶│  Execute  │
 │ activity │   │ patterns  │   │ workflow  │   │ (human)  │   │ & report  │
 └──────────┘   └───────────┘   └───────────┘   └──────────┘   └───────────┘
                                                                     │
                                         "You saved 3h 20m this week" ◀┘
```

### The agent team
| Agent | Role | Input → Output |
|---|---|---|
| **Observer** | Ingests & normalises activity events from connectors (email, calendar, sheets, browser) | raw events → `ActivityEvent[]` |
| **Pattern Hunter** | Finds repeated action sequences (algorithmic sequence mining) and asks Gemini to name/explain them + estimate time cost | events → `Pattern[]` (name, frequency, est. minutes/week) |
| **Architect** | Turns a pattern *or a plain-English request* into a structured workflow (trigger + steps + tools) | pattern / prompt → `WorkflowSpec` (JSON) |
| **Guardian** | Checks the workflow for risk (sending external email, deleting data), produces a dry-run preview, requires approval for risky steps | spec → risk report + preview |
| **Executor** | Runs approved workflows via a tool registry using Gemini function calling | spec + trigger → `RunLog` |
| **Reporter** | Weekly "time saved" summary + suggests next automation | run logs → insights |

### Tool registry (what the Executor can do)
`read_emails`, `extract_fields`, `append_sheet_row`, `send_email`, `draft_email`, `create_calendar_event`, `summarize`, `generate_report`, `notify_user`.
Each tool has a **mock** implementation (for demo) and a **real** Google API implementation (stretch).

---

## 4. Key features (MVP vs stretch)

**MVP (must have for demo)**
1. **Dashboard** – detected patterns as cards: *"Copy order emails → Sheet · 18×/week · ~2.5h"* with **Automate** button.
2. **Pattern detection** on a seeded week of realistic activity data.
3. **Workflow Studio** – visual node graph of the generated workflow (React Flow), editable.
4. **Ask-to-automate chat** – "Every Friday send my team a status summary from the Orders sheet."
5. **Guardian approval screen** – risk badges + dry-run preview.
6. **Live execution log** – watch agents work step-by-step (streamed).
7. **Time-saved meter** – total hours reclaimed.

**Stretch**
- Real Google OAuth (Gmail, Calendar, Sheets).
- Chrome extension to capture browser activity.
- Scheduled triggers (cron) running in background.
- Morning Brief + meeting follow-up templates.
- Slack/Teams connector.

---

## 5. Architecture

```
Next.js (App Router, TypeScript)
├── UI: Tailwind + shadcn/ui + React Flow + Recharts
├── API routes (/api/*)
│   ├── /events        ← Observer ingest
│   ├── /patterns      ← Pattern Hunter
│   ├── /workflows     ← Architect + Guardian
│   ├── /runs          ← Executor (streamed via SSE)
│   └── /chat          ← natural-language automation
├── lib/agents/        ← one file per agent, shared Gemini client
├── lib/tools/         ← tool registry (mock + real adapters)
├── lib/patterns/      ← sequence-mining algorithm
└── DB: SQLite + Drizzle ORM (events, patterns, workflows, runs)
```

**Gemini usage:** `@google/genai` SDK, structured JSON output (response schema) for Architect/Pattern naming, function calling for Executor.

**Why hybrid algorithm + LLM for patterns?** Pure LLM over thousands of events is slow/expensive and non-deterministic. We mine candidate sequences algorithmically (n-gram frequency over normalised actions), then the LLM only explains and prices the top candidates.

---

## 6. Build plan (~10 days)

| Day | Milestone |
|---|---|
| 1 | Scaffold Next.js, Tailwind, shadcn, DB schema, Gemini client, seed data generator |
| 2 | Pattern mining algorithm + Pattern Hunter agent + dashboard cards |
| 3 | Architect agent (pattern/prompt → WorkflowSpec) + JSON schema validation |
| 4 | Workflow Studio (React Flow visualisation & editing) |
| 5 | Tool registry (mock) + Executor agent with function calling |
| 6 | Guardian agent + approval UI + live streamed run log |
| 7 | Chat-to-automate + time-saved meter + Reporter |
| 8 | Stretch: Google OAuth + real Gmail/Sheets tools |
| 9 | Polish UI, edge cases, loading states, demo script rehearsal |
| 10 | Pitch deck, demo video backup, README |

---

## 7. Demo script (3 minutes)

1. **Hook (20s):** "Priya spends 7 hours a week copy-pasting. She doesn't know it."
2. **Dashboard (40s):** OneLastThing has detected 4 patterns → total 7.2 h/week.
3. **Automate (60s):** Click *Automate* on "Order emails → Sheet". Architect builds the workflow live; Guardian flags "sends external email" → Priya approves.
4. **Execute (40s):** Watch agents read emails, extract fields, append rows — live log.
5. **Chat (20s):** "Every Friday email my team a summary of this sheet" → new workflow in seconds.
6. **Close (20s):** Time-saved meter ticks up. "OneLastThing — the last automation you'll ever have to set up."

---

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Gemini rate limits / outage during demo | Cache responses; "demo mode" with recorded outputs |
| OAuth complexity | Mock connectors by default; real ones are stretch |
| Privacy concerns from judges | Local-first storage, explicit opt-in per connector, Guardian approvals, no raw data sent to LLM beyond needed fields |
| Agents doing harmful actions | Guardian risk scoring + mandatory approval for send/delete actions |

## 9. Judging-criteria pitch points
- **Creativity:** discovers automations instead of waiting to be told.
- **Use of agents:** six specialised agents with clear responsibilities.
- **Impact:** quantified hours saved per user.
- **Responsible AI:** human-in-the-loop, risk scoring, transparency logs.
