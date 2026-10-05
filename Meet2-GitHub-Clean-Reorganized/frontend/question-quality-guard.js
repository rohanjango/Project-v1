/* Meet 2 — Step 4 Form 5 Quality Guard
 * Validates generated Form 5 questions before the UI can display them.
 * This is intentionally conservative: it checks structure, goal-skill alignment,
 * duplication, age-appropriateness markers, and response consistency.
 */
(function (root) {
  'use strict';

  const ALLOWED_SIGNALS = new Set(['experience', 'confidence', 'scenario', 'interest', 'behavior']);
  const RESPONSE_BY_SIGNAL = {
    experience: 'single_select',
    confidence: 'scale_1_5',
    scenario: 'scenario_single_select',
    interest: 'single_select',
    behavior: 'scenario_single_select'
  };

  // These are not "bad topics" in themselves; they are markers that usually indicate
  // the generator has drifted from foundation-level diagnosis into future curriculum.
  const ADVANCED_MARKERS = [
    'pytorch api', 'tensorflow api', 'deep learning framework', 'linear algebra coursework',
    'calculus techniques', 'advanced system design', 'competitive programming theory',
    'stochastic calculus', 'advanced financial models', 'university probability theory',
    'transformer architecture', 'cuda kernel', 'distributed systems design'
  ];

  function normalizeText(value) {
    return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function validate(response, context, expectedCount = 5) {
    const issues = [];
    const questions = Array.isArray(response?.questions) ? response.questions : [];
    const allowedSkills = new Set((context?.skill_dimensions || []).map(d => d.id));

    if (questions.length !== expectedCount) {
      issues.push(`Expected exactly ${expectedCount} questions; received ${questions.length}.`);
    }

    const ids = new Set();
    const skills = new Set();
    const texts = new Set();

    questions.forEach((q, index) => {
      const position = index + 1;
      if (!q || typeof q !== 'object') {
        issues.push(`Question ${position} is not an object.`);
        return;
      }

      if (!q.id || ids.has(q.id)) issues.push(`Question ${position} has a duplicate or missing id.`);
      ids.add(q.id);

      if (!q.skill_id || !allowedSkills.has(q.skill_id)) {
        issues.push(`Question ${position} uses a skill that is not in the mapped skill set.`);
      }
      if (skills.has(q.skill_id)) issues.push(`Skill '${q.skill_id}' is assessed more than once.`);
      skills.add(q.skill_id);

      const questionText = normalizeText(q.question);
      if (questionText.length < 10) issues.push(`Question ${position} is too short.`);
      if (texts.has(questionText)) issues.push(`Question ${position} duplicates another question.`);
      texts.add(questionText);

      if (!ALLOWED_SIGNALS.has(q.signal)) issues.push(`Question ${position} has an invalid signal type.`);
      if (RESPONSE_BY_SIGNAL[q.signal] && q.response_type !== RESPONSE_BY_SIGNAL[q.signal]) {
        issues.push(`Question ${position} response type does not match its signal type.`);
      }

      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) {
        issues.push(`Question ${position} must have between 2 and 5 options.`);
      } else {
        const values = new Set();
        q.options.forEach((option, optionIndex) => {
          if (!option?.value || !option?.label) issues.push(`Question ${position}, option ${optionIndex + 1} is incomplete.`);
          if (values.has(option?.value)) issues.push(`Question ${position} has duplicate option values.`);
          values.add(option?.value);
          if (!Number.isInteger(option?.score) || option.score < 1 || option.score > 5) {
            issues.push(`Question ${position}, option ${optionIndex + 1} has an invalid score.`);
          }
        });
      }

      const combined = normalizeText(`${q.question} ${q.helper_text || ''}`);
      ADVANCED_MARKERS.forEach(marker => {
        if (combined.includes(marker)) {
          issues.push(`Question ${position} contains advanced-curriculum marker '${marker}'.`);
        }
      });
    });

    const signalTypes = new Set(questions.map(q => q?.signal).filter(Boolean));
    if (questions.length === expectedCount && signalTypes.size < 3) {
      issues.push('Question set is too narrow: use at least three diagnostic signal types.');
    }

    if (response?.role_id && context?.role?.role_id && response.role_id !== context.role.role_id) {
      issues.push('Generated question set returned the wrong role context.');
    }

    return { valid: issues.length === 0, issues };
  }

  function assertValid(response, context, expectedCount = 5) {
    const result = validate(response, context, expectedCount);
    if (!result.valid) throw new Error(result.issues.join(' '));
    return response;
  }

  root.Meet2QuestionQualityGuard = { validate, assertValid, ADVANCED_MARKERS: [...ADVANCED_MARKERS] };
  if (typeof module !== 'undefined') module.exports = { validate, assertValid, ADVANCED_MARKERS: [...ADVANCED_MARKERS] };
})(typeof window !== 'undefined' ? window : globalThis);
