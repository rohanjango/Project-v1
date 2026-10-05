import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'data' / 'student_profiles.json'

if not path.exists():
    print('No saved profile yet.')
    print('Complete Form 1 -> Form 5 with the backend running, then run this file again.')
    raise SystemExit(0)

store = json.loads(path.read_text(encoding='utf-8'))
if not store:
    print('student_profiles.json exists, but it is empty.')
    raise SystemExit(0)

session_id, record = next(reversed(store.items()))
print('LATEST SESSION:', session_id)
print('SAVED AT:', record.get('saved_at'))
print('\nFINAL P3 STUDENT PROFILE:\n')
print(json.dumps(record.get('profile'), indent=2, ensure_ascii=False))
