/* Meet 2 — MVP Student Profile Schema Adapter
 * Converts internal diagnostic state into P3's exact student profile shape.
 * Internal fields such as skillResponses are intentionally excluded.
 */
(function (root) {
  'use strict';

  const SCORE_LEVEL = {
    1: 'beginner',
    2: 'developing',
    3: 'basic',
    4: 'good',
    5: 'strong'
  };

  function scoreLevel(score) {
    const n = Number(score);
    return SCORE_LEVEL[n] || 'not_assessed';
  }

  function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function pickExperienceValue(question, response) {
    if (!question || !response) return '';
    const value = cleanString(response.value);
    if (value) return value;
    const option = Array.isArray(question.options)
      ? question.options.find(item => Number(item.score) === Number(response.score))
      : null;
    return cleanString(option?.value || option?.label);
  }

  function pickLearningValue(questions, responses) {
    const preferred = questions.find(q => q?.skill_id === 'learning_persistence');
    if (preferred && responses?.[preferred.id]) {
      return pickExperienceValue(preferred, responses[preferred.id]) || scoreLevel(responses[preferred.id].score);
    }

    const learningBehavior = questions.find(q =>
      q?.signal === 'behavior' && /learning|persistence/i.test(String(q?.skill_label || q?.skill_id || ''))
    );
    if (learningBehavior && responses?.[learningBehavior.id]) {
      return pickExperienceValue(learningBehavior, responses[learningBehavior.id]) || scoreLevel(responses[learningBehavior.id].score);
    }

    return 'not_directly_assessed_in_form_5';
  }

  function buildSkillsSection(state, questions) {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const responses = state?.skillResponses && typeof state.skillResponses === 'object'
      ? state.skillResponses
      : {};

    // P3's schema leaves technical as an open string-valued object.
    // We use it as the role-specific foundational-skill score map.
    const technical = {};
    safeQuestions.forEach(question => {
      const response = responses[question.id];
      if (!response) return;
      const skillId = cleanString(question.skill_id);
      if (!skillId) return;
      technical[skillId] = scoreLevel(response.score);
    });

    const experienceQuestion = safeQuestions.find(q => q?.signal === 'experience');
    let projectExperience = 'not_directly_assessed_in_form_5';
    if (experienceQuestion && responses[experienceQuestion.id]) {
      projectExperience = pickExperienceValue(experienceQuestion, responses[experienceQuestion.id]) || scoreLevel(responses[experienceQuestion.id].score);
    }

    return {
      technical,
      project_experience: projectExperience,
      independent_learning: pickLearningValue(safeQuestions, responses)
    };
  }

  function toStudentProfile(state, questions) {
    const safe = state || {};
    return {
      student: {
        past: {
          stream: safe.past?.stream ?? null,
          strong_subjects: Array.isArray(safe.past?.strong_subjects) ? safe.past.strong_subjects.slice() : [],
          academic_level: safe.past?.academic_level ?? null,
          entrance_exam_status: Array.isArray(safe.past?.entrance_exam_status)
            ? safe.past.entrance_exam_status.map(item => ({
                name: cleanString(item?.name),
                status: cleanString(item?.status)
              }))
            : []
        },
        present: {
          interests: Array.isArray(safe.present?.interests) ? safe.present.interests.slice() : [],
          work_preferences: Array.isArray(safe.present?.work_preferences) ? safe.present.work_preferences.slice() : [],
          learning_preference: safe.present?.learning_preference ?? '',
          current_activities: Array.isArray(safe.present?.current_activities) ? safe.present.current_activities.slice() : []
        },
        situation: {
          college_status: safe.situation?.college_status ?? '',
          budget_preference: safe.situation?.budget_preference ?? '',
          relocation: safe.situation?.relocation ?? '',
          priorities: Array.isArray(safe.situation?.priorities) ? safe.situation.priorities.slice() : [],
          time_availability: {
            hours_per_week: safe.situation?.time_availability?.hours_per_week ?? '',
            major_current_commitment: safe.situation?.time_availability?.major_current_commitment ?? ''
          }
        },
        goal: {
          career: safe.goal?.career ?? '',
          certainty: safe.goal?.certainty ?? '',
          motivations: Array.isArray(safe.goal?.motivations) ? safe.goal.motivations.slice() : [],
          success_definition: Array.isArray(safe.goal?.success_definition) ? safe.goal.success_definition.slice() : []
        },
        skills: buildSkillsSection(safe, Array.isArray(questions) ? questions : [])
      }
    };
  }

  root.Meet2ProfileSchemaAdapter = {
    scoreLevel,
    buildSkillsSection,
    toStudentProfile
  };

  if (typeof module !== 'undefined') module.exports = root.Meet2ProfileSchemaAdapter;
})(typeof window !== 'undefined' ? window : globalThis);
