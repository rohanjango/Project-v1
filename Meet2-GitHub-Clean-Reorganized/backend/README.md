# Meet 2 Form 5 Backend

This folder contains the dedicated Form 5 generation service. It is separate from Gagan/P2's main deployed backend.

## Endpoint

```text
POST /api/generate-form5
```

## Local setup

From the repository root:

```bat
copy backend\.env.example backend\.env
backend\run_gemini_backend.bat
```

Put the real Gemini key only in `backend/.env`. Never put it in frontend files or commit it.

## What this service does

```text
Frontend Form 5 context
        ↓
Gemini generation
        ↓
validated 5-question response
```

The frontend can use its independent deterministic Form 5 fallback when configured in `frontend/app-config.js`.
