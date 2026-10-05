const fs = require('fs');
const path = require('path');
const prompt = require('../../frontend/form5-prompt.js');
const contexts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'form5-example-contexts.json'), 'utf8'));
for (const [roleId, context] of Object.entries(contexts)) {
  const result = prompt.buildPrompt(context, 5);
  console.log(`\n=== ${roleId} ===`);
  console.log('stage:', result.requestPayload.student_stage);
  console.log('role:', result.requestPayload.role.role_id);
  console.log('dimensions:', result.requestPayload.mapped_skill_dimensions.map(d => d.id).join(', '));
  console.log('question count:', result.requestPayload.generation_constraints.question_count);
}
try {
  prompt.buildPrompt({ role: { role_id: 'ai_engineer' } });
  throw new Error('Expected validation failure did not occur.');
} catch (error) {
  console.log('\nValidation guard:', error.message);
}
