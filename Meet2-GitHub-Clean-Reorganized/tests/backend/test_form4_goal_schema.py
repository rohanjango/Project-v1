import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
schema = json.loads((root / "schema" / "student_profile.schema.json").read_text())
goal_schema = schema["properties"]["student"]["properties"]["goal"]
fixture = json.loads((root / "schema" / "form4_goal_test.json").read_text())

required = set(goal_schema["required"])
assert set(fixture) == required, f"Form 4 fields mismatch: {set(fixture) ^ required}"
assert isinstance(fixture["career"], str) and fixture["career"]
assert fixture["certainty"] in goal_schema["properties"]["certainty"]["enum"]
assert isinstance(fixture["motivations"], list) and fixture["motivations"]
assert all(isinstance(v, str) for v in fixture["motivations"])
assert isinstance(fixture["success_definition"], list) and fixture["success_definition"]
assert all(isinstance(v, str) for v in fixture["success_definition"])
print("FORM 4 GOAL SCHEMA TEST: PASS")
