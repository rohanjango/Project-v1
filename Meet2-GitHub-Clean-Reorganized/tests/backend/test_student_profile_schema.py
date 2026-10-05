import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).resolve().parents[2]
schema = json.loads((ROOT / 'schema' / 'student_profile.schema.json').read_text())
fixture = json.loads((ROOT / 'schema' / 'student_profile_test.json').read_text())
jsonschema.Draft202012Validator(schema).validate(fixture)
print('FULL STUDENT PROFILE SCHEMA TEST: PASS')
