# Meet 2

Meet 2 is an AI-powered career journey companion for students at or just after Class 12.

## Repository structure

The repository is intentionally split so contributors can immediately see which files belong to the frontend and which belong to the dedicated Form 5 backend.

```text
Meet2/
├── frontend/                  # P1: UI, flow, API client, Form 5 client logic
│   ├── diagnostic.html        # Five-form diagnostic UI
│   ├── home.html              # Home page
│   ├── routes.html            # Discover Routes
│   ├── roadmap.html           # Interactive Roadmap
│   ├── mission.html           # Daily Mission
│   ├── progress.html          # Progress Dashboard
│   ├── *.css                  # Page/component styles
│   ├── *.js                   # Frontend logic and API integration
│   └── *.json                 # Form 5/frontend configuration data
│
├── backend/                   # Dedicated Form 5 backend service
│   ├── gemini_form5_backend.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── run_gemini_backend.bat
│   ├── .env.example
│   └── tools/
│
├── schema/                    # Shared P3 student-profile contract and fixtures
├── tests/
│   ├── frontend/              # Frontend/JS tests
│   └── backend/               # Backend/Python/schema tests
├── .env.example               # No root .env is used; backend/.env is local-only
└── README.md
```

> Gagan/P2's main backend is deployed separately. It is configured from `frontend/app-config.js`; its server code is not copied into this repository.

## Current product flow

```text
Form 1 — Past
      ↓
Form 2 — Present
      ↓
Form 3 — Situation
      ↓
Form 4 — Goal
      ↓
Form 5 — Dynamic Skills
      ↓
Final P3 Student Profile
      ↓
Main backend — Gagan / P2
      ↓
Roadmap generation
      ↓
2–3 possible career paths
      ↓
Interactive Roadmap
      ↓
Daily Mission
      ↓
Progress
      ↓
AI Co-Pilot
```

## Team roles

- **P1 — Rohan:** frontend, flow, UI, API integration
- **P2 — Gagan:** backend, APIs, persistence, sessions
- **P3 — Dhruv:** LLM reasoning, prompts, skill mapping, roadmap reasoning
- **P4 — Aniket:** roadmap rendering and data visualization
- **P5:** content, UX polish, pitch/demo

## Current two-backend architecture

```text
Frontend
  ├── Form 5 generation → dedicated Form 5 backend
  │                      POST /api/generate-form5
  │
  └── Main product APIs → Gagan/P2 backend
                         POST /api/submit
                         POST /api/generate-roadmap
                         GET  /api/mission/current
                         POST /api/mission/complete
                         GET  /api/progress
                         POST /api/copilot
```

The Form 5 service may use a **local deterministic fallback** when the dedicated Form 5 service is unavailable.

The main roadmap integration currently has **no local route fallback** enabled.

## Frontend configuration

The single frontend configuration point is:

```text
frontend/app-config.js
```

Current development settings are conceptually:

```js
useMockApi: false,
allowForm5LocalFallback: true,
allowLocalRouteFallback: false,
```

The two services are configured separately:

```js
services: {
  form5: 'http://127.0.0.1:5000',
  main: 'https://meet--2-2emg.onrender.com'
}
```

Replace the main URL with the team's current deployed backend URL if it changes.

## Important frontend files

| File | Purpose |
|---|---|
| `frontend/diagnostic.js` | Controls the five-form flow and final profile submission |
| `frontend/profile-schema-adapter.js` | Converts UI state into the final P3 profile shape |
| `frontend/form5-context.js` | Builds context for dynamic Form 5 |
| `frontend/skill-map.json` | Current role → foundational skill mapping |
| `frontend/goal-normalizer.js` | Normalizes visible career choices to internal role IDs |
| `frontend/question-planner.js` | Plans the five Form 5 questions |
| `frontend/question-quality-guard.js` | Validates generated Form 5 questions |
| `frontend/form5-prompt.js` | Builds the Form 5 generation prompt/context |
| `frontend/api-client.js` | Central frontend API wrapper and two-backend routing |
| `frontend/app-config.js` | Service URLs, endpoints, and fallback switches |
| `frontend/routes.js` | Discover Routes integration |
| `frontend/roadmap.js` | Interactive roadmap integration |
| `frontend/mission.js` | Daily Mission UI |
| `frontend/progress.js` | Progress Dashboard |
| `frontend/copilot.js` | AI Co-Pilot UI/API integration |

## Form 5 backend

`backend/gemini_form5_backend.py` is the dedicated Form 5 generation service.

It exposes:

```text
POST /api/generate-form5
```

It uses the Gemini API when configured and supports retry/fallback behavior for temporary Gemini availability problems.

### Local setup

From the repository root:

```bat
copy backend\.env.example backend\.env
```

Then add your real `GEMINI_API_KEY` to `backend/.env`.

Run:

```bat
backend\run_gemini_backend.bat
```

Never put `GEMINI_API_KEY` in browser JavaScript or commit `backend/.env`.

## P3 student profile

The final profile must follow:

```text
schema/student_profile.schema.json
```

The final top-level structure is:

```json
{
  "student": {
    "past": {},
    "present": {},
    "situation": {},
    "goal": {},
    "skills": {}
  }
}
```

The profile is created by `frontend/profile-schema-adapter.js` before it is sent to the main backend.

## P4 roadmap contract

The current roadmap renderer expects the agreed P4 structure:

```text
destination
paths[]
  path_id
  title
  education.degree
  education.branch
  timeline
  why_it_fits
  tradeoffs[]
  milestones[]
    phase
    timeframe
    focus
    skills[]
    projects[]
  internship_strategy
    readiness
    target_roles[]
    preparation[]
    application_stage
```

The immediate integration milestone is:

```text
Final Student Profile
        ↓
POST /api/generate-roadmap
        ↓
P3 reasoning
        ↓
P4 roadmap JSON
        ↓
frontend/routes.js + frontend/roadmap.js
```

## Testing

Frontend tests:

```bash
node tests/frontend/test_two_backend_config.js
node tests/frontend/test_profile_schema_adapter.js
node tests/frontend/test-skill-map.js
node tests/frontend/test-form5-prompt.js
```

Backend/schema tests:

```bash
python tests/backend/test_student_profile_schema.py
python tests/backend/test_form5_skills_schema.py
python tests/backend/test-gemini-backend_contract.py
```

For a real Gemini connectivity check:

```bash
python tests/backend/test_gemini_live.py
```

The live Gemini test requires `backend/.env` with a valid key.

## Profile inspection

The old local profile-store inspection utility is retained under:

```text
backend/tools/inspect_saved_profile.py
```

It is a development utility for the dedicated prototype backend. Gagan/P2's deployed profile store remains separate.
