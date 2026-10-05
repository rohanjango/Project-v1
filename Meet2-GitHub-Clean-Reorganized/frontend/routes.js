/* Meet 2 — Step 13: Discover Routes API-ready frontend */

const DEMO_PROFILE = {
  past: { stream: 'science', subjects: ['Mathematics', 'Physics'] },
  present: { interests: ['AI & Technology', 'Design & Creativity'], hobbies: ['Building Things'], regrets: '' },
  future: { collegeDecision: 'I have a shortlist', degree: 'B.Tech / B.E.', branch: 'Computer Science / AI' },
  goal: { targetRole: 'AI Engineer', openToDiscovery: false },
  skills: { 'Python / Programming': 4, Mathematics: 3, 'Problem Solving': 4, Communication: 3, 'Design / Creativity': 3, Leadership: 3 }
};

let studentProfile = null;
let roadmapData = null;
let selectedRouteId = null;

const PALETTES = [
  { accentClass: 'text-primary', bar: 'bg-primary', shadow: 'rgba(56,189,248,0.2)' },
  { accentClass: 'text-secondary', bar: 'bg-secondary', shadow: 'rgba(192,193,255,0.25)' },
  { accentClass: 'text-tertiary', bar: 'bg-tertiary', shadow: 'rgba(78,230,170,0.2)' }
];

function readStudentProfile() {
  try {
    const raw = localStorage.getItem('meet2_student_profile');
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.warn('Could not read stored Meet 2 profile.', error);
  }
  return DEMO_PROFILE;
}

function getTargetRole(profile) {
  return profile?.goal?.targetRole || 'Career Discovery';
}

function getBaseline(profile) {
  const stream = profile?.past?.stream || 'mixed';
  const interests = profile?.present?.interests || [];
  const skillValues = Object.values(profile?.skills || {}).filter(v => typeof v === 'number');
  const avg = skillValues.reduce((a, b) => a + b, 0) / Math.max(1, skillValues.length);
  const streamLabel = stream.charAt(0).toUpperCase() + stream.slice(1);
  return `${streamLabel} baseline • ${interests.slice(0, 2).join(' + ') || 'Exploration'} • Skill confidence ${avg.toFixed(1)}/5`;
}

document.addEventListener('DOMContentLoaded', initializeRoutesPage);

async function initializeRoutesPage() {
  studentProfile = readStudentProfile();
  const role = getTargetRole(studentProfile);
  document.getElementById('targetRoleHeader')?.replaceChildren(document.createTextNode(role));
  document.getElementById('targetRoleChip')?.replaceChildren(document.createTextNode(role));
  document.getElementById('baselineSummary')?.replaceChildren(document.createTextNode(getBaseline(studentProfile)));

  wireFilters();
  wireNavigation();
  showRoutesLoading();

  try {
    const response = await Meet2API.getRoutes(studentProfile);
    roadmapData = normalizeRoadmapResponse(response);
    if (!roadmapData.paths.length) throw new Error('No route paths were returned.');

    try {
      if (window.Meet2API?.saveGeneratedRoadmap) {
        window.Meet2API.saveGeneratedRoadmap(roadmapData, response?.source || 'backend');
      } else {
        localStorage.setItem('meet2_generated_roadmap', JSON.stringify(roadmapData));
        localStorage.setItem('meet2_generated_roadmap_source', response?.source || 'backend');
      }
    } catch (storageError) {
      console.warn('Could not persist generated roadmap context.', storageError);
    }

    renderRoutes(roadmapData.paths);
    renderComparison(roadmapData);
    showRouteSource(response?.source || roadmapData.generatedBy || 'backend');
  } catch (error) {
    console.error('Meet 2 route generation failed:', error);
    showRoutesError(error);
  }
}

function normalizeRoadmapResponse(response) {
  const data = response?.roadmap || response?.data || response || {};
  return {
    ...data,
    targetRole: data.targetRole || getTargetRole(studentProfile),
    paths: Array.isArray(data.paths) ? data.paths : []
  };
}

function showRoutesLoading() {
  const container = document.getElementById('routeCardsContainer');
  if (container) {
    container.innerHTML = `<div class="lg:col-span-3 rounded-xl bg-surface-container-low p-space-xl text-center text-on-surface-variant">Generating route profiles from your diagnostic…</div>`;
  }
  const grid = document.getElementById('comparisonMetricsGrid');
  if (grid) grid.innerHTML = '<div class="lg:col-span-4 rounded-xl bg-surface-container p-space-lg text-center text-on-surface-variant">Building comparison telemetry…</div>';
}

