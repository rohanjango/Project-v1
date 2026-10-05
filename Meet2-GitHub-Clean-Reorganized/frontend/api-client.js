/* Meet 2 — Step 26 unified API client
 * Every frontend page talks through this seam.
 * Two backend services are supported:
 *   - form5: Dynamic Form 5 question-generation service
 *   - main:  P2/Gagan main Meet 2 backend
 */
(function () {
  'use strict';

  const DEFAULT_CONFIG = {
    useMockApi: true,
    allowLocalRouteFallback: true,
    services: {
      form5: 'http://127.0.0.1:5000',
      main: 'http://127.0.0.1:5000'
    },
    // Legacy alias; services.main is authoritative.
    baseUrl: 'http://127.0.0.1:5000',
    endpoints: {
      generateForm5: '/api/generate-form5',
      submitProfile: '/api/submit',
      generateRoadmap: '/api/generate-roadmap',
      currentMission: '/api/mission/current',
      completeMission: '/api/mission/complete',
      copilot: '/api/copilot',
      progress: '/api/progress'
    }
  };

  function getConfig() {
    const source = window.MEET2_API || {};
    return {
      ...DEFAULT_CONFIG,
      ...source,
      services: {
        ...DEFAULT_CONFIG.services,
        ...(source.services || {})
      },
      endpoints: {
        ...DEFAULT_CONFIG.endpoints,
        ...(source.endpoints || {})
      }
    };
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`[Meet2 API] Could not read ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[Meet2 API] Could not write ${key}`, error);
      return false;
    }
  }

  function selectedRouteId() {
    return localStorage.getItem('meet2_selected_route') || null;
  }

  function normalizeRoadmapResponse(response) {
    const root = response?.roadmap || response?.data || response || {};
    const candidatePaths = Array.isArray(root.paths)
      ? root.paths
      : Array.isArray(root.routes)
        ? root.routes
        : [];

    const paths = candidatePaths.map((path, index) => ({
      ...path,
      id: path.id || `route_${index + 1}`,
      name: path.name || path.title || `Route ${index + 1}`,
      milestones: Array.isArray(path.milestones) ? path.milestones : []
    }));

    return {
      ...root,
      targetRole: root.targetRole || root.target_role || readJSON('meet2_student_profile', {})?.goal?.targetRole || 'Career Explorer',
      paths
    };
  }

  function saveGeneratedRoadmap(response, source = null) {
    const roadmap = normalizeRoadmapResponse(response);
    writeJSON('meet2_generated_roadmap', roadmap);
    try {
      localStorage.setItem('meet2_generated_roadmap_source', source || response?.source || 'backend');
    } catch (error) {
      console.warn('[Meet2 API] Could not save roadmap source.', error);
    }
    return roadmap;
  }

  function getStoredRoadmap() {
    const stored = readJSON('meet2_generated_roadmap', null);
    return stored ? normalizeRoadmapResponse(stored) : null;
  }

  function serviceBaseUrl(service = 'main') {
    const config = getConfig();
    const base = config.services?.[service] || config.services?.main || '';
    return String(base).replace(/\/$/, '');
  }

  function buildServiceUrl(service, path) {
    const base = serviceBaseUrl(service);
    const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
    if (!base) throw new Error(`No base URL configured for service '${service}'.`);
    return `${base}${cleanPath}`;
  }

  async function request(path, options = {}, service = 'main') {
    const url = buildServiceUrl(service, path);
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`API ${response.status}: ${body || response.statusText}`);
    }
    return response.json();
  }

  async function submitProfile(profile) {
    const config = getConfig();
    if (!profile || typeof profile !== 'object') {
      throw new Error('A valid student profile is required.');
    }

    // Keep a local copy first so the profile is not lost if the API is temporarily unavailable.
    writeJSON('meet2_student_profile', profile);
    try { localStorage.removeItem('meet2_selected_route'); } catch (_) {}

    if (!config.useMockApi) {
      const response = await request(config.endpoints.submitProfile, {
        method: 'POST',
        body: JSON.stringify({ profile })
      }, 'main');
      if (response?.session_id) writeJSON('meet2_session_id', response.session_id);
      return response;
    }

    writeJSON('meet2_student_profile', profile);
    try { localStorage.removeItem('meet2_selected_route'); } catch (_) {}
    return {
      success: true,
      source: 'mock',
      message: 'Profile captured locally for demo mode.'
    };
  }

  function mockMission({ route, current, index, profile }) {
    if (!current) return { success: true, source: 'mock', mission: null };

    const title = current.title || `Milestone ${index + 1}`;
    const lower = title.toLowerCase();
    let description = `Turn “${title}” into one concrete proof-of-work artifact you can show, review, or iterate on today.`;
    let tasks = [
      'Spend one focused session on the milestone.',
      'Create one tangible artifact or verified result.',
      'Write one sentence describing what you learned.'
    ];
    let definition = [
      'Complete one focused session.',
      'Produce one tangible proof of work.',
      'Record one learning takeaway.'
    ];
    let estimatedMinutes = 30;
    let skillTargets = ['Problem Solving'];

    if (lower.includes('core') || lower.includes('foundation') || lower.includes('program')) {
      description = 'Complete one focused fundamentals sprint: learn the core concept, then solve or implement a small example without copy-paste.';
      tasks = ['Review the core concept for 10 minutes.', 'Solve 3 small practice problems or examples.', 'Save the best solution as a reusable note or snippet.'];
      definition = ['Finish the concept block.', 'Solve 3 examples correctly.', 'Save one reusable snippet or note.'];
      estimatedMinutes = 25;
      skillTargets = ['Python / Programming', 'Problem Solving'];
    } else if (lower.includes('statistics') || lower.includes('math')) {
      description = 'Work one quantitative exercise from start to finish and explain the reasoning in your own words.';
      tasks = ['Complete 2 worked examples.', 'Write the key formula or idea in your notes.', 'Explain one result in plain language.'];
      definition = ['Complete 2 worked examples.', 'Write the key concept.', 'Explain one result clearly.'];
      estimatedMinutes = 30;
      skillTargets = ['Mathematics', 'Problem Solving'];
    } else if (lower.includes('project') || lower.includes('build') || lower.includes('production')) {
      description = 'Ship a small, testable slice of the milestone instead of planning the whole project.';
      tasks = ['Define the smallest working slice.', 'Build and run it locally.', 'Record one test result or screenshot.'];
      definition = ['Smallest slice is defined.', 'Build runs successfully.', 'One test result is recorded.'];
      estimatedMinutes = 45;
      skillTargets = ['Python / Programming', 'Problem Solving'];
    } else if (lower.includes('internship') || lower.includes('research') || lower.includes('role')) {
      description = 'Create one portfolio-facing proof point for this milestone: a shortlist, outreach draft, research note, or project summary.';
      tasks = ['Choose one concrete target.', 'Prepare one tailored artifact.', 'Save the next action for tomorrow.'];
      definition = ['Choose one specific target.', 'Create one tailored artifact.', 'Record the next action.'];
      estimatedMinutes = 35;
      skillTargets = ['Communication', 'Leadership'];
    } else if (lower.includes('open source')) {
      description = 'Make one small contribution-ready change in a public or practice repository.';
      tasks = ['Pick one issue or improvement.', 'Make and test the change.', 'Write a concise contribution note.'];
      definition = ['Select one change.', 'Test the change.', 'Write the contribution note.'];
      estimatedMinutes = 40;
      skillTargets = ['Python / Programming', 'Communication'];
    }

    return {
      success: true,
      source: 'mock',
      mission: {
        id: `mock_${route.id}_milestone_${index}`,
        route_id: route.id,
        milestone_id: index,
        title,
        description,
        estimated_minutes: estimatedMinutes,
        xp: 150 + index * 50,
        tasks,
        definition_of_done: definition,
        completion_rule: 'all_definition_of_done',
        skill_targets: skillTargets,
        next_milestone_title: route.milestones[index + 1]?.title || 'Route completion',
        generated_for_role: profile?.goal?.targetRole || 'Career Explorer'
      }
    };
  }

  async function generateForm5(context) {
    const config = getConfig();
    if (!context || typeof context !== 'object') throw new Error('Form 5 context is required.');

    // Form 5 is intentionally allowed to use a local deterministic fallback.
    // This is separate from the main roadmap fallback, which remains disabled.
    if (!config.useMockApi) {
      try {
        return await request(config.endpoints.generateForm5, {
          method: 'POST',
          body: JSON.stringify({ context })
        }, 'form5');
      } catch (error) {
        if (!config.allowForm5LocalFallback) throw error;
        if (!window.Meet2MockForm5?.generate) {
          throw new Error(`Form 5 service failed and local fallback is not loaded: ${error?.message || 'unknown error'}`);
        }

        console.warn('[Meet2 API] Form 5 service unavailable; using local deterministic fallback.', error);
        const fallback = window.Meet2MockForm5.generate(context);
        return {
          ...fallback,
          source: 'local_fallback',
          fallback_used: true,
          fallback_reason: error?.message || 'Form 5 backend unavailable.'
        };
      }
    }

    if (!window.Meet2MockForm5?.generate) {
      throw new Error('Meet2MockForm5 is not loaded.');
    }
    return window.Meet2MockForm5.generate(context);
  }

  async function getRoutes(profile) {
    const config = getConfig();
    const sessionId = readJSON('meet2_session_id', null);

    if (!config.useMockApi) {
      if (!sessionId) {
        throw new Error('No active session found. Please complete the diagnostic again so the main backend can identify your saved profile.');
      }
      try {
        return await request(config.endpoints.generateRoadmap, {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId })
        }, 'main');
      } catch (error) {
        if (!config.allowLocalRouteFallback) throw error;
        console.warn('[Meet2 API] Roadmap API unavailable; using local route fallback.', error);
        if (typeof window.mockGenerateRoadmap !== 'function') {
          throw error;
        }
        const roadmap = window.mockGenerateRoadmap(profile);
        return {
          success: true,
          source: 'local_route_fallback',
          fallback_used: true,
          fallback_reason: error?.message || 'Roadmap API unavailable.',
          ...roadmap
        };
      }
    }

    if (typeof window.mockGenerateRoadmap !== 'function') {
      throw new Error('mockGenerateRoadmap is not loaded.');
    }
    const roadmap = window.mockGenerateRoadmap(profile);
    return { success: true, source: 'mock', ...roadmap };
  }

  async function getCurrentMission(context) {
    const config = getConfig();
    if (!config.useMockApi) return request(config.endpoints.currentMission, { method: 'GET' }, 'main');
    return mockMission(context);
  }

  async function completeMission(payload) {
    const config = getConfig();
    if (!config.useMockApi) {
      return request(config.endpoints.completeMission, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, 'main');
    }

    const progress = window.Meet2Progress;
    if (!progress) throw new Error('Meet2Progress is not loaded.');
    const routeId = payload.route_id || selectedRouteId() || 'traditional';
    const state = progress.load(routeId, Number(payload.milestone_count || 0));
    progress.completeMilestone(
      routeId,
      state,
      Number(payload.milestone_id),
      { routeId, targetRole: payload.target_role, title: payload.title },
      Number(payload.milestone_count || 0)
    );
    return { success: true, source: 'mock', stored_locally: true };
  }

  function mockCopilot({ question, context = {} }) {
    const q = String(question || '').trim().toLowerCase();
    const role = context?.profile?.goal?.targetRole || context?.targetRole || 'Career Explorer';
    const route = context?.route?.name || 'your selected route';
    const milestone = context?.currentMilestone?.title || context?.milestone?.title || 'your current milestone';
    const mission = context?.mission?.title || context?.mission?.mission || 'today\'s mission';
    const completed = Array.isArray(context?.progress?.completed) ? context.progress.completed.length : 0;
    const total = Number(context?.progress?.total || context?.route?.milestones?.length || 0);

    let answer = `For ${role}, you are currently on ${route}. Your next useful action is to make progress on “${milestone}” through ${mission}. Keep the proof small enough to finish and verify today.`;
    let suggestions = ['What should I do today?', 'Why does this milestone matter?', 'How can I make this easier?'];

    if (/why|matter|important|purpose/.test(q)) {
      answer = `“${milestone}” matters because it is a dependency for later work on the ${route} route. You do not need to master everything at once; focus on one verifiable outcome today, then use the result to decide what comes next.`;
      suggestions = ['What exactly should I prove?', 'What can I skip for now?', 'What comes after this?'];
    } else if (/week|weekly|schedule|plan|calendar/.test(q)) {
      answer = `A practical week for ${role} is to split effort into three blocks: learn the concept, apply it in a small artifact, and review the result. Put “${milestone}” at the center of the next focused block, then reserve one short review session to capture what you learned.`;
      suggestions = ['Make me a 3-day plan', 'How much time should I spend?', 'What should I track?'];
    } else if (/stuck|hard|confus|difficult|don\'t know|dont know/.test(q)) {
      answer = `Reduce “${milestone}” to the smallest testable slice. Start with one example, get it working, explain it in your own words, and only then increase difficulty. If the first attempt fails, record the failure instead of restarting from zero.`;
      suggestions = ['Give me the smallest first step', 'Give me an example', 'How do I know I am done?'];
    } else if (/next|today|do|start|begin/.test(q)) {
      answer = `Start with the smallest action that can produce evidence today: work on “${milestone}”, finish one concrete task, and save the result. You have ${completed}${total ? ` of ${total}` : ''} milestones verified so far, so keep the next step incremental.`;
      suggestions = ['Give me a 30-minute version', 'What should my proof be?', 'What should I do after that?'];
    } else if (/route|path|choice|choose|compare/.test(q)) {
      answer = `Your current route is ${route}. The useful question is not which route sounds best in the abstract, but which trade-offs fit your constraints and which one you can consistently execute. Your roadmap and progress state are the context I would use to compare them.`;
      suggestions = ['Compare my route options', 'What trade-off matters most?', 'Should I revisit Discover Routes?'];
    }

    return { success: true, source: 'mock', answer, suggested_questions: suggestions, context: { role, route, milestone } };
  }

  async function askCopilot(payload = {}) {
    const config = getConfig();
    if (!config.useMockApi) return request(config.endpoints.copilot, { method: 'POST', body: JSON.stringify(payload) }, 'main');
    return mockCopilot(payload);
  }

  window.Meet2API = {
    getConfig,
    serviceBaseUrl,
    buildServiceUrl,
    request,
    readJSON,
    writeJSON,
    normalizeRoadmapResponse,
    saveGeneratedRoadmap,
    getStoredRoadmap,
    submitProfile,
    getRoutes,
    generateForm5,
    getCurrentMission,
    completeMission,
    askCopilot,
    selectedRouteId
  };
})();
