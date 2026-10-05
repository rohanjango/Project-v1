# Meet 2 Tests

Tests are split by responsibility:

```text
tests/
├── frontend/   # JavaScript/frontend routing, Form 5 planning, profile adapter
└── backend/    # Python backend contract and student-profile schema tests
```

Run frontend tests:

```bash
node tests/frontend/test_two_backend_config.js
node tests/frontend/test_profile_schema_adapter.js
node tests/frontend/test-skill-map.js
node tests/frontend/test-form5-prompt.js
```

Run backend/schema tests:

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