function showRoutesError(error) {
  const message = escapeHtml(error?.message || 'Could not generate routes.');
  const container = document.getElementById('routeCardsContainer');
  if (container) {
    container.innerHTML = `<div class="lg:col-span-3 rounded-xl bg-surface-container-low p-space-xl text-center"><div class="text-error font-semibold mb-2">Route generation failed</div><p class="text-on-surface-variant text-sm mb-4">${message}</p><button class="px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary-container font-semibold" type="button" onclick="initializeRoutesPage()">Try Again</button></div>`;
  }
}

function showRouteSource(source) {
  const el = document.getElementById('routeSourceBadge');
  if (!el) return;
  const labels = {
    mock: 'LOCAL DEMO DATA',
    local_route_fallback: 'LOCAL ROUTE FALLBACK',
    backend: 'BACKEND GENERATED',
    gemini: 'PERSONALIZED BY JOURNEYAI'
  };
  el.textContent = labels[source] || 'BACKEND DATA';
  const isLocal = source === 'mock' || source === 'local_route_fallback';
  el.classList.toggle('text-tertiary', !isLocal);
  el.classList.toggle('text-outline', isLocal);
}

function renderRoutes(paths) {
  const container = document.getElementById('routeCardsContainer');
  if (!container) return;
  container.innerHTML = paths.map((path, index) => routeCardTemplate(path, index)).join('');
  container.querySelectorAll('[data-select-route]').forEach(button => {
    button.addEventListener('click', () => selectPath(button.dataset.selectRoute));
  });
}

