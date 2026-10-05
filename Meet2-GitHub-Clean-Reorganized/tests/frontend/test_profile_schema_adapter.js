const adapter = require('../../frontend/profile-schema-adapter.js');

const state = {
  past: {
    stream: 'PCM',
    strong_subjects: ['Mathematics', 'Physics'],
    academic_level: 'above_average',
    entrance_exam_status: [{ name: 'JEE', status: 'preparing' }]
  },
  present: {
    interests: ['coding'],
    work_preferences: ['building_things'],
    learning_preference: 'learn_by_building',
    current_activities: ['coding']
  },
  situation: {
    college_status: 'still_comparing_options',
    budget_preference: 'prefer_low_cost_options',
    relocation: 'anywhere_in_india',
    priorities: ['strong_technical_skills'],
    time_availability: { hours_per_week: '5_to_10', major_current_commitment: 'JEE_preparation' }
  },
  goal: {
    career: 'AI Engineer',
    certainty: 'fairly_certain',
    motivations: ['technology'],
    success_definition: ['strong_first_job']
  },
  skillResponses: {
    q1: { value: 'small_tasks', score: 3 },
    q2: { value: 'break_down', score: 4 },
    q3: { value: '4', score: 4 },
    q4: { value: 'very_high', score: 5 },
    q5: { value: 'seek_help', score: 4 }
  }
};

const questions = [
  { id: 'q1', skill_id: 'programming_logic', signal: 'experience', options: [] },
  { id: 'q2', skill_id: 'problem_solving', signal: 'scenario', options: [] },
  { id: 'q3', skill_id: 'mathematical_reasoning', signal: 'confidence', options: [] },
  { id: 'q4', skill_id: 'technical_curiosity', signal: 'interest', options: [] },
  { id: 'q5', skill_id: 'learning_persistence', signal: 'behavior', options: [] }
];

const result = adapter.toStudentProfile(state, questions);
if (!result.student || !result.student.skills) throw new Error('Missing student profile');
if (result.student.skills.technical.programming_logic !== 'basic') throw new Error('Programming skill mapping failed');
if (result.student.skills.project_experience !== 'small_tasks') throw new Error('Project experience mapping failed');
if (result.student.skills.independent_learning !== 'seek_help') throw new Error('Independent learning mapping failed');
if ('skillResponses' in result.student || 'role_id' in result.student) throw new Error('Internal fields leaked into schema profile');
console.log('PROFILE SCHEMA ADAPTER TEST: PASS');
