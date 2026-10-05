// Meet 2 Diagnostic — Step 5
// Reliable stage navigation, preserved answers, completion tracking, and validation gating.

tailwind.config = { darkMode: "class", theme: { extend: { "colors": { "secondary-fixed": "#e1e0ff", "outline-variant": "#3e484f", "surface-container-high": "#272a31", "surface": "#101319", "on-primary": "#00354a", "inverse-primary": "#00668a", "surface-tint": "#7bd0ff", "on-tertiary": "#003825", "outline": "#87929a", "tertiary-fixed-dim": "#45dfa4", "surface-dim": "#101319", "on-error": "#690005", "on-secondary-container": "#b0b2ff", "surface-variant": "#32353c", "on-secondary": "#1000a9", "on-primary-fixed-variant": "#004c69", "on-primary-container": "#004965", "surface-bright": "#363940", "on-secondary-fixed": "#07006c", "surface-container-low": "#191c22", "tertiary": "#4ee6aa", "surface-container-highest": "#32353c", "on-background": "#e1e2eb", "on-tertiary-fixed-variant": "#005137", "inverse-on-surface": "#2e3037", "primary-container": "#38bdf8", "primary-fixed": "#c4e7ff", "primary": "#8ed5ff", "primary-fixed-dim": "#7bd0ff", "on-primary-fixed": "#001e2c", "secondary": "#c0c1ff", "background": "#101319", "on-surface": "#e1e2eb", "on-surface-variant": "#bdc8d1", "surface-variant": "#32353c", "tertiary-container": "#22c990", "on-tertiary-container": "#004e35", "error": "#ffb4ab", "error-container": "#93000a", "on-error-container": "#ffdad6", "on-secondary-container": "#b0b2ff", "secondary-container": "#3131c0", "surface-container-low": "#191c22", "surface-container-lowest": "#0b0e14", "tertiary-fixed": "#68fcbf", "on-tertiary-fixed": "#002114", "on-tertiary": "#003825", "inverse-surface": "#e1e2eb", "inverse-on-surface": "#2e3037", "on-secondary-fixed": "#07006c", "on-secondary-fixed-variant": "#2f2ebe", "secondary-fixed": "#e1e0ff", "secondary-fixed-dim": "#c0c1ff", "tertiary-fixed-dim": "#45dfa4" }, "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, "spacing": { "space-lg": "1.5rem", "space-sm": "0.5rem", "margin-mobile": "1rem", "gutter-mobile": "0.75rem", "margin": "2rem", "gutter": "1.25rem", "space-xs": "0.25rem", "space-md": "1rem", "space-xl": "2.5rem" }, "fontFamily": { "label-code": ["JetBrains Mono"], "headline-lg-mobile": ["Plus Jakarta Sans"], "body-sm": ["Plus Jakarta Sans"], "headline-lg": ["Plus Jakarta Sans"], "headline-md": ["Plus Jakarta Sans"], "label-badge": ["Plus Jakarta Sans"], "headline-sm": ["Plus Jakarta Sans"], "display-hero": ["Plus Jakarta Sans"], "body-lg": ["Plus Jakarta Sans"], "milestone-marker": ["JetBrains Mono"], "display-hero-mobile": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"] }, "fontSize": { "label-code": ["12px", { "lineHeight": "16px", "letterSpacing": "0.04em", "fontWeight": "500" }], "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "body-sm": ["13px", { "lineHeight": "18px", "fontWeight": "400" }], "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "600" }], "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "label-badge": ["11px", { "lineHeight": "14px", "letterSpacing": "0.02em", "fontWeight": "600" }], "headline-sm": ["18px", { "lineHeight": "26px", "letterSpacing": "-0.005em", "fontWeight": "600" }], "display-hero": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.03em", "fontWeight": "700" }], "body-lg": ["16px", { "lineHeight": "26px", "fontWeight": "400" }], "milestone-marker": ["11px", { "lineHeight": "14px", "letterSpacing": "0.06em", "fontWeight": "600" }], "display-hero-mobile": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "body-md": ["14px", { "lineHeight": "22px", "fontWeight": "400" }] } } } };