function routeCardTemplate(path, index) {
  const p = PALETTES[index % PALETTES.length];
  const milestones = Array.isArray(path.milestones) ? path.milestones : [];
  const criteria = Array.isArray(path.criteria) ? path.criteria : [];
  const advantages = Array.isArray(path.advantages) ? path.advantages : [];
  const tradeoffs = Array.isArray(path.tradeoffs) ? path.tradeoffs : [];
  const steps = milestones.map((m, i) => `
    <li class="flex items-start gap-space-sm">
      <span class="flex-shrink-0 w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center font-label-code text-[10px] ${p.accentClass} mt-0.5">${i + 1}</span>
      <div><span class="font-body-sm text-body-sm text-on-surface font-medium block">${escapeHtml(m.title || `Milestone ${i + 1}`)}</span><span class="font-body-sm text-body-sm text-outline block">${escapeHtml(m.detail || '')}</span></div>
    </li>`).join('');
  const selectedStyle = index === 2 ? 'bg-surface-container' : 'bg-surface-container-low';
  const buttonStyle = 'bg-tertiary text-on-tertiary shadow-[0_0_18px_rgba(78,230,170,0.25)] hover:brightness-105';
  return `
  <article class="path-card relative flex flex-col justify-between rounded-xl ${selectedStyle} p-space-lg shadow-md transition-all duration-300 hover:shadow-[0_0_24px_-4px_${p.shadow}]" id="card-${escapeHtml(path.id)}" data-route-card="${escapeHtml(path.id)}" data-criteria="${escapeHtml(criteria.join(','))}">
    <div class="absolute top-0 left-0 right-0 h-1 rounded-t-xl ${p.bar}"></div>
    <div>
      <div class="flex items-center justify-between mb-space-md pt-1">
        <span class="font-label-code text-label-code ${p.accentClass} uppercase">ROUTE 0${index + 1} // ${escapeHtml(path.code || 'PATH')}</span>
        <div class="px-space-xs py-0.5 rounded bg-surface-container-high font-label-code text-label-code text-outline">${escapeHtml(path.degreeLabel || 'PATHWAY')}</div>
      </div>
      <h2 class="font-headline-lg text-headline-lg text-on-surface mb-space-xs tracking-tight">${escapeHtml(path.name || `Route ${index + 1}`)}</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-space-md">${escapeHtml(path.summary || '')}</p>
      <div class="p-space-md rounded-lg bg-surface-container mb-space-lg">
        <div class="flex items-center justify-between mb-space-xs"><span class="font-label-badge text-label-badge ${p.accentClass} uppercase font-bold">Fit signal</span><span class="font-label-code text-label-code ${p.accentClass}">${Number(path.fitScore || 0)}% ${escapeHtml(path.fitLabel || '')}</span></div>
        <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-full ${p.bar}" style="width:${Math.max(0, Math.min(100, Number(path.fitScore) || 0))}%"></div></div>
        <p class="font-body-sm text-body-sm text-outline mt-space-xs">${escapeHtml(path.fitExplanation || '')}</p>
      </div>
      ${path.image ? `<div class="relative w-full h-36 rounded-lg overflow-hidden mb-space-lg shadow-sm"><img class="w-full h-full object-cover" alt="${escapeHtml(path.imageAlt || path.name || 'Route environment')}" src="${escapeHtml(path.image)}"><div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent"></div><div class="absolute bottom-2 left-3 right-3 flex items-center justify-between text-on-surface"><span class="font-label-badge text-label-badge text-on-surface font-semibold bg-surface-container-lowest/80 px-2 py-0.5 rounded">${escapeHtml(path.environment || 'Learning environment')}</span><span class="font-label-code text-label-code ${p.accentClass}">${escapeHtml(path.duration || '')}</span></div></div>` : ''}
      <div class="mb-space-lg">
        <div class="flex items-center justify-between mb-space-sm"><span class="font-label-badge text-label-badge text-outline uppercase font-semibold">Progression Spine</span><span class="font-label-code text-label-code text-outline">${milestones.length} PHASES</span></div>
        <ol class="space-y-space-sm pl-2">${steps}</ol>
      </div>
      <div class="space-y-space-sm p-space-md rounded-lg bg-surface-container mb-space-lg">
        <div><span class="font-label-badge text-label-badge text-tertiary flex items-center gap-1 uppercase mb-1"><span class="material-symbols-outlined text-[14px]">check_circle</span>Advantages</span><p class="font-body-sm text-body-sm text-on-surface-variant">${escapeHtml(advantages.join(' • '))}</p></div>
        <div class="pt-space-xs"><span class="font-label-badge text-label-badge text-error flex items-center gap-1 uppercase mb-1"><span class="material-symbols-outlined text-[14px]">warning</span>Trade-offs</span><p class="font-body-sm text-body-sm text-on-surface-variant">${escapeHtml(tradeoffs.join(' • '))}</p></div>
      </div>
    </div>
    <button class="w-full py-space-sm px-space-md rounded-lg ${buttonStyle} font-body-sm text-body-sm font-semibold transition-all" data-select-route="${escapeHtml(path.id)}" type="button">Explore &amp; Select This Route →</button>
  </article>`;
}

function renderComparison(data) {
  renderComparisonLegend(data.paths || [], data.comparison?.legend);
  renderMetrics(data.comparison?.metrics || {});
  renderSynthesis(data.comparison?.synthesis, data.paths || []);
}

function renderComparisonLegend(paths, legend) {
  const container = document.getElementById('comparisonLegend');
  if (!container) return;
  const labels = Array.isArray(legend) && legend.length ? legend : paths.map(path => ({ id: path.id, name: path.name }));
  container.innerHTML = labels.map((item, index) => {
    const palette = PALETTES[index % PALETTES.length];
    const dot = palette.bar.replace('bg-', 'bg-');
    return `<div class="flex items-center gap-space-xs font-label-code text-label-code"><span class="w-3 h-3 rounded-sm ${dot}"></span><span class="text-on-surface">${escapeHtml(item.name || item.id)}</span></div>`;
  }).join('');
}

function renderMetrics(metrics) {
  const grid = document.getElementById('comparisonMetricsGrid');
  if (!grid) return;
  const definitions = [
    ['tuition', 'Total Tuition Capital', 'Average degree tuition expenditure across this generated route set.', 'payments'],
    ['speed', 'Time to First Paid Gig', 'Estimated time until an early industry proof point or paid opportunity.', 'timer'],
    ['mathematics', 'Mathematical Depth', 'Relative degree of mathematical intensity in the generated route.', 'calculate'],
    ['autonomy', 'Schedule Autonomy', 'How much flexibility the generated route offers for self-directed study.', 'tune']
  ];
  grid.innerHTML = definitions.map(([key, title, desc, icon]) => metricCard(key, title, desc, icon, metrics[key] || [])).join('');
}

function metricCard(key, title, description, icon, items) {
  const safeItems = Array.isArray(items) ? items : [];
  const maxScore = Math.max(1, ...safeItems.map(item => Number(item.score) || 0));
  const rows = safeItems.map((item, index) => {
    const palette = PALETTES[index % PALETTES.length];
    const width = Math.max(4, Math.min(100, ((Number(item.score) || 0) / maxScore) * 100));
    return `<div><div class="flex justify-between font-label-code text-label-code mb-1"><span class="${palette.accentClass}">${escapeHtml(item.name || item.id || `Route ${index + 1}`)}</span><span class="text-on-surface">${escapeHtml(item.value || '')}</span></div><div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full ${palette.bar} rounded-full" style="width:${width}%"></div></div></div>`;
  }).join('');
  return `<div class="p-space-md rounded-xl bg-surface-container flex flex-col justify-between"><div><div class="flex items-center justify-between text-on-surface mb-space-xs"><span class="font-body-sm text-body-sm font-semibold">${escapeHtml(title)}</span><span class="material-symbols-outlined text-outline text-[18px]">${icon}</span></div><p class="font-body-sm text-body-sm text-outline mb-space-md">${escapeHtml(description)}</p></div><div class="space-y-space-sm">${rows || '<span class="text-outline text-sm">No comparison data returned.</span>'}</div></div>`;
}

