import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).resolve().parents[2]
schema = json.loads((ROOT / 'schema' / 'student_profile.schema.json').read_text())
skills_schema = schema['properties']['student']['properties']['skills']
fixture = json.loads((ROOT / 'schema' / 'form5_skills_test.json').read_text())

required = set(skills_schema['required'])
assert set(fixture) == required, f'Form 5 skill fields mismatch: {set(fixture) ^ required}'
assert isinstance(fixture['technical'], dict)
assert all(isinstance(k, str) and isinstance(v, str) for k, v in fixture['technical'].items())
assert isinstance(fixture['project_experience'], str)
assert isinstance(fixture['independent_learning'], str)

# Validate the same section under the official schema.
jsonschema.Draft202012Validator(skills_schema).validate(fixture)
print('FORM 5 SKILLS SCHEMA TEST: PASS')
