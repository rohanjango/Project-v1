/* Meet 2 — Step 3 local mock for the future Gemini Form 5 endpoint.
 * This is intentionally deterministic and role-aware. It is NOT the real LLM.
 */
(function (root) {
  'use strict';

  const GENERIC_DIMENSIONS = [
    { id: 'problem_solving', label: 'Problem Solving', importance: 'high' },
    { id: 'communication', label: 'Communication', importance: 'high' },
    { id: 'curiosity', label: 'Curiosity', importance: 'medium' },
    { id: 'learning_persistence', label: 'Learning Persistence', importance: 'medium' }
  ];

  const TEMPLATES = {
    programming_logic: {
      signal: 'experience', response_type: 'single_select',
      question: 'How comfortable are you with giving a computer clear instructions to solve a small problem?',
      helper_text: 'You do not need prior coding experience to answer this.',
      options: [
        ['never_tried', 'I have never tried', 1],
        ['seen_examples', 'I have seen examples but not done it myself', 2],
        ['small_tasks', 'I can handle small coding tasks', 3],
        ['comfortable', 'I am comfortable writing simple programs', 4],
        ['very_comfortable', 'I can build and debug small programs', 5]
      ]
    },
    problem_solving: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'You get a problem you have never seen before. What do you usually do first?',
      helper_text: 'Choose the response that feels most like you today.',
      options: [
        ['wait', 'I wait for someone to show me how', 1],
        ['try_random', 'I try a few things without a clear plan', 2],
        ['break_down', 'I break it into smaller parts', 4],
        ['plan_test', 'I break it down, test an idea, and adjust', 5]
      ]
    },
    mathematical_reasoning: {
      signal: 'confidence', response_type: 'scale_1_5',
      question: 'How comfortable are you with patterns, equations, quantities, and mathematical reasoning?',
      helper_text: 'Think about the kind of maths you have already encountered in school.',
      options: [
        ['1', 'Very uncomfortable', 1], ['2', 'Needs practice', 2], ['3', 'Comfortable with basics', 3], ['4', 'Quite comfortable', 4], ['5', 'Very comfortable', 5]
      ]
    },
    quantitative_reasoning: {
      signal: 'confidence', response_type: 'scale_1_5',
      question: 'How comfortable are you comparing numbers, ratios, trends, and simple quantitative relationships?',
      helper_text: 'Use your school-level experience as the reference point.',
      options: [
        ['1', 'Very uncomfortable', 1], ['2', 'Needs practice', 2], ['3', 'Comfortable with basics', 3], ['4', 'Quite comfortable', 4], ['5', 'Very comfortable', 5]
      ]
    },
    technical_curiosity: {
      signal: 'interest', response_type: 'single_select',
      question: 'When you use a new app, website, or technology, how often do you wonder how it works?',
      helper_text: 'There is no right answer; we are measuring your natural curiosity.',
      options: [
        ['rarely', 'Almost never', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['always', 'Very often — I like figuring it out', 5]
      ]
    },
    learning_persistence: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'If something you are learning does not work after several attempts, what are you most likely to do?',
      helper_text: 'Choose the response that best matches your usual behavior.',
      options: [
        ['stop', 'I usually stop and move on', 1], ['break', 'I take a break and may return later', 2], ['seek_help', 'I try again and look for help', 4], ['iterate', 'I test different approaches until I understand it', 5]
      ]
    },
    problem_decomposition: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'When a task feels too large, how comfortable are you turning it into smaller steps?',
      helper_text: 'Think about school projects, events, or things you have built.',
      options: [
        ['rarely', 'I usually need someone to break it down', 1], ['sometimes', 'I can do it with some help', 2], ['usually', 'I can usually split it into steps', 4], ['strong', 'I naturally start by breaking it down', 5]
      ]
    },
    debugging_mindset: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'Something you built is not working. What is your first instinct?',
      helper_text: 'This can be a code project, school project, or any thing you made.',
      options: [
        ['give_up', 'I assume it is too difficult', 1], ['ask', 'I ask someone for the exact answer', 2], ['inspect', 'I inspect what changed and test the likely cause', 4], ['systematic', 'I reproduce the problem, isolate it, and test one change at a time', 5]
      ]
    },
    pattern_finding: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'When you look at a table, chart, or set of numbers, how often do you notice useful patterns on your own?',
      helper_text: 'Think about situations from school or everyday life.',
      options: [
        ['rarely', 'Rarely', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['very_often', 'Very often', 5]
      ]
    },
    structured_problem_solving: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'You are asked a vague question. How likely are you to turn it into smaller questions you can actually answer?',
      helper_text: 'Choose what you would most likely do today.',
      options: [
        ['wait', 'I wait for a clearer question', 1], ['guess', 'I make a quick guess and start', 2], ['split', 'I split it into smaller questions', 4], ['evidence', 'I split it, identify evidence, and test each part', 5]
      ]
    },
    curiosity_about_evidence: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'When two people make different claims, how interested are you in checking the evidence before choosing a side?',
      helper_text: 'This is about how you naturally approach information.',
      options: [
        ['low', 'Not very interested', 1], ['some', 'A little interested', 2], ['high', 'Quite interested', 4], ['very_high', 'Very interested — I like checking the evidence', 5]
      ]
    },
    communication: {
      signal: 'confidence', response_type: 'scale_1_5',
      question: 'How confident are you explaining an idea so that another person can understand it clearly?',
      helper_text: 'Think about speaking, writing, presenting, or explaining to a friend.',
      options: [
        ['1', 'Very difficult', 1], ['2', 'Needs practice', 2], ['3', 'Okay in familiar situations', 3], ['4', 'Usually clear', 4], ['5', 'Very confident', 5]
      ]
    },
    user_empathy: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'A friend says an app is confusing. What would you be most interested in doing first?',
      helper_text: 'There is no professional design or product knowledge required.',
      options: [
        ['dismiss', 'Tell them to figure it out', 1], ['guess', 'Guess what they found confusing', 2], ['ask', 'Ask what they were trying to do and where they got stuck', 4], ['observe', 'Ask, observe, and compare their experience with your own', 5]
      ]
    },
    problem_framing: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'Someone asks you to “build a better app.” What would you want to understand first?',
      helper_text: 'Think about what information you would need before deciding on a solution.',
      options: [
        ['features', 'Which features to add', 2], ['visuals', 'What the app should look like', 2], ['problem', 'Who has the problem and what is difficult for them', 4], ['evidence', 'Who has the problem, what they need, and how we know', 5]
      ]
    },
    decision_making: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'Two options are both good, but you can only choose one. What do you usually do?',
      helper_text: 'Choose the response closest to your normal decision style.',
      options: [
        ['avoid', 'I avoid choosing until someone else decides', 1], ['instinct', 'I pick the one I like more', 2], ['compare', 'I compare the important trade-offs', 4], ['criteria', 'I set criteria, compare evidence, and choose', 5]
      ]
    },
    analytical_thinking: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'When two options give different results, how likely are you to compare the evidence before deciding why?',
      helper_text: 'We are measuring how you reason from information, not advanced statistics.',
      options: [
        ['rarely', 'Rarely', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['always', 'Almost always', 5]
      ]
    },
    collaboration: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'You and a teammate disagree about how to do a project. What do you usually do?',
      helper_text: 'Think about school projects, clubs, events, or team activities.',
      options: [
        ['insist', 'Push for my idea', 1], ['avoid', 'Avoid the disagreement', 2], ['discuss', 'Discuss the reasons and look for common ground', 4], ['synthesize', 'Listen, compare evidence, and find a workable combined approach', 5]
      ]
    },
    visual_thinking: {
      signal: 'confidence', response_type: 'scale_1_5',
      question: 'How comfortable are you turning an idea into a simple visual sketch, layout, or diagram?',
      helper_text: 'Paper sketches count. This does not require advanced design software.',
      options: [
        ['1', 'Very uncomfortable', 1], ['2', 'Needs practice', 2], ['3', 'Comfortable with simple sketches', 3], ['4', 'Quite comfortable', 4], ['5', 'Very comfortable', 5]
      ]
    },
    creative_problem_solving: {
      signal: 'scenario', response_type: 'scenario_single_select',
      question: 'When a first idea does not work, how likely are you to try a different way of solving the same problem?',
      helper_text: 'We are measuring creative flexibility, not drawing skill.',
      options: [
        ['rarely', 'Rarely', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['very_often', 'Very often', 5]
      ]
    },
    observation: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'How often do you notice small things that make a product, website, or everyday object easier or harder to use?',
      helper_text: 'Examples can come from apps, websites, school systems, or everyday objects.',
      options: [
        ['rarely', 'Rarely notice them', 1], ['sometimes', 'Sometimes notice them', 2], ['often', 'Often notice them', 4], ['always', 'Almost always notice them', 5]
      ]
    },
    design_curiosity: {
      signal: 'interest', response_type: 'single_select',
      question: 'How interested are you in understanding why a visual or interface feels clear, confusing, attractive, or frustrating?',
      helper_text: 'This is about curiosity, not prior design training.',
      options: [
        ['low', 'Not very interested', 1], ['some', 'A little interested', 2], ['high', 'Quite interested', 4], ['very_high', 'Very interested', 5]
      ]
    },
    initiative: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'You notice a small problem that nobody has asked you to solve. What are you most likely to do?',
      helper_text: 'Think about school, family, clubs, or everyday situations.',
      options: [
        ['ignore', 'Ignore it unless someone asks', 1], ['mention', 'Mention it to someone', 2], ['try', 'Try a small solution', 4], ['organize', 'Start a small experiment and involve others if useful', 5]
      ]
    },
    problem_finding: {
      signal: 'interest', response_type: 'single_select',
      question: 'How often do you notice things that could be made easier, faster, cheaper, or more useful?',
      helper_text: 'We are measuring your tendency to spot opportunities.',
      options: [
        ['rarely', 'Rarely', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['very_often', 'Very often', 5]
      ]
    },
    experimentation: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'When you are unsure whether an idea will work, how likely are you to test a small version first?',
      helper_text: 'A small experiment can be as simple as trying one version with one person.',
      options: [
        ['avoid', 'I prefer to wait until I am sure', 1], ['small', 'I sometimes test a small version', 2], ['usually', 'I usually test before committing', 4], ['always', 'I actively design small tests and learn from them', 5]
      ]
    },
    resilience: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'You put effort into an idea and it does not work. What are you most likely to do next?',
      helper_text: 'Think about school projects, competitions, or personal experiments.',
      options: [
        ['drop', 'Drop it completely', 1], ['pause', 'Pause for a while', 2], ['learn', 'Figure out what went wrong and try again', 4], ['iterate', 'Use the failure as feedback and test a better version', 5]
      ]
    },
    logical_reasoning: {
      signal: 'confidence', response_type: 'scale_1_5',
      question: 'How comfortable are you reasoning through a problem with several rules or conditions?',
      helper_text: 'Use school-level puzzles, maths, or logic as your reference point.',
      options: [
        ['1', 'Very uncomfortable', 1], ['2', 'Needs practice', 2], ['3', 'Comfortable with basics', 3], ['4', 'Quite comfortable', 4], ['5', 'Very comfortable', 5]
      ]
    },
    attention_to_detail: {
      signal: 'behavior', response_type: 'scenario_single_select',
      question: 'When working with numbers or detailed information, how often do you double-check for small mistakes?',
      helper_text: 'Think about school work, forms, calculations, or projects.',
      options: [
        ['rarely', 'Rarely', 1], ['sometimes', 'Sometimes', 2], ['often', 'Often', 4], ['always', 'Almost always', 5]
      ]
    }
  };

  function genericQuestion(d, index) {
    const label = d.label || d.id;
    return {
      id: `q${index}`,
      skill_id: d.id,
      skill_label: label,
      signal: 'confidence',
      response_type: 'scale_1_5',
      question: `How confident are you in ${String(label).toLowerCase()} today?`,
      helper_text: 'Think about your current experience, not what you hope to learn later.',
      options: [
        { value: '1', label: 'Very low confidence', score: 1 },
        { value: '2', label: 'Needs practice', score: 2 },
        { value: '3', label: 'Comfortable with basics', score: 3 },
        { value: '4', label: 'Quite confident', score: 4 },
        { value: '5', label: 'Very confident', score: 5 }
      ]
    };
  }

  function buildQuestion(dimension, index) {
    const template = TEMPLATES[dimension.id];
    if (!template) return genericQuestion(dimension, index);
    return {
      id: `q${index}`,
      skill_id: dimension.id,
      skill_label: dimension.label,
      signal: template.signal,
      response_type: template.response_type,
      question: template.question,
      helper_text: template.helper_text,
      options: template.options.map(([value, label, score]) => ({ value, label, score }))
    };
  }

  function generate(context = {}) {
    const planner = root.Meet2QuestionPlanner;
    const guard = root.Meet2QuestionQualityGuard;
    if (!planner?.plan) throw new Error('Meet2QuestionPlanner is not loaded.');
    if (!guard?.assertValid) throw new Error('Meet2QuestionQualityGuard is not loaded.');

    const plan = planner.plan(context);
    if (plan.question_count !== 5) {
      throw new Error(`Question Planner could only produce ${plan.question_count} unique mapped skills; exactly 5 are required.`);
    }

    const questions = plan.slots.map((slot) => {
      const dimension = (context.skill_dimensions || []).find(d => d.id === slot.skill_id);
      const q = buildQuestion(dimension, slot.question_number);
      // The planner owns the diagnostic signal; keep the mock question consistent with it.
      q.signal = slot.signal;
      q.response_type = slot.response_type;
      return q;
    });

    const response = {
      success: true,
      source: 'mock-gemini-form5',
      schema_version: '1.0',
      role_id: context?.role?.role_id || 'career_explorer',
      student_stage: context?.student_stage || 'post_12_pre_college',
      question_count: questions.length,
      question_plan: plan,
      questions
    };

    guard.assertValid(response, context, 5);
    return response;
  }

  root.Meet2MockForm5 = { generate };
  if (typeof module !== 'undefined') module.exports = { generate };
})(typeof window !== 'undefined' ? window : globalThis);