document.addEventListener('DOMContentLoaded', () => {
  let currentStage = 1;
  const maxStages = 5;
  let maxReachedStage = 1;
  const completedStages = new Set();
  let diagnosticComplete = false;

  // In-memory only for Step 2. We will persist/send this in Step 3/6.
  const answers = {
    past: {
      stream: null,
      strong_subjects: [],
      academic_level: null,
      entrance_exam_status: []
    },
    present: { interests: [], work_preferences: [], learning_preference: null, current_activities: [] },
    situation: {
      college_status: null,
      budget_preference: null,
      relocation: null,
      priorities: [],
      time_availability: {
        hours_per_week: null,
        major_current_commitment: null
      }
    },
    goal: { career: null, certainty: null, motivations: [], success_definition: [] },
    skills: {},
    skillResponses: {}
  };

  let form5Questions = [];
  let form5ContextKey = '';
  let form5Loading = false;
  let form5Error = '';

  // Form 1 UI-only state. These values are never part of the final schema.
  let scienceCardOpen = false;
  let strongSubjectsAnswered = false;
  let entranceExamDraftNames = new Set();
  let entranceStatusDraft = null;

  function getDiagnosticState() {
    return structuredClone(answers);
  }

  function getStudentProfile() {
    if (!window.Meet2ProfileSchemaAdapter?.toStudentProfile) {
      throw new Error('Student profile schema adapter is not loaded.');
    }
    return window.Meet2ProfileSchemaAdapter.toStudentProfile(answers, form5Questions);
  }

  function getForm1PastSchemaSection() {
    return structuredClone(answers.past);
  }

  function getForm4GoalSchemaSection() {
    return structuredClone(answers.goal);
  }

  const stageMeta = {
    1: {
      key: 'past',
      stepLabel: 'STEP 01 — PAST ACADEMIC FOUNDATION',
      title: 'Where are you coming from?',
      subtitle: 'Tell us about your 12th grade academic stream and foundational background.',
      nextLabel: 'Continue to Present (02)',
      aiNote: 'Your academic stream and subject profile help us understand the foundation you are starting from. We then calibrate confidence, preparation, and route fit.'
    },
    2: {
      key: 'present',
      stepLabel: 'STEP 02 — PRESENT INQUIRY',
      title: 'What are you curious about today?',
      subtitle: 'Tell us what interests you, how you like to work and learn, and what you are already doing.',
      nextLabel: 'Continue to Future (03)',
      aiNote: 'Interests help us distinguish what you can study from what you actually want to explore.'
    },
    3: {
      key: 'situation',
      stepLabel: 'STEP 03 — CURRENT SITUATION',
      title: 'What does your current situation allow?',
      subtitle: 'Tell us about your college status, practical constraints, priorities, and time available right now.',
      nextLabel: 'Continue to Goal (04)',
      aiNote: 'Your current situation helps the route engine understand what is practical for you right now.'
    },
    4: {
      key: 'goal',
      stepLabel: 'STEP 04 — CAREER HORIZON',
      title: 'Where do you want to go?',
      subtitle: 'Tell us the career direction you want, how certain you are, what motivates you, and what success means to you.',
      nextLabel: 'Continue to Skills (05)',
      aiNote: 'Your goal becomes the destination while your motivations and definition of success help the route engine understand why it matters.'
    },
    5: {
      key: 'skills',
      stepLabel: 'STEP 05 — CAPABILITY CALIBRATION',
      title: 'What can you do today?',
      subtitle: 'These questions are generated from your goal and current background. They measure your present-day foundation, not future university topics.',
      nextLabel: 'Complete Diagnostic & Generate Roadmap',
      aiNote: 'Form 5 adapts to the goal you selected and measures the foundations you bring with you today.'
    }
  };

  const progressBar = document.getElementById('progressBar');
  const stageIndicator = document.getElementById('stageIndicator');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const nextBtnLabel = document.getElementById('nextBtnLabel');
  const aiLiveText = document.getElementById('aiLiveText');
  const stepContent = document.getElementById('stepContent');
  const navPills = document.querySelectorAll('.stage-nav-pill');
  const drawerToggleBtn = document.getElementById('drawerToggleBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const stageDrawer = document.getElementById('stageDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openDrawer() {
    stageDrawer.classList.remove('translate-x-full');
    stageDrawer.classList.add('translate-x-0');
    drawerOverlay.classList.remove('hidden');
  }
  function closeDrawer() {
    stageDrawer.classList.add('translate-x-full');
    stageDrawer.classList.remove('translate-x-0');
    drawerOverlay.classList.add('hidden');
  }
  drawerToggleBtn?.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function stageHeader(meta) {
    return `
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-milestone-marker text-milestone-marker mb-2">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          ${meta.stepLabel}
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">${meta.title}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-1">${meta.subtitle}</p>
      </div>`;
  }

  function renderStage1() {
    const selectedStream = answers.past.stream;
    const scienceActive = scienceCardOpen || selectedStream === 'PCM' || selectedStream === 'PCB';
    const subjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Programming',
      'None specifically', 'Other'
    ];
    const performanceOptions = [
      ['Strong', 'strong'],
      ['Above average', 'above_average'],
      ['Average', 'average'],
      ['Currently struggling', 'currently_struggling'],
      ['Prefer not to say', 'prefer_not_to_say']
    ];
    const entranceNames = [
      ['JEE', 'JEE'],
      ['Other engineering entrance', 'other_engineering_entrance']
    ];
    const entranceStatuses = [
      ['Preparing', 'preparing'],
      ['Attempted', 'attempted'],
      ['Not attempted', 'not_attempted'],
      ['Prefer not to say', 'prefer_not_to_say']
    ];

    const selectedNames = new Set(answers.past.entrance_exam_status.map(item => item.name));
    const selectedStatus = answers.past.entrance_exam_status.length
      ? answers.past.entrance_exam_status[0].status
      : entranceStatusDraft;
    if (answers.past.entrance_exam_status.length) {
      entranceExamDraftNames = new Set(selectedNames);
      entranceStatusDraft = selectedStatus;
    }

    return `
      ${stageHeader({
        ...stageMeta[1],
        title: 'What is your academic background?',
        subtitle: 'Tell us what you studied, where you felt strongest, your overall performance, and your entrance-exam preparation.'
      })}

      <div class="space-y-space-md">
        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0">
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 1</div>
              <div class="flex items-start justify-between gap-4">
                <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What subjects / background have you studied?</h2>
              </div>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Select the academic stream that best matches your 12th-grade background.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>

          <div class="q1-stream-shell mt-space-md" id="streamSelector" aria-label="Academic stream options">
            <div class="q1-stream-viewport" id="streamViewport" tabindex="0">
              <div class="q1-stream-list">
                ${[
                  {
                    value: 'PCM', icon: 'science', title: 'Science', subtitle: 'PCM / PCB',
                    description: 'Select PCM or PCB so the saved profile matches the MVP schema exactly.',
                    tags: ['Mathematics', 'Physics', 'Chemistry', 'Biology']
                  },
                  {
                    value: 'Humanities', icon: 'palette', title: 'Arts / Humanities', subtitle: 'Social & Behavioral',
                    description: 'Psychology, Sociology, Political Systems, History & Fine Creative Arts.', tags: ['Critical Inquiry', 'Human Behavior']
                  },
                  {
                    value: 'Commerce', icon: 'query_stats', title: 'Commerce', subtitle: 'Fin, Acc & Quant',
                    description: 'Accounts, Business Studies, Economics, Applied Math & Corporate Markets', tags: ['Microeconomics', 'Auditing']
                  },
                  {
                    value: 'Vocational', icon: 'terminal', title: 'Vocational / Polytech', subtitle: 'Applied Technical',
                    description: 'Computer Science, Applied Electronics, IT Systems & Practical Engineering.', tags: ['Software Intro', 'Applied Circuits']
                  }
                ].map(option => {
                  const selected = option.value === 'PCM'
                    ? scienceActive
                    : selectedStream === option.value;
                  return `
                    <div class="q1-stream-item">
                      <button
                        class="q1-stream-card ${selected ? 'is-selected' : ''}"
                        data-stream-card="${escapeHtml(option.value)}"
                        type="button"
                        aria-pressed="${selected}"
                      >
                        <div class="q1-stream-icon ${selected ? 'is-selected' : ''}">
                          <span class="material-symbols-outlined">${escapeHtml(option.icon)}</span>
                        </div>
                        <div class="q1-stream-content">
                          <div class="q1-stream-title-row">
                            <h3>${escapeHtml(option.title)}</h3>
                            <span class="q1-stream-subtitle">${escapeHtml(option.subtitle)}</span>
                          </div>
                          <p>${escapeHtml(option.description)}</p>
                          <div class="q1-stream-tags">
                            ${option.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
                          </div>
                        </div>
                        <span class="q1-stream-check ${selected && (option.value !== 'PCM' || selectedStream) ? '' : 'hidden'}">
                          <span class="material-symbols-outlined">check</span>
                        </span>
                      </button>
                      ${option.value === 'PCM' ? `
                        <div class="q1-science-subselect ${scienceActive ? '' : 'hidden'}" aria-label="Science pathway">
                          <div class="font-label-code text-label-code text-outline uppercase tracking-wider mb-2">SCIENCE PATHWAY</div>
                          <div class="flex flex-wrap gap-2">
                            ${['PCM', 'PCB'].map(path => {
                              const on = selectedStream === path;
                              return `<button class="q1-science-path ${on ? 'is-selected' : ''}" data-science-path="${path}" data-value="${path}" type="button" aria-pressed="${on}">${path}</button>`;
                            }).join('')}
                          </div>
                        </div>` : ''}
                    </div>`;
                }).join('')}
              </div>
            </div>
            <div class="q1-scrollbar-track" aria-hidden="true">
              <div class="q1-scrollbar-thumb" id="streamScrollbarThumb"></div>
            </div>
            <div class="q1-scroll-hint" id="streamScrollHint">
              <span class="material-symbols-outlined">south</span>
              <span>Scroll to explore all academic backgrounds</span>
            </div>
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-center justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 2</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">Which subjects do you currently feel strongest in?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Select all that apply.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">MULTI-SELECT</span>
          </div>
          <div class="flex flex-wrap gap-2" id="subjectPills">
            ${subjects.map(name => {
              const on = name === 'None specifically'
                ? strongSubjectsAnswered && answers.past.strong_subjects.length === 0
                : answers.past.strong_subjects.includes(name);
              return `<button class="key-subject-pill flex items-center gap-1.5 px-3 py-2 rounded-lg ${on ? 'bg-primary-container/20 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-outline hover:text-on-surface'} font-milestone-marker text-milestone-marker transition-all" data-value="${escapeHtml(name)}" type="button" aria-pressed="${on}">
                <span class="material-symbols-outlined text-xs">${on ? 'check' : 'add'}</span>${escapeHtml(name)}
              </button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-center justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 3</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">How would you describe your academic performance overall?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Choose the option that best describes you.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="performanceOptions">
            ${performanceOptions.map(([label, code]) => {
              const on = answers.past.academic_level === code;
              return `<button class="performance-option text-left px-4 py-3 rounded-lg ${on ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${code}" type="button" aria-pressed="${on}">
                <span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span>
              </button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-center justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 4</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">Have you already attempted or prepared for any entrance examinations?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Choose the exam(s) and current status. The saved profile uses the schema's <span class="font-semibold">name + status</span> structure.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">MULTI-SELECT + STATUS</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="font-label-code text-label-code text-outline uppercase tracking-wider mb-2">EXAMINATION</div>
              <div class="flex flex-wrap gap-2" id="entranceExamNames">
                ${entranceNames.map(([label, code]) => {
                  const on = entranceExamDraftNames.has(code);
                  return `<button class="entrance-name-option text-left px-4 py-3 rounded-lg ${on ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${code}" type="button" aria-pressed="${on}">
                    <span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span>
                  </button>`;
                }).join('')}
              </div>
            </div>
            <div>
              <div class="font-label-code text-label-code text-outline uppercase tracking-wider mb-2">CURRENT STATUS</div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="entranceStatuses">
                ${entranceStatuses.map(([label, code]) => {
                  const on = selectedStatus === code;
                  return `<button class="entrance-status-option text-left px-3 py-3 rounded-lg ${on ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${code}" type="button" aria-pressed="${on}">
                    <span class="font-body-sm text-body-sm font-medium">${escapeHtml(label)}</span>
                  </button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </section>
      </div>`;
  }

  function toggleChipClass(button, active) {
    button.classList.toggle('bg-primary-container/20', active);
    button.classList.toggle('text-primary', active);
    button.classList.toggle('bg-surface-container', !active);
    button.classList.toggle('text-outline', !active);
    const icon = button.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = active ? 'check' : 'add';
  }

  function renderStage2() {
    const interests = [
      ['Coding & Programming','coding'],
      ['Problem Solving','problem_solving'],
      ['Technology','technology'],
      ['Design & Creativity','design_creativity'],
      ['Business','business'],
      ['Research','research'],
      ['Writing & Communication','writing_communication'],
      ['Psychology & People','psychology_people'],
      ['Finance','finance'],
      ['Entrepreneurship','entrepreneurship']
    ];
    const workPreferences = [
      ['Building things','building_things'],
      ['Solving difficult problems','solving_difficult_problems'],
      ['Working with people','working_with_people'],
      ['Working independently','working_independently'],
      ['Creative work','creative_work'],
      ['Analyzing information','analyzing_information'],
      ['Leading projects','leading_projects'],
      ['Exploring how things work','exploring_how_things_work']
    ];
    const learningPreferences = [
      ['Learn by building or making things','learn_by_building'],
      ['Learn by practicing questions','learn_by_practice'],
      ['Learn through videos or demonstrations','learn_by_video'],
      ['Learn by reading and notes','learn_by_reading'],
      ['Learn with a teacher or mentor','learn_with_guidance'],
      ['A mix of different methods','mixed_learning']
    ];
    const currentActivities = [
      ['Coding / programming','coding'],
      ['Online courses','online_courses'],
      ['School or personal projects','projects'],
      ['Competitions / hackathons','competitions'],
      ['Content creation','content_creation'],
      ['Reading / self-study','reading_self_study'],
      ['Sports / fitness','sports_fitness'],
      ['Volunteering','volunteering'],
      ['Part-time work','part_time_work'],
      ['Nothing regularly yet','nothing_regularly']
    ];

    const renderMulti = (items, key, className, activeIcon = 'check') => items.map(([label, value]) => {
      const on = answers.present[key].includes(value);
      return `<button class="${className} px-3 py-2 rounded-lg ${on ? 'bg-primary-container/20 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-outline hover:text-on-surface'} font-milestone-marker text-milestone-marker transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${on}">
        <span class="material-symbols-outlined text-xs">${on ? activeIcon : 'add'}</span>${escapeHtml(label)}
      </button>`;
    }).join('');

    return `${stageHeader(stageMeta[2])}
      <div class="space-y-space-md">
        <section class="p-space-md rounded-xl bg-surface-container-low">
          <div class="flex items-center justify-between gap-3 mb-3"><div><div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 1</div><h2 class="font-headline-sm text-headline-sm text-on-surface">What naturally interests you?</h2><p class="font-body-sm text-body-sm text-outline">Select all areas you genuinely want to explore.</p></div><span class="font-label-code text-label-code text-secondary">MULTI-SELECT</span></div>
          <div class="flex flex-wrap gap-2" id="interestPills">${renderMulti(interests, 'interests', 'interest-pill')}</div>
        </section>

        <section class="p-space-md rounded-xl bg-surface-container-low">
          <div class="flex items-center justify-between gap-3 mb-3"><div><div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 2</div><h2 class="font-headline-sm text-headline-sm text-on-surface">What kind of work feels natural to you?</h2><p class="font-body-sm text-body-sm text-outline">Choose the ways you prefer to approach tasks.</p></div><span class="font-label-code text-label-code text-secondary">MULTI-SELECT</span></div>
          <div class="flex flex-wrap gap-2" id="workPreferencePills">${renderMulti(workPreferences, 'work_preferences', 'work-preference-pill')}</div>
        </section>

        <section class="p-space-md rounded-xl bg-surface-container-low">
          <div class="flex items-center justify-between gap-3 mb-3"><div><div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 3</div><h2 class="font-headline-sm text-headline-sm text-on-surface">How do you learn best right now?</h2><p class="font-body-sm text-body-sm text-outline">Choose the one approach that usually helps you learn.</p></div><span class="font-label-code text-label-code text-secondary">SINGLE-SELECT</span></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="learningPreferenceOptions">
            ${learningPreferences.map(([label, value]) => {
              const on = answers.present.learning_preference === value;
              return `<button class="learning-preference-option text-left px-4 py-3 rounded-lg ${on ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${on}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-md rounded-xl bg-surface-container-low">
          <div class="flex items-center justify-between gap-3 mb-3"><div><div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 4</div><h2 class="font-headline-sm text-headline-sm text-on-surface">What are you already doing outside regular classes?</h2><p class="font-body-sm text-body-sm text-outline">Select anything you currently spend time on.</p></div><span class="font-label-code text-label-code text-secondary">MULTI-SELECT</span></div>
          <div class="flex flex-wrap gap-2" id="currentActivityPills">${renderMulti(currentActivities, 'current_activities', 'current-activity-pill')}</div>
        </section>
      </div>`;
  }

  function renderStage3() {
    const collegeStatuses = [
      ['Still comparing options', 'still_comparing_options'],
      ['I have a shortlist', 'have_a_shortlist'],
      ['Application is in progress', 'application_in_progress'],
      ['Already decided / admitted', 'already_decided_or_admitted'],
      ['Not planning college yet', 'not_planning_college_yet']
    ];
    const budgetOptions = [
      ['Prefer low-cost options', 'prefer_low_cost_options'],
      ['Moderate budget / flexible', 'moderate_budget_flexible'],
      ['Budget not decided yet', 'budget_not_decided']
    ];
    const relocationOptions = [
      ['Anywhere in India', 'anywhere_in_india'],
      ['Within my home state', 'within_home_state'],
      ['Prefer to stay near home', 'stay_near_home'],
      ['Open to relocation', 'open_to_relocation'],
      ['Not decided yet', 'not_decided']
    ];
    const priorityOptions = [
      ['Strong technical skills', 'strong_technical_skills'],
      ['Early internships', 'early_internships'],
      ['Affordable education', 'affordable_education'],
      ['Campus experience', 'campus_experience'],
      ['Placement opportunities', 'placement_opportunities'],
      ['Flexible learning', 'flexible_learning'],
      ['Strong community', 'strong_community']
    ];
    const hoursOptions = [
      ['0–5 hours', '0_to_5'],
      ['5–10 hours', '5_to_10'],
      ['10–20 hours', '10_to_20'],
      ['20+ hours', '20_plus']
    ];
    const commitmentOptions = [
      ['JEE preparation', 'JEE_preparation'],
      ['NEET preparation', 'NEET_preparation'],
      ['Board preparation', 'board_preparation'],
      ['Other entrance preparation', 'entrance_exam_preparation_other'],
      ['School / coaching', 'school_or_coaching'],
      ['Projects / courses', 'projects_or_courses'],
      ['Part-time work', 'part_time_work'],
      ['Family responsibilities', 'family_responsibilities'],
      ['Nothing major right now', 'none_major']
    ];

    const s = answers.situation;

    const optionButton = (cls, value, label, selectedClass='bg-primary-container/15 text-primary ring-1 ring-primary/30', baseClass='bg-surface-container text-on-surface-variant hover:bg-surface-container-high') => `
      <button class="${cls} text-left px-4 py-3 rounded-lg ${String(value) === String(s.college_status || s.budget_preference || s.relocation || s.time_availability.hours_per_week || s.time_availability.major_current_commitment) ? selectedClass : baseClass} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="false">
        <span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span>
      </button>`;

    return `${stageHeader(stageMeta[3])}
      <div class="space-y-space-md">
        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 1</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">Where do you currently stand with college?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Tell us your current application / decision status.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="collegeStatusOptions">
            ${collegeStatuses.map(([label, value]) => {
              const selected = s.college_status === value;
              return `<button class="college-status-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 2</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What kind of budget are you working with?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">This helps us keep future route suggestions practical.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="budgetOptions">
            ${budgetOptions.map(([label, value]) => {
              const selected = s.budget_preference === value;
              return `<button class="budget-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-secondary-container/20 text-secondary ring-1 ring-secondary/40' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 3</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">How flexible are you about relocation?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Choose the option that best matches your present situation.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="relocationOptions">
            ${relocationOptions.map(([label, value]) => {
              const selected = s.relocation === value;
              return `<button class="relocation-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-tertiary-container/20 text-tertiary ring-1 ring-tertiary/40' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 4</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What matters most for your next step?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Select all priorities that matter to you right now.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">MULTI-SELECT</span>
          </div>
          <div class="flex flex-wrap gap-2" id="priorityOptions">
            ${priorityOptions.map(([label, value]) => {
              const selected = s.priorities.includes(value);
              return `<button class="priority-option flex items-center gap-1.5 px-3 py-2 rounded-lg ${selected ? 'bg-primary-container/20 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-outline hover:text-on-surface'} font-milestone-marker text-milestone-marker transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="material-symbols-outlined text-xs">${selected ? 'check' : 'add'}</span>${escapeHtml(label)}</button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 5</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">How much time can you realistically give to career preparation?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">First choose weekly hours, then tell us what currently takes most of your time.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">TIME AVAILABILITY</span>
          </div>

          <div class="mb-5">
            <div class="font-label-code text-label-code text-outline uppercase tracking-wider mb-2">HOURS PER WEEK</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="hoursOptions">
              ${hoursOptions.map(([label, value]) => {
                const selected = s.time_availability.hours_per_week === value;
                return `<button class="hours-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
              }).join('')}
            </div>
          </div>

          <div>
            <div class="font-label-code text-label-code text-outline uppercase tracking-wider mb-2">MAJOR CURRENT COMMITMENT</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="commitmentOptions">
              ${commitmentOptions.map(([label, value]) => {
                const selected = s.time_availability.major_current_commitment === value;
                return `<button class="commitment-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-secondary-container/20 text-secondary ring-1 ring-secondary/40' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${escapeHtml(value)}" type="button" aria-pressed="${selected}"><span class="font-body-md text-body-md font-medium">${escapeHtml(label)}</span></button>`;
              }).join('')}
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderStage4() {
    const careerOptions = [
      ['AI Engineer','smart_toy'],
      ['Software Engineer','code'],
      ['Data Scientist','analytics'],
      ['Product Manager','rocket_launch'],
      ['Designer','brush'],
      ['Researcher','science'],
      ['Entrepreneur','storefront'],
      ['Finance / Quant','monitoring'],
      ['Not sure yet','explore']
    ];
    const certaintyOptions = [
      ['Very certain','very_certain','I already have a clear target.'],
      ['Fairly certain','fairly_certain','I have a direction, but I am open to learning more.'],
      ['Exploring','exploring','I have a few directions in mind.'],
      ['Not sure','not_sure','I need help discovering a direction.']
    ];
    const motivationOptions = [
      ['Technology','technology'],
      ['Problem solving','problem_solving'],
      ['Creativity','creativity'],
      ['Helping people','helping_people'],
      ['Job opportunities','job_opportunities'],
      ['Financial growth','financial_growth'],
      ['Entrepreneurship','entrepreneurship'],
      ['Research & discovery','research_discovery']
    ];
    const successOptions = [
      ['Strong first job','strong_first_job'],
      ['Becoming highly skilled','becoming_highly_skilled'],
      ['Financial independence','financial_independence'],
      ['Meaningful work','meaningful_work'],
      ['Leadership','leadership'],
      ['Flexibility','flexibility'],
      ['Building useful things','building_useful_things'],
      ['Higher studies / research','higher_studies_research']
    ];

    return `${stageHeader(stageMeta[4])}
      <div class="space-y-space-lg">
        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 1</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What career direction interests you?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Pick the destination you are currently considering. You can still change it later.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-space-md" id="careerGoalOptions">
            ${careerOptions.map(([label,icon],i)=>{
              const selected = answers.goal.career === label;
              return `<button class="career-goal-card p-space-md rounded-xl text-left ${selected ? 'bg-primary-container/20 ring-1 ring-primary/40' : 'bg-surface-container hover:bg-surface-container-high'} transition-all" data-career="${escapeHtml(label)}" type="button" aria-pressed="${selected}">
                <div class="flex items-center justify-between">
                  <span class="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center ${selected ? 'text-primary' : 'text-outline'}"><span class="material-symbols-outlined text-lg">${icon}</span></span>
                  <span class="font-label-code text-label-code text-outline">0${i+1}</span>
                </div>
                <p class="font-headline-sm text-headline-sm text-on-surface mt-3">${escapeHtml(label)}</p>
              </button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 2</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">How certain are you about this direction?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">This separates a fixed target from a direction you are still exploring.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">SINGLE-SELECT</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mt-space-md" id="goalCertaintyOptions">
            ${certaintyOptions.map(([label,value,desc])=>{
              const selected = answers.goal.certainty === value;
              return `<button class="goal-certainty-option text-left p-space-md rounded-xl ${selected ? 'bg-secondary-container/20 text-secondary ring-1 ring-secondary/40' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-value="${value}" type="button" aria-pressed="${selected}"><p class="font-headline-sm text-headline-sm ${selected ? 'text-secondary' : 'text-on-surface'}">${escapeHtml(label)}</p><p class="font-body-sm text-body-sm mt-1 text-outline">${escapeHtml(desc)}</p></button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 3</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What motivates this goal?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Select all that genuinely matter to you right now.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">MULTI-SELECT</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-space-md" id="motivationOptions">
            ${motivationOptions.map(([label,value])=>{
              const selected = answers.goal.motivations.includes(value);
              return `<button class="goal-motivation-option flex items-center gap-1.5 px-3 py-2 rounded-lg ${selected ? 'bg-primary-container/20 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-outline hover:text-on-surface'} font-milestone-marker text-milestone-marker transition-all" data-value="${value}" type="button" aria-pressed="${selected}"><span class="material-symbols-outlined text-xs">${selected ? 'check' : 'add'} </span>${escapeHtml(label)}</button>`;
            }).join('')}
          </div>
        </section>

        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 4</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">What does success look like to you?</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">Choose the outcomes you want your career journey to build toward.</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">MULTI-SELECT</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-space-md" id="successDefinitionOptions">
            ${successOptions.map(([label,value])=>{
              const selected = answers.goal.success_definition.includes(value);
              return `<button class="goal-success-option flex items-center gap-1.5 px-3 py-2 rounded-lg ${selected ? 'bg-tertiary-container/20 text-tertiary ring-1 ring-tertiary/30' : 'bg-surface-container text-outline hover:text-on-surface'} font-milestone-marker text-milestone-marker transition-all" data-value="${value}" type="button" aria-pressed="${selected}"><span class="material-symbols-outlined text-xs">${selected ? 'check' : 'add'} </span>${escapeHtml(label)}</button>`;
            }).join('')}
          </div>
        </section>
      </div>`;
  }

  function renderStage5() {
    const profile = getDiagnosticState();
    const target = profile.goal?.career && profile.goal.career !== 'Not sure yet' ? profile.goal.career : 'Career Explorer';

    if (form5Loading) {
      return `${stageHeader(stageMeta[5])}
        <div class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-center gap-3 text-primary">
            <span class="material-symbols-outlined animate-spin">autorenew</span>
            <div>
              <p class="font-headline-sm text-headline-sm text-on-surface font-semibold">Calibrating questions for ${escapeHtml(target)}</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Meet 2 is mapping your goal to age-appropriate foundational skills.</p>
            </div>
          </div>
        </div>`;
    }

    if (form5Error) {
      return `${stageHeader(stageMeta[5])}
        <div class="p-space-lg rounded-xl bg-surface-container-low shadow-lg border border-error/30">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-error">error</span>
            <div class="flex-1">
              <p class="font-headline-sm text-headline-sm text-on-surface font-semibold">We could not generate your questions yet.</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${escapeHtml(form5Error)}</p>
              <button id="retryForm5Btn" type="button" class="mt-4 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold">Try Again</button>
            </div>
          </div>
        </div>`;
    }

    if (!form5Questions.length) {
      return `${stageHeader(stageMeta[5])}<div class="p-space-lg rounded-xl bg-surface-container-low text-on-surface-variant">No dynamic questions are available yet.</div>`;
    }

    const questionCards = form5Questions.map((q, index) => {
      const current = answers.skills[q.skill_id];
      const isScale = q.response_type === 'scale_1_5';
      return `
        <section class="p-space-lg rounded-xl bg-surface-container-low shadow-lg">
          <div class="flex items-start justify-between gap-3 mb-space-md">
            <div>
              <div class="font-label-code text-label-code text-primary uppercase tracking-wider mb-1">QUESTION 0${index + 1}</div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-semibold">${escapeHtml(q.question)}</h2>
              <p class="font-body-md text-body-md text-on-surface-variant mt-1">${escapeHtml(q.helper_text)}</p>
            </div>
            <span class="font-label-code text-label-code text-secondary shrink-0">${escapeHtml(q.skill_label)}</span>
          </div>
          ${isScale ? `
            <div class="grid grid-cols-5 gap-2" role="radiogroup" aria-label="${escapeHtml(q.question)}">
              ${q.options.map(option => {
                const selected = Number(current) === Number(option.score);
                return `<button class="form5-option h-11 rounded-lg ${selected ? 'bg-primary text-on-primary shadow-[0_0_18px_rgba(56,189,248,.28)]' : 'bg-surface-container text-outline hover:bg-surface-container-high'} transition-all font-label-code text-label-code" data-form5-q="${escapeHtml(q.id)}" data-skill-id="${escapeHtml(q.skill_id)}" data-score="${option.score}" data-value="${escapeHtml(option.value)}" type="button" aria-pressed="${selected}">${escapeHtml(option.label)}</button>`;
              }).join('')}
            </div>` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="${escapeHtml(q.question)}">
              ${q.options.map(option => {
                const selected = String(current ?? '') === String(option.value);
                return `<button class="form5-option text-left px-4 py-3 rounded-lg ${selected ? 'bg-primary-container/15 text-primary ring-1 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'} transition-all" data-form5-q="${escapeHtml(q.id)}" data-skill-id="${escapeHtml(q.skill_id)}" data-score="${option.score}" data-value="${escapeHtml(option.value)}" type="button" aria-pressed="${selected}">
                  <span class="font-body-md text-body-md font-medium">${escapeHtml(option.label)}</span>
                </button>`;
              }).join('')}
            </div>`}
          <div class="mt-3 flex items-center justify-between">
            <span class="font-label-code text-label-code text-outline">FOUNDATION SIGNAL // ${escapeHtml(q.signal)}</span>
            <span class="font-label-code text-label-code text-primary" data-form5-value="${escapeHtml(q.skill_id)}">${current ? `Score ${escapeHtml(current)}/5` : 'Not answered'}</span>
          </div>
        </section>`;
    }).join('');

    return `${stageHeader(stageMeta[5])}
      <div class="mb-2 p-3 rounded-lg bg-primary-container/10 border border-primary/20">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-sm">auto_awesome</span>
          <p class="font-body-sm text-body-sm text-on-surface"><span class="font-semibold text-primary">Dynamic calibration:</span> These ${form5Questions.length} questions were selected for <span class="font-semibold">${escapeHtml(target)}</span> from your previous answers.</p>
        </div>
      </div>
      <div class="space-y-space-md">${questionCards}</div>`;
  }

  function buildForm5Context(profile) {
    if (!rootMeet2Context()) throw new Error('Form 5 context builder is not loaded.');
    return window.Meet2Form5Context.buildContext(profile);
  }

  function rootMeet2Context() {
    return window.Meet2Form5Context && typeof window.Meet2Form5Context.buildContext === 'function';
  }

  function resetDynamicForm5() {
    form5Questions = [];
    form5ContextKey = '';
    form5Loading = false;
    form5Error = '';
    answers.skills = {};
    answers.skillResponses = {};
  }

  function form5ContextSignature(context) {
    return JSON.stringify({
      role: context.role,
      student_stage: context.student_stage,
      skill_dimensions: context.skill_dimensions?.map(d => ({ id: d.id, importance: d.importance })) || []
    });
  }

  function normalizeForm5ResponseTypes(response) {
    const responseBySignal = {
      experience: 'single_select',
      confidence: 'scale_1_5',
      scenario: 'scenario_single_select',
      interest: 'single_select',
      behavior: 'scenario_single_select'
    };
    if (response && Array.isArray(response.questions)) {
      response.questions.forEach(q => {
        if (q && responseBySignal[q.signal]) {
          q.response_type = responseBySignal[q.signal];
        }
      });
    }
    return response;
  }

  function validateForm5Response(response, context) {
    if (!window.Meet2QuestionQualityGuard?.assertValid) {
      throw new Error('Form 5 quality guard is not loaded.');
    }
    const normalized = normalizeForm5ResponseTypes(response);
    window.Meet2QuestionQualityGuard.assertValid(normalized, context, 5);
    return normalized;
  }

  async function loadDynamicForm5(force = false) {
    if (currentStage !== 5 || form5Loading) return;
    const profile = getDiagnosticState();
    const context = buildForm5Context(profile);
    const signature = form5ContextSignature(context);
    if (!force && form5Questions.length && signature === form5ContextKey) return;

    form5Loading = true;
    form5Error = '';
    form5Questions = [];
    answers.skills = {};
    answers.skillResponses = {};
    form5ContextKey = signature;
    renderCurrentStage();
    aiLiveText.innerHTML = `<span class="text-primary font-semibold">Generating ${escapeHtml(context.role.display_name)} questions</span> from ${context.skill_dimensions.length} mapped foundational skill dimensions...`;

    try {
      const response = await window.Meet2API.generateForm5(context);
      const normalizedResponse = validateForm5Response(response, context);
      form5Questions = normalizedResponse.questions;
      form5Loading = false;
      if (normalizedResponse.source === 'local_fallback') {
        const reason = normalizedResponse.fallback_reason ? escapeHtml(normalizedResponse.fallback_reason).slice(0, 180) : 'Gemini was unavailable.';
        aiLiveText.innerHTML = `<span class="text-primary font-semibold">Dynamic calibration ready via local fallback.</span> ${form5Questions.length} goal-aware questions generated. <span class="text-outline">Reason: ${reason}</span>`;
      } else if (normalizedResponse.source === 'gemini') {
        const model = escapeHtml(normalizedResponse.model || 'Gemini');
        aiLiveText.innerHTML = `<span class="text-tertiary font-semibold">Live Gemini synthesis.</span> ${form5Questions.length} questions generated for ${escapeHtml(context.role.display_name)} <span class="text-outline">• model: ${model}</span>`;
      } else {
        aiLiveText.innerHTML = `<span class="text-tertiary font-semibold">Dynamic calibration ready.</span> ${form5Questions.length} questions generated for ${escapeHtml(context.role.display_name)}.`;
      }
      console.log('MEET2_FORM5_CONTEXT', context);
      console.log('MEET2_FORM5_QUESTIONS', normalizedResponse);
      renderCurrentStage();
    } catch (error) {
      console.error('Dynamic Form 5 generation failed:', error);
      form5Loading = false;
      form5Error = error?.message || 'Unknown generation error.';
      renderCurrentStage();
    }
  }

  function renderCurrentStage() {
    const renderers = [null, renderStage1, renderStage2, renderStage3, renderStage4, renderStage5];
    stepContent.innerHTML = renderers[currentStage]();
    attachStageHandlers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStageNavigation() {
    const titles = ['Past','Present','Situation','Goal','Skills'];

    navPills.forEach((pill, idx) => {
      const pillStage = idx + 1;
      const isCurrent = pillStage === currentStage;
      const isCompleted = completedStages.has(pillStage);
      const isReachable = pillStage <= maxReachedStage;
      const title = titles[pillStage - 1];

      pill.disabled = !isReachable;
      pill.setAttribute('aria-current', isCurrent ? 'step' : 'false');
      pill.setAttribute('aria-disabled', String(!isReachable));

      if (isCurrent) {
        pill.className = 'stage-nav-pill flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-milestone-marker text-milestone-marker tracking-widest uppercase transition-all shadow-[0_0_16px_rgba(56,189,248,0.35)] shrink-0';
        pill.innerHTML = `<span class="material-symbols-outlined text-xs">radio_button_checked</span> 0${pillStage} ${title}`;
      } else if (isCompleted) {
        pill.className = 'stage-nav-pill flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-tertiary font-milestone-marker text-milestone-marker tracking-widest uppercase transition-all shrink-0 hover:bg-surface-container-highest';
        pill.innerHTML = `<span class="material-symbols-outlined text-xs">check_circle</span> 0${pillStage} ${title}`;
      } else if (isReachable) {
        pill.className = 'stage-nav-pill flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-outline hover:text-on-surface hover:bg-surface-container-high font-milestone-marker text-milestone-marker tracking-widest uppercase transition-all shrink-0';
        pill.innerHTML = `<span class="material-symbols-outlined text-xs">adjust</span> 0${pillStage} ${title}`;
      } else {
        pill.className = 'stage-nav-pill flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-outline/50 font-milestone-marker text-milestone-marker tracking-widest uppercase transition-all shrink-0 cursor-not-allowed';
        pill.innerHTML = `<span class="material-symbols-outlined text-xs">lock</span> 0${pillStage} ${title}`;
      }
    });
  }

  function refreshNextButton() {
    const meta = stageMeta[currentStage];
    nextBtnLabel.textContent = meta.nextLabel;
    nextBtn.disabled = currentStage === maxStages && diagnosticComplete;
    nextBtn.classList.toggle('opacity-60', diagnosticComplete);
    nextBtn.classList.toggle('cursor-not-allowed', diagnosticComplete);
  }

  function updateStageUI(stage) {
    currentStage = stage;
    const progressPercent = (currentStage / maxStages) * 100;
    progressBar.style.width = progressPercent + '%';
    stageIndicator.innerHTML = '0' + currentStage + ' <span class="text-outline">/ 05</span>';

    updateStageNavigation();

    const meta = stageMeta[currentStage];
    aiLiveText.innerHTML = meta.aiNote;
    backBtn.disabled = currentStage === 1;
    refreshNextButton();
    renderCurrentStage();
    if (currentStage === 5) {
      loadDynamicForm5();
    }
  }

  function invalidateFrom(stage) {
    clearValidationError();
    for (const completedStage of [...completedStages]) {
      if (completedStage >= stage) completedStages.delete(completedStage);
    }

    maxReachedStage = Math.max(1, Math.min(maxReachedStage, stage));
    if (stage <= 5) diagnosticComplete = false;
    if (stage <= 4) resetDynamicForm5();

    updateStageNavigation();
    refreshNextButton();
  }

  function addToggleHandlers(selector, collectionKey, activeClasses='primary') {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        const current = answers.present[collectionKey];
        const index = current.indexOf(value);
        if (index >= 0) current.splice(index,1);
        else current.push(value);
        invalidateFrom(2);
        const active = current.includes(value);
        toggleChipClass(button, active);
      });
    });
  }

  function attachStageHandlers() {
    // Stage 1 — Past academic foundation (P3 MVP schema)
    function syncStage1StreamSelector() {
      const selectedStream = answers.past.stream;
      const scienceActive = scienceCardOpen || selectedStream === 'PCM' || selectedStream === 'PCB';

      document.querySelectorAll('.q1-stream-card').forEach(card => {
        const family = card.dataset.streamCard;
        const selected = family === 'PCM' ? scienceActive : selectedStream === family;
        card.classList.toggle('is-selected', selected);
        card.setAttribute('aria-pressed', String(selected));

        const icon = card.querySelector('.q1-stream-icon');
        icon?.classList.toggle('is-selected', selected);

        const subtitle = card.querySelector('.q1-stream-subtitle');
        if (subtitle && family === 'PCM') subtitle.classList.toggle('text-primary', selected);

        const check = card.querySelector('.q1-stream-check');
        if (check) {
          const showCheck = family === 'PCM' ? Boolean(selectedStream) : selected;
          check.classList.toggle('hidden', !showCheck);
        }
      });

      const subselect = document.querySelector('.q1-science-subselect');
      subselect?.classList.toggle('hidden', !scienceActive);

      document.querySelectorAll('.q1-science-path').forEach(button => {
        const on = button.dataset.sciencePath === selectedStream;
        button.classList.toggle('is-selected', on);
        button.setAttribute('aria-pressed', String(on));
      });
    }

    document.querySelectorAll('.q1-stream-card').forEach(card => {
      card.addEventListener('click', (event) => {
        event.preventDefault();
        const family = card.dataset.streamCard;
        invalidateFrom(1);
        if (family === 'PCM') {
          // Open the science pathway chooser without rebuilding the DOM.
          scienceCardOpen = true;
        } else {
          scienceCardOpen = false;
          answers.past.stream = family;
        }
        syncStage1StreamSelector();
      });
    });

    document.querySelectorAll('.q1-science-path').forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        answers.past.stream = button.dataset.sciencePath;
        scienceCardOpen = true;
        invalidateFrom(1);
        syncStage1StreamSelector();
      });
    });

    const streamViewport = document.getElementById('streamViewport');
    const streamThumb = document.getElementById('streamScrollbarThumb');
    const streamHint = document.getElementById('streamScrollHint');

    function updateStreamScrollUI() {
      if (!streamViewport || !streamThumb) return;
      const maxScroll = Math.max(1, streamViewport.scrollHeight - streamViewport.clientHeight);
      const trackHeight = streamViewport.clientHeight;
      const thumbHeight = Math.max(30, Math.round(trackHeight * (streamViewport.clientHeight / streamViewport.scrollHeight)));
      const travel = Math.max(0, trackHeight - thumbHeight);
      const ratio = Math.min(1, Math.max(0, streamViewport.scrollTop / maxScroll));
      streamThumb.style.height = thumbHeight + 'px';
      streamThumb.style.transform = `translateY(${Math.round(travel * ratio)}px)`;
      streamHint?.classList.toggle('is-hidden', ratio > 0.95);
    }

    streamViewport?.addEventListener('scroll', updateStreamScrollUI, { passive: true });
    streamViewport?.addEventListener('wheel', () => streamHint?.classList.add('is-hidden'), { passive: true });
    window.requestAnimationFrame(updateStreamScrollUI);

    document.querySelectorAll('.key-subject-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const value = pill.dataset.value;
        strongSubjectsAnswered = true;
        if (value === 'None specifically') {
          answers.past.strong_subjects = [];
        } else {
          if (answers.past.strong_subjects.includes(value)) {
            answers.past.strong_subjects = answers.past.strong_subjects.filter(item => item !== value);
          } else {
            answers.past.strong_subjects = [...answers.past.strong_subjects, value];
          }
        }
        invalidateFrom(1);
        document.querySelectorAll('.key-subject-pill').forEach(btn => {
          const btnValue = btn.dataset.value;
          const on = btnValue === 'None specifically'
            ? strongSubjectsAnswered && answers.past.strong_subjects.length === 0
            : answers.past.strong_subjects.includes(btnValue);
          btn.classList.toggle('bg-primary-container/20', on);
          btn.classList.toggle('text-primary', on);
          btn.classList.toggle('ring-1', on);
          btn.classList.toggle('ring-primary/30', on);
          btn.classList.toggle('bg-surface-container', !on);
          btn.classList.toggle('text-outline', !on);
          btn.setAttribute('aria-pressed', String(on));
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = on ? 'check' : 'add';
        });
      });
    });

    document.querySelectorAll('.performance-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.past.academic_level = button.dataset.value;
        invalidateFrom(1);
        document.querySelectorAll('.performance-option').forEach(btn => {
          const on = btn.dataset.value === answers.past.academic_level;
          btn.classList.toggle('bg-primary-container/15', on);
          btn.classList.toggle('text-primary', on);
          btn.classList.toggle('ring-1', on);
          btn.classList.toggle('ring-primary/30', on);
          btn.classList.toggle('bg-surface-container', !on);
          btn.classList.toggle('text-on-surface-variant', !on);
          btn.setAttribute('aria-pressed', String(on));
        });
      });
    });

    document.querySelectorAll('.entrance-name-option').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        if (entranceExamDraftNames.has(value)) entranceExamDraftNames.delete(value);
        else entranceExamDraftNames.add(value);
        invalidateFrom(1);
        document.querySelectorAll('.entrance-name-option').forEach(btn => {
          const on = entranceExamDraftNames.has(btn.dataset.value);
          btn.classList.toggle('bg-primary-container/15', on);
          btn.classList.toggle('text-primary', on);
          btn.classList.toggle('ring-1', on);
          btn.classList.toggle('ring-primary/30', on);
          btn.classList.toggle('bg-surface-container', !on);
          btn.classList.toggle('text-on-surface-variant', !on);
          btn.setAttribute('aria-pressed', String(on));
        });
        if (entranceStatusDraft) {
          const status = entranceStatusDraft;
          if (status === 'preparing' || status === 'attempted') {
            answers.past.entrance_exam_status = [...entranceExamDraftNames].map(name => ({ name, status }));
          }
        }
      });
    });

    document.querySelectorAll('.entrance-status-option').forEach(button => {
      button.addEventListener('click', () => {
        entranceStatusDraft = button.dataset.value;
        invalidateFrom(1);
        if (entranceStatusDraft === 'preparing' || entranceStatusDraft === 'attempted') {
          answers.past.entrance_exam_status = [...entranceExamDraftNames].map(name => ({
            name,
            status: entranceStatusDraft
          }));
        } else {
          answers.past.entrance_exam_status = [];
          entranceExamDraftNames = new Set();
        }
        document.querySelectorAll('.entrance-status-option').forEach(btn => {
          const on = btn.dataset.value === entranceStatusDraft;
          btn.classList.toggle('bg-primary-container/15', on);
          btn.classList.toggle('text-primary', on);
          btn.classList.toggle('ring-1', on);
          btn.classList.toggle('ring-primary/30', on);
          btn.classList.toggle('bg-surface-container', !on);
          btn.classList.toggle('text-on-surface-variant', !on);
          btn.setAttribute('aria-pressed', String(on));
        });
        document.querySelectorAll('.entrance-name-option').forEach(btn => {
          const on = entranceExamDraftNames.has(btn.dataset.value);
          btn.classList.toggle('bg-primary-container/15', on);
          btn.classList.toggle('text-primary', on);
          btn.classList.toggle('ring-1', on);
          btn.classList.toggle('ring-primary/30', on);
          btn.classList.toggle('bg-surface-container', !on);
          btn.classList.toggle('text-on-surface-variant', !on);
          btn.setAttribute('aria-pressed', String(on));
        });
      });
    });

    // Stage 2 — Present (P3 MVP schema)
    if (currentStage === 2) {
      addToggleHandlers('.interest-pill', 'interests');
      addToggleHandlers('.work-preference-pill', 'work_preferences');
      addToggleHandlers('.current-activity-pill', 'current_activities');

      document.querySelectorAll('.learning-preference-option').forEach(button => {
        button.addEventListener('click', () => {
          answers.present.learning_preference = button.dataset.value;
          invalidateFrom(2);
          document.querySelectorAll('.learning-preference-option').forEach(btn => {
            const selected = btn.dataset.value === answers.present.learning_preference;
            btn.classList.toggle('bg-primary-container/15', selected);
            btn.classList.toggle('text-primary', selected);
            btn.classList.toggle('ring-1', selected);
            btn.classList.toggle('ring-primary/30', selected);
            btn.classList.toggle('bg-surface-container', !selected);
            btn.classList.toggle('text-on-surface-variant', !selected);
            btn.setAttribute('aria-pressed', String(selected));
          });
        });
      });
    }

    // Stage 3 — Current situation (P3 MVP schema)
    document.querySelectorAll('.college-status-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.situation.college_status = button.dataset.value;
        invalidateFrom(3);
        document.querySelectorAll('.college-status-option').forEach(card => {
          const selected = card.dataset.value === answers.situation.college_status;
          card.classList.toggle('bg-primary-container/15', selected);
          card.classList.toggle('text-primary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-primary/30', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    document.querySelectorAll('.budget-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.situation.budget_preference = button.dataset.value;
        invalidateFrom(3);
        document.querySelectorAll('.budget-option').forEach(card => {
          const selected = card.dataset.value === answers.situation.budget_preference;
          card.classList.toggle('bg-secondary-container/20', selected);
          card.classList.toggle('text-secondary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-secondary/40', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    document.querySelectorAll('.relocation-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.situation.relocation = button.dataset.value;
        invalidateFrom(3);
        document.querySelectorAll('.relocation-option').forEach(card => {
          const selected = card.dataset.value === answers.situation.relocation;
          card.classList.toggle('bg-tertiary-container/20', selected);
          card.classList.toggle('text-tertiary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-tertiary/40', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    document.querySelectorAll('.priority-option').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        const index = answers.situation.priorities.indexOf(value);
        if (index >= 0) answers.situation.priorities.splice(index, 1);
        else answers.situation.priorities.push(value);
        invalidateFrom(3);
        document.querySelectorAll('.priority-option').forEach(chip => {
          const selected = answers.situation.priorities.includes(chip.dataset.value);
          chip.classList.toggle('bg-primary-container/20', selected);
          chip.classList.toggle('text-primary', selected);
          chip.classList.toggle('ring-1', selected);
          chip.classList.toggle('ring-primary/30', selected);
          chip.classList.toggle('bg-surface-container', !selected);
          chip.classList.toggle('text-outline', !selected);
          chip.setAttribute('aria-pressed', String(selected));
          const icon = chip.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = selected ? 'check' : 'add';
        });
      });
    });

    document.querySelectorAll('.hours-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.situation.time_availability.hours_per_week = button.dataset.value;
        invalidateFrom(3);
        document.querySelectorAll('.hours-option').forEach(card => {
          const selected = card.dataset.value === answers.situation.time_availability.hours_per_week;
          card.classList.toggle('bg-primary-container/15', selected);
          card.classList.toggle('text-primary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-primary/30', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    document.querySelectorAll('.commitment-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.situation.time_availability.major_current_commitment = button.dataset.value;
        invalidateFrom(3);
        document.querySelectorAll('.commitment-option').forEach(card => {
          const selected = card.dataset.value === answers.situation.time_availability.major_current_commitment;
          card.classList.toggle('bg-secondary-container/20', selected);
          card.classList.toggle('text-secondary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-secondary/40', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
        });
      });
    });

    // Stage 4 — Goal schema fields: career, certainty, motivations, success_definition
    document.querySelectorAll('.career-goal-card').forEach(button => {
      button.addEventListener('click', () => {
        answers.goal.career = button.dataset.career;
        invalidateFrom(4);
        document.querySelectorAll('.career-goal-card').forEach(card => {
          const selected = card.dataset.career === answers.goal.career;
          card.classList.toggle('bg-primary-container/20', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-primary/40', selected);
          card.setAttribute('aria-pressed', String(selected));
          const icon = card.querySelector('.material-symbols-outlined');
          icon?.classList.toggle('text-primary', selected);
          icon?.classList.toggle('text-outline', !selected);
        });
      });
    });

    document.querySelectorAll('.goal-certainty-option').forEach(button => {
      button.addEventListener('click', () => {
        answers.goal.certainty = button.dataset.value;
        invalidateFrom(4);
        document.querySelectorAll('.goal-certainty-option').forEach(card => {
          const selected = card.dataset.value === answers.goal.certainty;
          card.classList.toggle('bg-secondary-container/20', selected);
          card.classList.toggle('text-secondary', selected);
          card.classList.toggle('ring-1', selected);
          card.classList.toggle('ring-secondary/40', selected);
          card.classList.toggle('bg-surface-container', !selected);
          card.classList.toggle('text-on-surface-variant', !selected);
          card.setAttribute('aria-pressed', String(selected));
          const title = card.querySelector('.font-headline-sm');
          title?.classList.toggle('text-secondary', selected);
          title?.classList.toggle('text-on-surface', !selected);
        });
      });
    });

    document.querySelectorAll('.goal-motivation-option').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        const index = answers.goal.motivations.indexOf(value);
        if (index >= 0) answers.goal.motivations.splice(index, 1);
        else answers.goal.motivations.push(value);
        invalidateFrom(4);
        const selected = answers.goal.motivations.includes(value);
        button.classList.toggle('bg-primary-container/20', selected);
        button.classList.toggle('text-primary', selected);
        button.classList.toggle('ring-1', selected);
        button.classList.toggle('ring-primary/30', selected);
        button.classList.toggle('bg-surface-container', !selected);
        button.classList.toggle('text-outline', !selected);
        button.setAttribute('aria-pressed', String(selected));
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = selected ? 'check' : 'add';
      });
    });

    document.querySelectorAll('.goal-success-option').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        const index = answers.goal.success_definition.indexOf(value);
        if (index >= 0) answers.goal.success_definition.splice(index, 1);
        else answers.goal.success_definition.push(value);
        invalidateFrom(4);
        const selected = answers.goal.success_definition.includes(value);
        button.classList.toggle('bg-tertiary-container/20', selected);
        button.classList.toggle('text-tertiary', selected);
        button.classList.toggle('ring-1', selected);
        button.classList.toggle('ring-tertiary/30', selected);
        button.classList.toggle('bg-surface-container', !selected);
        button.classList.toggle('text-outline', !selected);
        button.setAttribute('aria-pressed', String(selected));
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = selected ? 'check' : 'add';
      });
    });

    // Stage 5 — dynamic Form 5 responses
    if (currentStage === 5) {
      document.querySelectorAll('.form5-option').forEach(button => {
        button.addEventListener('click', () => {
          const questionId = button.dataset.form5Q;
          const skillId = button.dataset.skillId;
          const score = Number(button.dataset.score);
          const value = button.dataset.value;
          answers.skills[skillId] = score;
          answers.skillResponses[questionId] = { value, score };
          clearValidationError();

          const questionButtons = document.querySelectorAll(`.form5-option[data-form5-q="${CSS.escape(questionId)}"]`);
          questionButtons.forEach(btn => {
            const selected = btn === button;
            const isScale = form5Questions.find(q => q.id === questionId)?.response_type === 'scale_1_5';
            if (isScale) {
              btn.classList.toggle('bg-primary', selected);
              btn.classList.toggle('text-on-primary', selected);
              btn.classList.toggle('bg-surface-container', !selected);
              btn.classList.toggle('text-outline', !selected);
            } else {
              btn.classList.toggle('bg-primary-container/15', selected);
              btn.classList.toggle('text-primary', selected);
              btn.classList.toggle('ring-1', selected);
              btn.classList.toggle('ring-primary/30', selected);
              btn.classList.toggle('bg-surface-container', !selected);
              btn.classList.toggle('text-on-surface-variant', !selected);
            }
            btn.setAttribute('aria-pressed', String(selected));
          });

          const valueLabel = document.querySelector(`[data-form5-value="${CSS.escape(skillId)}"]`);
          if (valueLabel) valueLabel.textContent = `Score ${score}/5`;
        });
      });

      document.getElementById('retryForm5Btn')?.addEventListener('click', () => loadDynamicForm5(true));
    }
  }

  function showValidationError(message) {
    const existing = document.getElementById('stageValidationError');
    existing?.remove();

    const error = document.createElement('div');
    error.id = 'stageValidationError';
    error.className = 'mt-space-md p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm flex items-start gap-2';
    error.innerHTML = `<span class="material-symbols-outlined text-base shrink-0">error</span><span>${escapeHtml(message)}</span>`;
    stepContent.appendChild(error);
    error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearValidationError() {
    document.getElementById('stageValidationError')?.remove();
  }

  function validateStage(stage) {
    clearValidationError();

    if (stage === 1) {
      if (!answers.past.stream) {
        showValidationError('Please select your academic stream. For Science, choose PCM or PCB.');
        return false;
      }
      if (!strongSubjectsAnswered) {
        showValidationError('Please select the subjects you feel strongest in, or choose “None specifically”.');
        return false;
      }
      if (!answers.past.academic_level) {
        showValidationError('Please describe your overall academic performance.');
        return false;
      }
      if (!entranceStatusDraft) {
        showValidationError('Please choose your current entrance-exam status.');
        return false;
      }
      if ((entranceStatusDraft === 'preparing' || entranceStatusDraft === 'attempted') && entranceExamDraftNames.size === 0) {
        showValidationError('Please select at least one entrance exam for the selected status.');
        return false;
      }
    }

    if (stage === 2) {
      if (answers.present.interests.length === 0) {
        showValidationError('Please select at least one current interest.');
        return false;
      }
    }

    if (stage === 3) {
      if (!answers.situation.college_status) {
        showValidationError('Please choose your current college status.');
        return false;
      }
      if (!answers.situation.budget_preference) {
        showValidationError('Please choose the budget option that best matches your current situation.');
        return false;
      }
      if (!answers.situation.relocation) {
        showValidationError('Please choose your current relocation preference.');
        return false;
      }
      if (answers.situation.priorities.length === 0) {
        showValidationError('Please select at least one priority for your next step.');
        return false;
      }
      if (!answers.situation.time_availability.hours_per_week || !answers.situation.time_availability.major_current_commitment) {
        showValidationError('Please complete both time-availability choices.');
        return false;
      }
    }

    if (stage === 4) {
      if (!answers.goal.career) {
        showValidationError('Please choose a career direction or select “Not sure yet”.');
        return false;
      }
      if (!answers.goal.certainty) {
        showValidationError('Please tell us how certain you are about your career direction.');
        return false;
      }
      if (answers.goal.motivations.length === 0) {
        showValidationError('Please select at least one motivation for your goal.');
        return false;
      }
      if (answers.goal.success_definition.length === 0) {
        showValidationError('Please select at least one outcome that defines success for you.');
        return false;
      }
    }

    if (stage === 5) {
      if (!form5Questions.length) {
        showValidationError('Your goal-specific questions are still being prepared. Please wait a moment and try again.');
        return false;
      }
      const unanswered = form5Questions.filter(q => answers.skills[q.skill_id] == null);
      if (unanswered.length > 0) {
        showValidationError(`Please answer all ${unanswered.length} remaining question${unanswered.length === 1 ? '' : 's'} before completing the diagnostic.`);
        return false;
      }
    }

    return true;
  }

  navPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetStage = Number(pill.dataset.stage);
      const canNavigate = targetStage <= maxReachedStage;
      if (!canNavigate) return;

      clearValidationError();
      updateStageUI(targetStage);
    });
  });

  nextBtn.addEventListener('click', async () => {
    if (diagnosticComplete) return;
    if (!validateStage(currentStage)) return;

    clearValidationError();
    completedStages.add(currentStage);

    if (currentStage < maxStages) {
      maxReachedStage = Math.max(maxReachedStage, currentStage + 1);
      updateStageUI(currentStage + 1);
    } else {
      maxReachedStage = maxStages;
      diagnosticComplete = true;
      updateStageNavigation();
      refreshNextButton();
      nextBtnLabel.textContent = 'Diagnostic Captured ✓';
      aiLiveText.innerHTML = '<span class="text-tertiary font-semibold">Profile ready.</span> All required diagnostic inputs are complete.';

      const diagnosticState = getDiagnosticState();
      const profile = getStudentProfile();
      console.log('MEET2_FORM1_PAST_SCHEMA', getForm1PastSchemaSection());
      console.log('MEET2_FORM1_PAST_SCHEMA_JSON', JSON.stringify(getForm1PastSchemaSection(), null, 2));
      console.log('MEET2_STUDENT_PROFILE', profile);
      console.log('MEET2_STUDENT_PROFILE_JSON', JSON.stringify(profile, null, 2));
      console.log('MEET2_STUDENT_SKILLS_SCHEMA', JSON.stringify(profile.student.skills, null, 2));

      try {
        if (window.Meet2API?.submitProfile) {
          // Send only P3's schema-shaped profile to the API. Keep a separate
          // legacy/internal copy locally because later prototype pages still
          // read the internal diagnostic shape.
          await window.Meet2API.submitProfile(profile);
        } else {
          localStorage.setItem('meet2_diagnostic_state', JSON.stringify(diagnosticState));
          localStorage.setItem('meet2_student_profile', JSON.stringify(profile));
          localStorage.removeItem('meet2_selected_route');
        }
        localStorage.setItem('meet2_diagnostic_state', JSON.stringify(diagnosticState));
        localStorage.setItem('meet2_student_profile', JSON.stringify(profile));
      } catch (apiError) {
        console.error('Meet 2 profile submission failed:', apiError);
        aiLiveText.innerHTML = '<span class="text-error font-semibold">Profile submission failed.</span> Please try again.';
        nextBtn.disabled = false;
        nextBtnLabel.textContent = 'Retry Diagnosis';
        diagnosticComplete = false;
        return;
      }

      setTimeout(() => {
        window.location.href = 'routes.html';
      }, 500);
    }
  });

  backBtn.addEventListener('click', () => {
    if (currentStage > 1) {
      clearValidationError();
      updateStageUI(currentStage - 1);
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const tag = document.activeElement?.tagName;
      if (tag !== 'TEXTAREA') nextBtn.click();
    }
  });

  updateStageUI(1);
});
