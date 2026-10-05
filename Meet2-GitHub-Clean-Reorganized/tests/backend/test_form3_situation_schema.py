import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
schema = json.loads((root / "schema" / "student_profile.schema.json").read_text())
situation_schema = schema["properties"]["student"]["properties"]["situation"]
fixture = json.loads((root / "schema" / "form3_situation_test.json").read_text())

required = set(situation_schema["required"])
assert set(fixture) == required, f"Form 3 fields mismatch: {set(fixture) ^ required}"
assert all(isinstance(fixture[k], str) for k in ["college_status", "budget_preference", "relocation"])
assert isinstance(fixture["priorities"], list) and fixture["priorities"]
assert set(fixture["time_availability"]) == set(situation_schema["properties"]["time_availability"]["required"])
assert all(isinstance(v, str) for v in fixture["time_availability"].values())
print("FORM 3 SITUATION SCHEMA TEST: PASS")
