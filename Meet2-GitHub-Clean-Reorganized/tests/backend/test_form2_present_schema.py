import json
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    raise SystemExit('jsonschema package is required for this test.')

ROOT = Path(__file__).resolve().parents[2]
schema = json.loads((ROOT / 'schema' / 'student_profile.schema.json').read_text(encoding='utf-8'))
test_data = json.loads((ROOT / 'schema' / 'form2_present_test.json').read_text(encoding='utf-8'))

present_schema = schema['properties']['student']['properties']['present']

# The section test is wrapped as {"present": ...} so it can be reviewed independently,
# then validated against the exact P3 "student.present" schema.
validator = Draft202012Validator(present_schema)
errors = sorted(validator.iter_errors(test_data['present']), key=lambda e: list(e.path))
if errors:
    for err in errors:
        print('ERROR:', err.message)
    raise SystemExit(1)

# Explicit MVP guard: no unsupported fields may appear in the section test.
allowed = {'interests', 'work_preferences', 'learning_preference', 'current_activities'}
actual = set(test_data['present'])
extra = actual - allowed
missing = allowed - actual
if extra or missing:
    print('ERROR: exact field mismatch')
    print('extra:', sorted(extra))
    print('missing:', sorted(missing))
    raise SystemExit(1)

print('FORM 2 PRESENT SCHEMA TEST: PASS')
print('Fields:', ', '.join(sorted(actual)))