function renderSynthesis(synthesis, paths) {
  const fallback = { title: 'Routes generated for your current profile', summary: 'Compare the dimensions above before choosing a route.', details: '' };
  const data = synthesis || fallback;
  document.getElementById('synthesisTitle')?.replaceChildren(document.createTextNode(data.title || fallback.title));
  document.getElementById('synthesisSummary')?.replaceChildren(document.createTextNode(data.summary || fallback.summary));
  document.getElementById('synthesisDetails')?.replaceChildren(document.createTextNode(data.details || fallback.details));
}

function wireFilters() {
  document.querySelectorAll('#preferenceFilters .filter-btn').forEach(button => button.addEventListener('click', () => highlightTrack(button.dataset.filter)));
}

function highlightTrack(preference) {
  document.querySelectorAll('#preferenceFilters .filter-btn').forEach(btn => {
    const active = btn.dataset.filter === preference;
    btn.classList.toggle('bg-primary-container', active);
    btn.classList.toggle('text-on-primary-container', active);
    btn.classList.toggle('font-semibold', active);
  });
  document.querySelectorAll('[data-route-card]').forEach(card => {
    const criteria = (card.dataset.criteria || '').split(',').filter(Boolean);
    const visible = preference === 'all' || criteria.includes(preference);
    card.style.opacity = visible ? '1' : '0.42';
  });
}

function selectPath(routeId) {
  selectedRouteId = routeId;
  const path = roadmapData?.paths?.find(item => item.id === routeId);
  if (!path) return;
  document.getElementById('modalRouteCode').textContent = `ROUTE SELECTED // ${(path.name || '').toUpperCase()}`;
  document.getElementById('modalRouteTitle').textContent = `${path.name || 'Route'} selected`;
  document.getElementById('modalRouteDesc').textContent = 'This route is saved for your journey. The Interactive Roadmap will use the same generated path and milestones.';
  document.getElementById('selectionModal')?.classList.remove('hidden');
}

function closeModal() { document.getElementById('selectionModal')?.classList.add('hidden'); }

function confirmRouteLaunch() {
  if (!selectedRouteId) return;
  try {
    localStorage.setItem('meet2_selected_route', selectedRouteId);
  } catch (error) {
    console.warn('Could not save selected route.', error);
  }
  document.getElementById('modalRouteTitle').textContent = 'Route selected for your journey ✓';
  document.getElementById('modalRouteDesc').textContent = 'Your selected route is ready. Opening the Interactive Roadmap…';
  const button = document.querySelector('#selectionModal [data-confirm-route]');
  if (button) {
    button.textContent = 'Opening Roadmap…';
    button.disabled = true;
  }
  setTimeout(() => { window.location.href = 'roadmap.html'; }, 650);
}

function wireNavigation() {
  // Navigation is handled by the links in routes.html. The roadmap page also links back here.
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

window.initializeRoutesPage = initializeRoutesPage;
window.closeModal = closeModal;
window.confirmRouteLaunch = confirmRouteLaunch;
