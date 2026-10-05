/**
 * Meet 2 — Dynamic Form 5 Prompt Builder (Step 2)
 * Builds a strict Gemini request from deterministic app context.
 */
(function (root) {
  'use strict';

  const QUESTION_RULES = {
    minQuestions: 4,
    maxQuestions: 7,
    defaultQuestions: 5,
    allowedResponseTypes: ['single_select', 'scenario_single_select', 'scale_1_5'],
    allowedSignals: ['experience', 'confidence', 'scenario', 'interest', 'behavior']
  };

  function normalizeStage(stage) {
    return String(stage || '').trim().toLowerCase().replace(/\s+/g, '_');
  }

  function assertContext(context) {
    if (!context || typeof context !== 'object') throw new Error('Form 5 context is required.');
    if (!context.role?.role_id) throw new Error('Form 5 context requires role.role_id.');
    if (!context.student_stage) throw new Error('Form 5 context requires student_stage.');
    if (!Array.isArray(context.skill_dimensions) || context.skill_dimensions.length === 0) {
      throw new Error('Form 5 context requires at least one mapped skill dimension.');
    }
    if (!context.academic_background || typeof context.academic_background !== 'object') {
      throw new Error('Form 5 context requires academic_background.');
    }
  }

  function compactDimension(dimension) {
    return {
      id: dimension.id,
      label: dimension.label,
      importance: dimension.importance,
      question_focus: dimension.question_focus,
      preferred_types: dimension.preferred_types || [],
      avoid: dimension.avoid || []
    };
  }

  function buildRequestPayload(context, questionCount) {
    assertContext(context);
    const requested = Math.min(
      QUESTION_RULES.maxQuestions,
      Math.max(QUESTION_RULES.minQuestions, Number(questionCount || QUESTION_RULES.defaultQuestions))
    );
    return {
      schema_version: '1.0',
      student_stage: normalizeStage(context.student_stage),
      role: {
        role_id: context.role.role_id,
        display_name: context.role.display_name || context.role.role_id
      },
      academic_background: {
        stream: context.academic_background.stream || null,
        subjects: Array.isArray(context.academic_background.subjects) ? context.academic_background.subjects : [],
        strongest_subjects: Array.isArray(context.academic_background.strongest_subjects) ? context.academic_background.strongest_subjects : [],
        academic_performance: context.academic_background.academic_performance || null,
        entrance_preparation: context.academic_background.entrance_preparation || null
      },
      present_context: {
        interests: Array.isArray(context.present_context?.interests) ? context.present_context.interests : [],
        work_preferences: Array.isArray(context.present_context?.work_preferences) ? context.present_context.work_preferences : [],
        learning_preference: context.present_context?.learning_preference || null,
        current_activities: Array.isArray(context.present_context?.current_activities) ? context.present_context.current_activities : []
      },
      mapped_skill_dimensions: context.skill_dimensions.map(compactDimension),
      generation_constraints: {
        question_count: requested,
        min_questions: QUESTION_RULES.minQuestions,
        max_questions: QUESTION_RULES.maxQuestions,
        allowed_response_types: QUESTION_RULES.allowedResponseTypes,
        allowed_signals: QUESTION_RULES.allowedSignals,
        audience: 'student who is currently in or has just completed Class 12'
      }
    };
  }

  function buildSystemInstruction() {
    return [
      'You are the Meet 2 Dynamic Form 5 Question Generator.',
      'Generate a short diagnostic that measures the student’s current foundational capability, curiosity, and learning readiness for the supplied target role.',
      'The student is at or just after Class 12. Assume little or no professional experience.',
      '',
      'NON-NEGOTIABLE RULES:',
      '1. Assess the student’s CURRENT foundation, not the university or professional curriculum they will learn later.',
      '2. Use only the supplied mapped skill dimensions. Do not introduce new skill dimensions.',
      '3. Do not turn advanced roadmap topics into prerequisites. Avoid advanced frameworks, university-level theory, or job-specific tools unless the mapped dimension explicitly requires a simple awareness check.',
      '4. Questions must be understandable to a Class 12 student who may have zero experience in the target field.',
      '5. A lack of prior experience must always be a valid answer; never treat zero experience as failure.',
      '6. Prefer plain language and concrete situations over career jargon.',
      '7. Each question must measure one primary skill dimension.',
      '8. Cover the highest-importance dimensions first and avoid duplicate questions unless needed to reach the requested count.',
      '9. Keep questions diagnostic, not instructional.',
      '10. Do not rank the student, recommend a career, or state that a skill is required to enter the profession.',
      '11. Return JSON only. No markdown fences. No explanation outside the JSON.',
      '',
      'OUTPUT CONTRACT:',
      'Return an object matching the supplied JSON Schema exactly.',
      'Every question must contain: id, skill_id, skill_label, signal, response_type, question, helper_text, options.',
      'Every option must contain: value, label, score where score is an integer from 1 to 5.',
      'Keep the question count between 4 and 7.',
      'Use stable ids q1, q2, q3, ... in order.',
      'Do not put sensitive or discriminatory attributes into questions.'
    ].join('\n');
  }

  function buildUserPrompt(requestPayload) {
    return [
      'Create Dynamic Form 5 for this student context.',
      '',
      JSON.stringify(requestPayload, null, 2),
      '',
      'Before writing each question, silently check:',
      '- Is this measuring a present-day foundation rather than future curriculum?',
      '- Is this understandable to a Class 12 student?',
      '- Is the mapped skill dimension actually visible in the question?',
      '- Could a student with zero experience answer it honestly?',
      '- Does the question avoid assuming college-level knowledge?',
      '- Is it meaningfully different from the other questions?'
    ].join('\n');
  }

  function buildPrompt(context, questionCount) {
    const payload = buildRequestPayload(context, questionCount);
    return {
      systemInstruction: buildSystemInstruction(),
      userPrompt: buildUserPrompt(payload),
      requestPayload: payload,
      expectedSchemaVersion: '1.0'
    };
  }

  const api = { QUESTION_RULES, assertContext, buildRequestPayload, buildSystemInstruction, buildUserPrompt, buildPrompt };
  if (typeof module !== 'undefined') module.exports = api;
  root.Meet2Form5Prompt = api;
})(typeof window !== 'undefined' ? window : globalThis);
