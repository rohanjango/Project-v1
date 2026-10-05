/* Meet 2 — Step 4 Question Planner
 * Chooses exactly five diagnostic slots from the goal-specific skill map.
 * The planner is deterministic: it decides WHAT to assess; Gemini can later decide HOW to phrase it.
 */
(function (root) {
  'use strict';

  const SIGNAL_PRIORITY = ['experience', 'scenario', 'confidence', 'interest', 'behavior'];
  const SIGNAL_TO_RESPONSE = {
    experience: 'single_select',
    confidence: 'scale_1_5',
    scenario: 'scenario_single_select',
    interest: 'single_select',
    behavior: 'scenario_single_select'
  };

  const IMPORTANCE = { high: 0, medium: 1, low: 2 };

  function scoreDimension(dimension, index) {
    return (IMPORTANCE[dimension.importance] ?? 3) * 10 + index;
  }

  function chooseSignal(dimension, usedSignals) {
    const preferred = Array.isArray(dimension.preferred_types) ? dimension.preferred_types : [];
    for (const signal of SIGNAL_PRIORITY) {
      if (preferred.includes(signal) && !usedSignals.has(signal)) return signal;
    }
    for (const signal of preferred) {
      if (SIGNAL_TO_RESPONSE[signal]) return signal;
    }
    return 'confidence';
  }

  function plan(context) {
    const dimensions = Array.isArray(context?.skill_dimensions)
      ? context.skill_dimensions.filter(d => d && d.id)
      : [];

    const unique = [];
    const seen = new Set();
    dimensions.forEach(d => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        unique.push(d);
      }
    });

    unique.sort((a, b) => scoreDimension(a, unique.indexOf(a)) - scoreDimension(b, unique.indexOf(b)));

    if (!unique.length) {
      return { question_count: 0, slots: [], warnings: ['No mapped skill dimensions were supplied.'] };
    }

    const targetCount = Math.min(5, unique.length);
    const slots = [];
    const usedSkills = new Set();
    const usedSignals = new Set();

    // First pass: prioritize high-importance dimensions while maximizing signal diversity.
    for (const dimension of unique) {
      if (slots.length >= targetCount) break;
      const signal = chooseSignal(dimension, usedSignals);
      slots.push({
        question_number: slots.length + 1,
        skill_id: dimension.id,
        skill_label: dimension.label,
        signal,
        response_type: SIGNAL_TO_RESPONSE[signal],
        importance: dimension.importance || 'medium'
      });
      usedSkills.add(dimension.id);
      usedSignals.add(signal);
    }

    // If a role has fewer than five mapped skills, do not duplicate skills.
    // The final validator will reject an underspecified plan; this keeps the engine honest.
    return {
      question_count: slots.length,
      slots,
      role_id: context?.role?.role_id || 'career_explorer',
      student_stage: context?.student_stage || 'post_12_pre_college',
      signal_coverage: [...usedSignals]
    };
  }

  root.Meet2QuestionPlanner = { plan, SIGNAL_TO_RESPONSE };
  if (typeof module !== 'undefined') module.exports = { plan, SIGNAL_TO_RESPONSE };
})(typeof window !== 'undefined' ? window : globalThis);
