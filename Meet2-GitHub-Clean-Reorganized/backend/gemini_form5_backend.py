"""Meet 2 — Step 5 real Gemini Form 5 backend.

This is a small integration server for the P1/P3 experiment. It owns the Gemini
API key and exposes POST /api/generate-form5. P2 can later merge this logic into
the main Flask/FastAPI backend.
"""
from __future__ import annotations

import json
import os
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from flask import Flask, jsonify, make_response, request

try:
    from dotenv import load_dotenv
except Exception:
    pass
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError

BASE_DIR = Path(__file__).resolve().parent

# Always load the .env located beside this backend script.
try:
    load_dotenv(BASE_DIR / ".env", override=True)
except Exception:
    pass

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.7-flash,gemini-3.6-flash").split(",") if m.strip()]
MODEL_RETRIES = max(1, int(os.getenv("GEMINI_MODEL_RETRIES", "2")))
RETRY_BASE_SECONDS = max(0.5, float(os.getenv("GEMINI_RETRY_BASE_SECONDS", "2")))
FALLBACK_ON_503 = os.getenv("GEMINI_FALLBACK_ON_503", "true").lower() in {"1", "true", "yes", "on"}
FORCE_LOCAL_FALLBACK = os.getenv("GEMINI_FORCE_LOCAL_FALLBACK", "false").lower() in {"1", "true", "yes", "on"}
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))

PROFILE_STORE_DIR = BASE_DIR / "data"
PROFILE_STORE_FILE = PROFILE_STORE_DIR / "student_profiles.json"
PROFILE_STORE_DIR.mkdir(parents=True, exist_ok=True)


def _load_profile_store() -> dict:
    try:
        if not PROFILE_STORE_FILE.exists():
            return {}
        raw = PROFILE_STORE_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"[Meet2] Could not read profile store: {exc}")
        return {}


