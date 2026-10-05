import json
from pathlib import Path
from jsonschema import Draft202012Validator

BASE = Path(__file__).resolve().parents[2]
schema = json.loads((BASE / "schema" / "student_profile.schema.json").read_text(encoding="utf-8"))
example = json.loads((BASE / "schema" / "form1_past_test.json").read_text(encoding="utf-8"))

# Validate only after temporarily filling placeholder required sections, so we can verify
# the exact structure/types of Form 1 without pretending Forms 2-5 are already migrated.
student = example["student"]
student.update({
    "present": {"interests": [], "work_preferences": [], "learning_preference": "", "current_activities": []},
    "situation": {"college_status": "", "budget_preference": "", "relocation": "", "priorities": [], "time_availability": {"hours_per_week": "", "major_current_commitment": ""}},
    "goal": {"career": "", "certainty": "not_sure", "motivations": [], "success_definition": []},
    "skills": {"technical": {}, "project_experience": "", "independent_learning": ""}
})
validator = Draft202012Validator(schema)
errors = sorted(validator.iter_errors(example), key=lambda e: list(e.path))
if errors:
    raise SystemExit("Form 1 schema test failed: " + " | ".join(e.message for e in errors))
print("Form 1 past-section schema test: PASS")
