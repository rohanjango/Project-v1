# Meet 2 Frontend

This folder contains the P1 frontend: all pages, styles, browser-side logic, Form 5 client logic, API client, and frontend configuration.

## Start the frontend

Open the repository in VS Code and use Live Server on the `frontend/` folder. Start with:

```text
frontend/home.html
```

## Important files

- `diagnostic.html` / `diagnostic.js` — Forms 1–5
- `profile-schema-adapter.js` — builds the final P3 Student Profile
- `app-config.js` — two backend URLs + fallback switches
- `api-client.js` — routes each API call to the correct backend
- `routes.js` — career route generation UI
- `roadmap.js` — interactive roadmap
- `mission.js` — daily mission
- `progress.js` — progress dashboard
- `copilot.js` — AI co-pilot

## Backend routing

Form 5 uses `services.form5` in `app-config.js`.
Main product APIs use `services.main`.