def _save_profile_store(store: dict) -> None:
    tmp = PROFILE_STORE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(store, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(PROFILE_STORE_FILE)


ALLOWED_SIGNALS = {"experience", "confidence", "scenario", "interest", "behavior"}
RESPONSE_BY_SIGNAL = {
    "experience": "single_select",
    "confidence": "scale_1_5",
    "scenario": "scenario_single_select",
    "interest": "single_select",
    "behavior": "scenario_single_select",
}
ADVANCED_MARKERS = [
    "pytorch api", "tensorflow api", "deep learning framework",
    "linear algebra coursework", "calculus techniques", "advanced system design",
    "competitive programming theory", "stochastic calculus",
    "advanced financial models", "university probability theory",
    "transformer architecture", "cuda kernel", "distributed systems design",
]

class Option(BaseModel):
    value: str = Field(min_length=1)
    label: str = Field(min_length=1)
    score: int = Field(ge=1, le=5)

class Form5Question(BaseModel):
    id: str = Field(min_length=2)
    skill_id: str = Field(min_length=1)
    skill_label: str = Field(min_length=1)
    signal: str = Field(min_length=1)
    response_type: str = Field(min_length=1)
    question: str = Field(min_length=10)
    helper_text: str = Field(min_length=1)
    options: List[Option] = Field(min_length=2, max_length=5)

class Form5Response(BaseModel):
    schema_version: str
    role_id: str = Field(min_length=1)
    student_stage: str = Field(min_length=1)
    question_count: int = Field(ge=1, le=7)
    questions: List[Form5Question] = Field(min_length=1, max_length=7)

SCHEMA = Form5Response.model_json_schema()

app = Flask(__name__)


def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


def preflight():
    return cors(make_response("", 204))


def normalize(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower()).strip()


def build_request_payload(context: dict) -> dict:
    role = context.get("role") or {}
    dimensions = context.get("skill_dimensions") or []
    return {
        "schema_version": "1.0",
        "student_stage": str(context.get("student_stage") or "post_12_pre_college"),
        "role": {
            "role_id": str(role.get("role_id") or "career_explorer"),
            "display_name": str(role.get("display_name") or role.get("role_id") or "Career Explorer"),
        },
        "academic_background": context.get("academic_background") or {},
        "present_context": context.get("present_context") or {},
        "mapped_skill_dimensions": [
            {
                "id": d.get("id"),
                "label": d.get("label"),
                "importance": d.get("importance"),
                "question_focus": d.get("question_focus"),
                "preferred_types": d.get("preferred_types") or [],
                "avoid": d.get("avoid") or [],
            }
            for d in dimensions if isinstance(d, dict) and d.get("id")
        ],
        "generation_constraints": {
            "question_count": 5,
            "allowed_response_types": ["single_select", "scenario_single_select", "scale_1_5"],
            "allowed_signals": sorted(ALLOWED_SIGNALS),
            "audience": "student who is currently in or has just completed Class 12",
        },
    }


def build_system_instruction() -> str:
    return """You are the Meet 2 Dynamic Form 5 Question Generator.
Generate exactly 5 short diagnostic questions that measure a Class-12 student's CURRENT foundational capability, experience, reasoning habits, curiosity, and learning readiness for the supplied target role.

NON-NEGOTIABLE RULES:
1. Assess present-day foundations, not university or professional curriculum.
2. Use ONLY the supplied mapped skill dimensions. Never invent a new skill_id.
3. Do not assume professional experience or prior knowledge of the target field.
4. A student with zero experience must have an honest valid answer.
5. Prefer plain language and concrete school/everyday situations.
6. Each question measures one primary skill dimension.
7. Use five different skill dimensions; never repeat a skill_id.
8. Use at least three different signal types across the five questions.
9. Do not ask about advanced tools/topics such as PyTorch, TensorFlow, CUDA kernels, advanced system design, or university-level coursework.
10. Questions should diagnose the student's starting point, not teach them.
11. Return JSON only and match the supplied response schema.
12. Use IDs q1, q2, q3, q4, q5.
13. Every option has an integer score from 1 to 5.
14. Never include sensitive or discriminatory attributes.
"""


def build_user_prompt(payload: dict) -> str:
    return (
        "Create Dynamic Form 5 for this student context.\n\n"
        + json.dumps(payload, indent=2, ensure_ascii=False)
        + "\n\nBefore returning, silently verify: exactly five questions; unique mapped skills; at least three signal types; all questions are understandable to a Class-12 student; no advanced curriculum drift; zero-experience answers remain valid."
    )


def quality_guard(data: dict, context: dict) -> None:
    errors: list[str] = []
    questions = data.get("questions") if isinstance(data, dict) else None
    questions = questions if isinstance(questions, list) else []
    allowed = {d.get("id") for d in (context.get("skill_dimensions") or []) if isinstance(d, dict)}
    if len(questions) != 5:
        errors.append(f"Expected exactly 5 questions; received {len(questions)}.")

    ids, skills, texts, signals = set(), set(), set(), set()
    for i, q in enumerate(questions, 1):
        if not isinstance(q, dict):
            errors.append(f"Question {i} is not an object.")
            continue
        qid = q.get("id")
        sid = q.get("skill_id")
        if qid in ids or not qid:
            errors.append(f"Question {i} has a duplicate or missing id.")
        ids.add(qid)
        if sid not in allowed:
            errors.append(f"Question {i} uses a skill outside the mapped skill set: {sid}.")
        if sid in skills:
            errors.append(f"Skill '{sid}' is assessed more than once.")
        skills.add(sid)
        text = normalize(f"{q.get('question','')} {q.get('helper_text','')}")
        if text in texts:
            errors.append(f"Question {i} duplicates another question.")
        texts.add(text)
        signal = q.get("signal")
        response_type = q.get("response_type")
        if signal not in ALLOWED_SIGNALS:
            errors.append(f"Question {i} has an invalid signal type.")
        if RESPONSE_BY_SIGNAL.get(signal) and response_type != RESPONSE_BY_SIGNAL[signal]:
            errors.append(f"Question {i} response type does not match signal type.")
        options = q.get("options")
        if not isinstance(options, list) or not (2 <= len(options) <= 5):
            errors.append(f"Question {i} must have 2–5 options.")
        else:
            option_values = set()
            for j, option in enumerate(options, 1):
                value = option.get("value") if isinstance(option, dict) else None
                score = option.get("score") if isinstance(option, dict) else None
                if not value or value in option_values:
                    errors.append(f"Question {i}, option {j} has a missing/duplicate value.")
                option_values.add(value)
                if not isinstance(score, int) or not 1 <= score <= 5:
                    errors.append(f"Question {i}, option {j} has an invalid score.")
        for marker in ADVANCED_MARKERS:
            if marker in text:
                errors.append(f"Question {i} contains advanced-curriculum marker '{marker}'.")

        signals.add(signal)

    if len(questions) == 5 and len(signals) < 3:
        errors.append("Question set must use at least three different diagnostic signal types.")
    if data.get("role_id") != (context.get("role") or {}).get("role_id"):
        errors.append("Generated question set returned the wrong role context.")
    if data.get("student_stage") != context.get("student_stage"):
        errors.append("Generated question set returned the wrong student stage.")

    if errors:
        raise ValueError(" ".join(errors))



def _fallback_options(kind: str):
    if kind == "scale":
        return [
            {"value": "1", "label": "Very uncomfortable", "score": 1},
            {"value": "2", "label": "Needs practice", "score": 2},
            {"value": "3", "label": "Comfortable with basics", "score": 3},
            {"value": "4", "label": "Quite comfortable", "score": 4},
            {"value": "5", "label": "Very comfortable", "score": 5},
        ]
    if kind == "interest":
        return [
            {"value": "low", "label": "Not very interested", "score": 1},
            {"value": "some", "label": "A little interested", "score": 2},
            {"value": "high", "label": "Quite interested", "score": 4},
            {"value": "very_high", "label": "Very interested", "score": 5},
        ]
    return [
        {"value": "rarely", "label": "Rarely", "score": 1},
        {"value": "sometimes", "label": "Sometimes", "score": 2},
        {"value": "usually", "label": "Usually", "score": 4},
        {"value": "very_often", "label": "Very often", "score": 5},
    ]


def _fallback_question(skill: dict, index: int, forced_signal: str | None = None) -> dict:
    sid = skill.get("id", f"skill_{index}")
    label = skill.get("label", sid.replace("_", " ").title())
    focus = skill.get("question_focus", "this foundational capability")
    preferred = skill.get("preferred_types") or ["confidence"]
    signal = forced_signal or preferred[0]
    if signal not in ALLOWED_SIGNALS:
        signal = "confidence"

    templates = {
        "programming_logic": ("How comfortable are you with giving a computer clear instructions to solve a small problem?", "You do not need prior coding experience to answer this.", "experience", "single_select"),
        "problem_solving": ("You get a problem you have never seen before. What do you usually do first?", "Choose the response that feels most like you today.", "scenario", "scenario_single_select"),
        "mathematical_reasoning": ("How comfortable are you with patterns, equations, quantities, and mathematical reasoning?", "Think about your current school-level foundation.", "confidence", "scale_1_5"),
        "technical_curiosity": ("How interested are you in understanding how technology works and experimenting with it?", "Prior technical experience is not required.", "interest", "single_select"),
        "learning_persistence": ("You are learning something difficult and it is not working yet. What are you most likely to do next?", "Think about school, projects, hobbies, or everyday learning.", "behavior", "scenario_single_select"),
        "problem_decomposition": ("You have a large task to finish. How likely are you to break it into smaller steps before starting?", "Think about school projects or everyday tasks.", "scenario", "scenario_single_select"),
        "debugging_mindset": ("Something you built or tried is not working. What is your first instinct?", "This can be a code project, school project, or anything you made.", "behavior", "scenario_single_select"),
        "quantitative_reasoning": ("How comfortable are you reasoning with numbers, quantities, percentages, or simple trends?", "Use your current school-level experience as the reference point.", "confidence", "scale_1_5"),
        "pattern_finding": ("When you look at a table, chart, or set of information, how often do you notice useful patterns?", "Think about school or everyday situations.", "scenario", "scenario_single_select"),
        "structured_problem_solving": ("You are asked a vague question. How likely are you to turn it into smaller questions you can actually answer?", "Choose what you would most likely do today.", "scenario", "scenario_single_select"),
        "curiosity_about_evidence": ("When two people make different claims, how interested are you in checking the evidence before choosing a side?", "This is about how you naturally approach information.", "behavior", "scenario_single_select"),
        "communication_of_findings": ("How confident are you explaining what you found so another person can understand it clearly?", "Think about speaking, writing, presenting, or explaining to a friend.", "confidence", "scale_1_5"),
        "problem_framing": ("Someone asks you to solve a problem. What would you want to understand first?", "Think about what information you need before deciding on a solution.", "scenario", "scenario_single_select"),
        "communication": ("How confident are you explaining an idea so another person can understand it clearly?", "Think about speaking, writing, presenting, or explaining to a friend.", "confidence", "scale_1_5"),
        "user_empathy": ("A friend says something is confusing. What would you be most interested in doing first?", "There is no professional product or design knowledge required.", "scenario", "scenario_single_select"),
        "decision_making": ("Two options are both good, but you can only choose one. What do you usually do?", "Choose the response closest to your normal decision style.", "scenario", "scenario_single_select"),
        "analytical_thinking": ("When two options give different results, how likely are you to compare the evidence before deciding why?", "We are measuring reasoning from information, not advanced statistics.", "scenario", "scenario_single_select"),
        "collaboration": ("You and a teammate disagree about a project. What do you usually do?", "Think about school projects, clubs, events, or team activities.", "behavior", "scenario_single_select"),
        "visual_thinking": ("How comfortable are you turning an idea into a simple visual sketch, layout, or diagram?", "Paper sketches count. Advanced design software is not required.", "confidence", "scale_1_5"),
        "creative_problem_solving": ("When a first idea does not work, how likely are you to try a different way of solving the same problem?", "We are measuring creative flexibility, not drawing skill.", "scenario", "scenario_single_select"),
        "observation": ("How often do you notice small things that make a product, website, or everyday object easier or harder to use?", "Examples can come from apps, websites, school systems, or everyday objects.", "behavior", "scenario_single_select"),
        "design_curiosity": ("How interested are you in understanding why a visual or interface feels clear, confusing, attractive, or frustrating?", "This is about curiosity, not prior design training.", "interest", "single_select"),
        "curiosity": ("How curious are you about understanding how something works when you do not already know the answer?", "Think about school, hobbies, technology, or everyday life.", "interest", "single_select"),
        "critical_thinking": ("Someone gives you a strong opinion. What are you most likely to do before accepting it?", "Choose the response closest to how you think today.", "scenario", "scenario_single_select"),
        "attention_to_detail": ("When working with detailed information, how often do you notice small errors or inconsistencies?", "Think about schoolwork, projects, numbers, or documents.", "behavior", "scenario_single_select"),
        "initiative": ("You notice a small problem that nobody has asked you to solve. What are you most likely to do?", "Think about school, family, clubs, or everyday situations.", "behavior", "scenario_single_select"),
        "problem_finding": ("How often do you notice things that could be made easier, faster, cheaper, or more useful?", "We are measuring your tendency to spot opportunities.", "interest", "single_select"),
        "experimentation": ("When you are unsure whether an idea will work, how likely are you to test a small version first?", "A small experiment can be as simple as trying one version with one person.", "behavior", "scenario_single_select"),
        "resilience": ("You put effort into an idea and it does not work. What are you most likely to do next?", "Think about school projects, competitions, or personal experiments.", "behavior", "scenario_single_select"),
        "logical_reasoning": ("How comfortable are you reasoning through a problem with several rules or conditions?", "Use school-level puzzles, maths, or logic as your reference point.", "confidence", "scale_1_5"),
    }
    if sid in templates and templates[sid][2] == signal:
        question, helper, _, response_type = templates[sid]
    else:
        # Generic, signal-aware fallback when the role needs more diagnostic diversity.
        if signal == "experience":
            question = f"Have you ever used {label.lower()} in a school, hobby, project, or everyday situation?"
            helper = "Prior professional experience is not required."
            response_type = "single_select"
        elif signal == "scenario":
            question = f"You face a new situation that requires {focus.lower()}. What would you most likely do first?"
            helper = "Choose the response closest to how you would act today."
            response_type = "scenario_single_select"
        elif signal == "interest":
            question = f"How interested are you in learning more about {label.lower()}?"
            helper = "This measures curiosity, not prior training."
            response_type = "single_select"
        elif signal == "behavior":
            question = f"When working on something related to {label.lower()}, how often do you naturally do the following?"
            helper = "Think about schoolwork, hobbies, projects, or everyday situations."
            response_type = "scenario_single_select"
        else:
            question = f"How comfortable are you with {focus.lower()}?"
            helper = "Think about your current school-level experience; no professional experience is required."
            response_type = "scale_1_5"
    if response_type == "scale_1_5":
        options = _fallback_options("scale")
    elif signal == "interest":
        options = _fallback_options("interest")
    elif signal in {"scenario", "behavior"}:
        options = _fallback_options("behavior")
    else:
        options = [
            {"value": "never", "label": "I have never tried this", "score": 1},
            {"value": "heard", "label": "I have seen or heard about it", "score": 2},
            {"value": "some", "label": "I have tried it a little", "score": 3},
            {"value": "comfortable", "label": "I can do it with some confidence", "score": 4},
            {"value": "strong", "label": "I am very comfortable with it", "score": 5},
        ]
    return {
        "id": f"q{index}",
        "skill_id": sid,
        "skill_label": label,
        "signal": signal,
        "response_type": response_type,
        "question": question,
        "helper_text": helper,
        "options": options,
    }


def build_local_fallback(context: dict, reason: str = "Gemini temporarily unavailable") -> dict:
    dimensions = [d for d in (context.get("skill_dimensions") or []) if isinstance(d, dict) and d.get("id")]
    # Preserve the mapped order so the fallback remains deterministic and role-aware.
    chosen = dimensions[:5]
    if len(chosen) < 5:
        generic = [
            {"id": "problem_solving", "label": "Problem Solving", "question_focus": "breaking a problem into smaller steps", "preferred_types": ["scenario"]},
            {"id": "communication", "label": "Communication", "question_focus": "explaining an idea clearly", "preferred_types": ["confidence"]},
        ]
        seen = {d.get("id") for d in chosen}
        for g in generic:
            if g["id"] not in seen and len(chosen) < 5:
                chosen.append(g)

    # Build a deterministic signal plan first. We preserve each skill's preferred
    # signals but actively maximize diversity so the fallback always satisfies the
    # same quality rule used by the Gemini response.
    signal_rotation = ["experience", "scenario", "confidence", "interest", "behavior"]
    planned_signals: list[str] = []
    used: set[str] = set()
    for skill in chosen:
        preferred = [s for s in (skill.get("preferred_types") or []) if s in ALLOWED_SIGNALS]
        candidate = next((s for s in signal_rotation if s in preferred and s not in used), None)
        if candidate is None:
            candidate = next((s for s in preferred if s not in used), None)
        if candidate is None:
            candidate = preferred[0] if preferred else "confidence"
        planned_signals.append(candidate)
        used.add(candidate)

    # If preferred types collapse to fewer than three, deliberately use alternate
    # diagnostic lenses on later skills. This changes HOW we assess the skill, not
    # WHAT skill is being assessed.
    if len(set(planned_signals)) < 3 and len(chosen) >= 3:
        for idx, skill in enumerate(chosen):
            if len(set(planned_signals)) >= 3:
                break
            preferred = [s for s in (skill.get("preferred_types") or []) if s in ALLOWED_SIGNALS]
            alternates = [s for s in signal_rotation if s in preferred and s not in set(planned_signals)]
            if alternates:
                planned_signals[idx] = alternates[0]

    # Final safety net: select additional allowed diagnostic lenses for roles whose
    # mapping is unusually narrow. The signal measures a different evidence type,
    # while the skill_id remains the same.
    if len(set(planned_signals)) < 3:
        for idx, skill in enumerate(chosen):
            if len(set(planned_signals)) >= 3:
                break
            for alt in signal_rotation:
                if alt not in set(planned_signals):
                    planned_signals[idx] = alt
                    break

    questions = [
        _fallback_question(skill, i, planned_signals[i - 1])
        for i, skill in enumerate(chosen, start=1)
    ]
    return {
        "schema_version": "1.0",
        "role_id": (context.get("role") or {}).get("role_id", "career_explorer"),
        "student_stage": str(context.get("student_stage") or "post_12_pre_college"),
        "question_count": len(questions),
        "questions": questions,
        "generation_notice": "Gemini was temporarily unavailable. Meet 2 used its local goal-aware diagnostic fallback.",
        "fallback_reason": reason[:500],
    }

def get_client() -> genai.Client:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not configured. Copy .env.example to .env and add your Gemini API key.")
    return genai.Client(api_key=key)


@app.route("/api/submit", methods=["POST", "OPTIONS"])
def submit_profile():
    """Persist the completed diagnostic profile for the current local prototype.

    This is intentionally simple until P2 integrates the real database/session layer.
    Profiles are stored in data/student_profiles.json keyed by a generated session_id.
    """
    if request.method == "OPTIONS":
        return preflight()

    body = request.get_json(silent=True) or {}
    profile = body.get("profile")
    if not isinstance(profile, dict):
        return cors(jsonify({
            "success": False,
            "error": "A JSON object named 'profile' is required."
        })), 400

    session_id = str(body.get("session_id") or uuid.uuid4())
    record = {
        "session_id": session_id,
        "saved_at": datetime.now(timezone.utc).isoformat(),
        "profile": profile,
    }

    store = _load_profile_store()
    store[session_id] = record
    try:
        _save_profile_store(store)
    except Exception as exc:
        print(f"[Meet2] Profile save failed | session_id={session_id} | error={exc}")
        return cors(jsonify({
            "success": False,
            "error": f"Could not persist student profile: {exc}"
        })), 500

    print(f"[Meet2] Profile saved | session_id={session_id} | file={PROFILE_STORE_FILE}")
    return cors(jsonify({
        "success": True,
        "message": "Profile saved",
        "session_id": session_id,
        "saved_at": record["saved_at"],
    }))


@app.route("/api/profile/<session_id>", methods=["GET", "OPTIONS"])
def get_profile(session_id: str):
    if request.method == "OPTIONS":
        return preflight()
    store = _load_profile_store()
    record = store.get(session_id)
    if not record:
        return cors(jsonify({"success": False, "error": "Profile not found."})), 404
    return cors(jsonify({"success": True, **record}))


@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return preflight()
    return cors(jsonify({
        "ok": True,
        "gemini_key_configured": bool(os.getenv("GEMINI_API_KEY")),
        "model": DEFAULT_MODEL,
        "endpoint": "/api/generate-form5",
        "fallback_on_503": FALLBACK_ON_503,
        "force_local_fallback": FORCE_LOCAL_FALLBACK,
    }))


@app.route("/api/generate-form5", methods=["POST", "OPTIONS"])
def generate_form5():
    if request.method == "OPTIONS":
        return preflight()

    body = request.get_json(silent=True) or {}
    context = body.get("context") or {}
    attempts_log = []
    request_started = time.time()
    role_id = (context.get("role") or {}).get("role_id", "career_explorer")

    print(f"[Meet2] Form 5 request received | role={role_id} | force_local={FORCE_LOCAL_FALLBACK}")

    try:
        payload = build_request_payload(context)
        if FORCE_LOCAL_FALLBACK:
            print("[Meet2] Source=LOCAL_FALLBACK | reason=forced by GEMINI_FORCE_LOCAL_FALLBACK=true")
            data = build_local_fallback(context, "Forced local fallback for testing")
            return cors(jsonify({
                "success": True,
                "source": "local_fallback",
                "model": None,
                "fallback_used": True,
                "fallback_reason": "Forced local fallback for testing",
                "attempts": [],
                "latency_ms": round((time.time() - request_started) * 1000),
                **data,
            }))

        client = get_client()
        contents = build_user_prompt(payload)
        config = types.GenerateContentConfig(
            system_instruction=build_system_instruction(),
            response_mime_type="application/json",
            response_schema=SCHEMA,
        )

        models = []
        for model_name in [DEFAULT_MODEL, *FALLBACK_MODELS]:
            if model_name and model_name not in models:
                models.append(model_name)

        response = None
        used_model = None
        model_errors = []
        for model_name in models:
            print(f"[Meet2] Trying Gemini model={model_name}")
            for attempt in range(MODEL_RETRIES):
                attempt_no = attempt + 1
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                    )
                    used_model = model_name
                    attempts_log.append({
                        "model": model_name,
                        "attempt": attempt_no,
                        "status": "success",
                    })
                    print(f"[Meet2] Gemini success | model={model_name} | attempt={attempt_no}")
                    break
                except Exception as exc:
                    message = str(exc)
                    retryable = any(token in message for token in (
                        "503", "UNAVAILABLE", "high demand", "overloaded", "temporarily unavailable"
                    ))
                    attempts_log.append({
                        "model": model_name,
                        "attempt": attempt_no,
                        "status": "error",
                        "retryable": retryable,
                        "error": message[:500],
                    })
                    model_errors.append(f"{model_name} attempt {attempt_no}: {message}")
                    print(f"[Meet2] Gemini error | model={model_name} | attempt={attempt_no} | retryable={retryable} | {message[:240]}")
                    if not retryable or attempt == MODEL_RETRIES - 1:
                        break
                    wait_s = RETRY_BASE_SECONDS * (2 ** attempt)
                    print(f"[Meet2] Retrying in {wait_s:.1f}s")
                    time.sleep(wait_s)
            if response is not None:
                break

        if response is None:
            reason = "Gemini temporarily unavailable. " + "; ".join(model_errors)
            if FALLBACK_ON_503:
                print("[Meet2] Source=LOCAL_FALLBACK | reason=all configured Gemini attempts failed")
                data = build_local_fallback(context, reason)
                return cors(jsonify({
                    "success": True,
                    "source": "local_fallback",
                    "model": None,
                    "fallback_used": True,
                    "fallback_reason": reason[:1000],
                    "attempts": attempts_log,
                    "latency_ms": round((time.time() - request_started) * 1000),
                    **data,
                }))
            print("[Meet2] Gemini failed and 503 fallback is disabled")
            raise RuntimeError("All configured Gemini models were unavailable. Tried: " + "; ".join(model_errors))

        raw = response.text
        data = json.loads(raw)
        # Response type is controlled by the application, not trusted from the LLM.
        for q in data.get("questions", []):
            signal = q.get("signal")
            if signal in RESPONSE_BY_SIGNAL:
                q["response_type"] = RESPONSE_BY_SIGNAL[signal]
        parsed = Form5Response.model_validate(data)
        data = parsed.model_dump()
        quality_guard(data, context)
        print(f"[Meet2] Source=GEMINI | model={used_model} | fallback_used=False | questions={len(data.get('questions', []))}")
        return cors(jsonify({
            "success": True,
            "source": "gemini",
            "model": used_model,
            "fallback_used": False,
            "fallback_reason": None,
            "attempts": attempts_log,
            "latency_ms": round((time.time() - request_started) * 1000),
            **data,
        }))
    except (json.JSONDecodeError, ValidationError, ValueError, RuntimeError) as exc:
        print(f"[Meet2] Form 5 generation failed | error={str(exc)[:500]}")
        return cors(jsonify({
            "success": False,
            "error": str(exc),
            "source": "gemini",
            "model": None,
            "fallback_used": False,
            "attempts": attempts_log,
            "latency_ms": round((time.time() - request_started) * 1000),
        })), 502
    except Exception as exc:
        print(f"[Meet2] Unexpected Form 5 generation failure | error={str(exc)[:500]}")
        return cors(jsonify({
            "success": False,
            "error": f"Gemini request failed: {exc}",
            "source": "gemini",
            "model": None,
            "fallback_used": False,
            "attempts": attempts_log,
            "latency_ms": round((time.time() - request_started) * 1000),
        })), 502


if __name__ == "__main__":
    print(f"[Meet2] Backend directory: {BASE_DIR}")
    env_path = BASE_DIR / ".env"
    print(f"[Meet2] .env loaded from: {env_path}")
    print(f"[Meet2] GEMINI_FORCE_LOCAL_FALLBACK={FORCE_LOCAL_FALLBACK}")
    print(f"[Meet2] GEMINI_MODEL={DEFAULT_MODEL}")
    app.run(host=HOST, port=PORT, debug=False)
