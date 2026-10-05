/* Meet 2 — Form 5 context builder */
(function (root) {
  'use strict';

  function deriveStudentStage(profile) {
    const explicit = String(profile?.situation?.studentStage || '').trim();
    if (explicit) return explicit;

    const decision = String(profile?.situation?.college_status || profile?.future?.collegeDecision || '').toLowerCase();
    if (decision.includes('college')) return 'post_12_pre_college';
    if (decision.includes('shortlist')) return 'post_12_pre_college';
    if (decision.includes('open')) return 'post_12_pre_college';
    return 'post_12_pre_college';
  }

  function buildContext(profile) {
    const roleValue = profile?.goal?.career || '';
    const certainty = profile?.goal?.certainty || '';
    const openToDiscovery = !roleValue || roleValue === 'Not sure yet' || certainty === 'exploring' || certainty === 'not_sure';
    const normalizer = root.Meet2GoalNormalizer;
    const skillMap = root.MEET2_SKILL_MAP;

    let roleId = 'career_explorer';
    let displayName = 'Career Explorer';
    let dimensions = skillMap?.roles?.career_explorer?.dimensions || [];

    if (!openToDiscovery && roleValue && normalizer?.getRoleSkillDimensions) {
      const resolved = normalizer.getRoleSkillDimensions(roleValue, skillMap);
      if (resolved.role_id) {
        roleId = resolved.role_id;
        displayName = resolved.display_name || roleValue;
        dimensions = resolved.dimensions || dimensions;
      }
    }

    return {
      student_stage: deriveStudentStage(profile),
      role: { role_id: roleId, display_name: displayName },
      academic_background: {
        stream: profile?.past?.stream || null,
        subjects: Array.isArray(profile?.past?.strong_subjects) ? profile.past.strong_subjects : (Array.isArray(profile?.past?.subjects) ? profile.past.subjects : []),
        strongest_subjects: Array.isArray(profile?.past?.strong_subjects) ? profile.past.strong_subjects : (Array.isArray(profile?.past?.strongestSubjects) ? profile.past.strongestSubjects : []),
        academic_performance: profile?.past?.academic_level || profile?.past?.academicPerformance || null,
        entrance_preparation: profile?.past?.entrance_exam_status || profile?.past?.entrancePreparation || null
      },
      present_context: {
        interests: Array.isArray(profile?.present?.interests) ? profile.present.interests : [],
        work_preferences: Array.isArray(profile?.present?.work_preferences) ? profile.present.work_preferences : [],
        learning_preference: profile?.present?.learning_preference || null,
        current_activities: Array.isArray(profile?.present?.current_activities) ? profile.present.current_activities : []
      },
      skill_dimensions: dimensions
    };
  }

  root.Meet2Form5Context = { deriveStudentStage, buildContext };
})(typeof window !== 'undefined' ? window : globalThis);
