import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))
import json
from gemini_form5_backend import build_request_payload, Form5Response

ctx = {
    "student_stage": "post_12_pre_college",
    "role": {"role_id": "ai_engineer", "display_name": "AI Engineer"},
    "skill_dimensions": [
        {"id": "programming_logic", "label": "Programming Logic", "importance": "high"},
        {"id": "problem_solving", "label": "Problem Solving", "importance": "high"},
        {"id": "mathematical_reasoning", "label": "Mathematical Reasoning", "importance": "high"},
        {"id": "technical_curiosity", "label": "Technical Curiosity", "importance": "medium"},
        {"id": "learning_persistence", "label": "Learning Persistence", "importance": "medium"}
    ],
    "academic_background": {},
    "present_context": {}
}

payload = build_request_payload(ctx)
assert payload["role"]["role_id"] == "ai_engineer"
assert len(payload["mapped_skill_dimensions"]) == 5
print("PASS: payload shape is ready for Gemini")
