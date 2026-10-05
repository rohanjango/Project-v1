const fs = require('fs');
const path = require('path');
const { normalizeTargetRole, getRoleSkillDimensions } = require('../../frontend/goal-normalizer');

const mapPath = path.join(__dirname, '..', '..', 'frontend', 'skill-map.json');
const skillMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const roleIds = Object.keys(skillMap.roles);
if (roleIds.length < 6) throw new Error('Expected at least 6 mapped roles.');

for (const [roleId, role] of Object.entries(skillMap.roles)) {
  if (!role.display_name) throw new Error(`${roleId}: missing display_name`);
  if (!Array.isArray(role.dimensions) || role.dimensions.length === 0) {
    throw new Error(`${roleId}: missing skill dimensions`);
  }
  for (const dimension of role.dimensions) {
    if (!dimension.id || !dimension.label || !dimension.question_focus) {
      throw new Error(`${roleId}: malformed dimension`);
    }
  }
}

const checks = [
  ['AI Engineer', 'ai_engineer'],
  ['Designer', 'product_designer'],
  ['Product Manager', 'product_manager'],
  ['Finance / Quant', 'finance_quant']
];

for (const [input, expected] of checks) {
  const result = normalizeTargetRole(input);
  if (result.role_id !== expected) {
    throw new Error(`${input} -> ${result.role_id}; expected ${expected}`);
  }
}

const ai = getRoleSkillDimensions('AI Engineer', skillMap);
if (ai.dimensions.length !== skillMap.roles.ai_engineer.dimensions.length) {
  throw new Error('AI Engineer dimension retrieval failed.');
}

console.log(`PASS: ${roleIds.length} roles validated.`);
console.log('PASS: role normalization validated.');
console.log('PASS: skill dimension retrieval validated.');
