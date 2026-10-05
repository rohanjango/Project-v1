/* Meet 2 — Step 10 Interactive Roadmap
 * Roadmap + Daily Mission now share one progress state.
 * Storage layer is temporary localStorage; P2 can later replace it with an API.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const profile = readJSON('meet2_student_profile', null);
  const selectedId = localStorage.getItem('meet2_selected_route');
  const demoProfile = profile || {
    past:{stream:'science',subjects:['Mathematics','Physics']},
    present:{interests:['AI & Technology'],hobbies:['Building Things'],regrets:''},
    future:{collegeDecision:'I have a shortlist',degree:'B.Tech / B.E.',branch:'Computer Science / AI'},
    goal:{targetRole:'AI Engineer',openToDiscovery:false},
    skills:{'Python / Programming':4,'Mathematics':3,'Problem Solving':4,Communication:3,'Design / Creativity':3,Leadership:3}
  };

  let data = window.Meet2API?.getStoredRoadmap?.() || null;
  if (!data && window.Meet2API?.getRoutes) {
    try {
      const response = await window.Meet2API.getRoutes(demoProfile);
      data = window.Meet2API.saveGeneratedRoadmap?.(response, response?.source || 'backend') || response;
    } catch (error) {
      console.error('Meet 2 roadmap retrieval failed:', error);
    }
  }
  if (!data && typeof window.mockGenerateRoadmap === 'function') data = window.mockGenerateRoadmap(demoProfile);

  const route = data?.paths?.find(p => p.id === selectedId) || data?.paths?.[0];
  if (!route) return showToast('No route available. Go back to Discover Routes first.');

  const targetRole = data.targetRole || demoProfile.goal?.targetRole || 'Career Explorer';
  const progress = Meet2Progress.load(route.id, route.milestones.length);

  hydrateHeader(route, targetRole);
  renderTimeline(route, progress, targetRole);
  hydrateMetrics(route, progress);
  hydrateSidebar(route, progress);
  wireStaticInteractions(route, progress, targetRole);
});

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Could not read ${key}`, e);
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function hydrateHeader(route, targetRole) {
  const title = document.getElementById('roadmapTitle');
  const chip = document.getElementById('targetRoleChip');
  const routeChip = document.getElementById('routeNameChip');
  const summary = document.getElementById('roadmapSummary');
  if (title) title.textContent = `Your Journey: ${targetRole} Roadmap`;
  if (chip) chip.textContent = `🎯 ${targetRole}`;
  if (routeChip) routeChip.textContent = `Route: ${route.name}`;
  if (summary) summary.textContent = route.summary;
}

function renderTimeline(route, progress, targetRole) {
  const container = document.getElementById('roadmapTimeline');
  if (!container) return;

  const all = route.milestones.map((m, index) => ({...m, index}));
  const currentIndex = Meet2Progress.getCurrentIndex(route, progress);

  const cards = all.map((m) => {
    const completed = progress.completed.includes(m.index);
    const active = m.index === currentIndex;
    const stateClass = completed ? 'roadmap-completed' : active ? 'roadmap-active' : 'roadmap-locked';
    const marker = completed ? 'done' : active ? 'psychology' : 'lock';
    const status = completed ? 'Completed' : active ? 'In Progress' : 'Locked';
    const statusClass = completed ? 'bg-tertiary-container text-on-tertiary' : active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline';
    const note = completed
      ? 'Milestone completed and retained in your journey progress.'
      : active
        ? 'This is your current milestone. Complete it here or from Daily Mission to unlock the next step.'
        : 'Complete the previous milestone to unlock this step.';

    return `
      <div class="relative group roadmap-node-enter ${stateClass}" data-roadmap-index="${m.index}">
        <div class="absolute -left-6 sm:-left-10 top-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-surface-container-lowest flex items-center justify-center">
          <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full ${statusClass} flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px] sm:text-[16px] font-bold">${marker}</span>
          </div>
        </div>
        <div class="roadmap-card p-space-md sm:p-space-lg rounded-xl ${active ? 'bg-surface-container-high' : 'bg-surface-container-low'} transition-all duration-200">
          <div class="flex flex-wrap items-center justify-between gap-space-sm mb-space-xs">
            <div class="flex items-center gap-space-sm">
              <span class="font-milestone-marker text-milestone-marker ${completed ? 'text-tertiary' : active ? 'text-primary' : 'text-outline'} font-semibold">NODE 0${m.index+1} // ${completed ? 'COMPLETE' : active ? 'ACTIVE SPRINT' : 'UPCOMING'}</span>
              <span class="px-2 py-0.5 rounded-full ${statusClass} font-label-badge text-label-badge font-bold uppercase">${status}</span>
            </div>
            <span class="font-label-code text-label-code text-outline">+${150 + m.index * 50} XP</span>
          </div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">${escapeHtml(m.title)}</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${escapeHtml(m.detail)}</p>
          <div class="p-space-md rounded-lg ${active ? 'bg-surface-container-lowest' : 'bg-surface-container'} mt-space-md">
            <span class="font-label-badge text-label-badge ${completed ? 'text-tertiary' : active ? 'text-primary' : 'text-outline'} uppercase tracking-wider">${completed ? 'Completed state' : active ? 'What to do now' : 'Locked state'}</span>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${escapeHtml(note)}</p>
          </div>
          ${active ? `<div class="mt-space-md flex flex-wrap gap-space-sm"><button id="mark-step-btn" class="flex-1 min-w-[180px] py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary-container font-body-sm text-body-sm font-semibold shadow-[0_0_18px_-4px_rgba(56,189,248,0.3)]">Mark Step Complete ✓</button><a href="mission.html" class="py-2.5 px-space-md rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm no-underline">Open Daily Mission</a></div>` : ''}
        </div>
      </div>`;
  });

  const finalTarget = `
    <div class="relative group roadmap-node-enter">
      <div class="absolute -left-6 sm:-left-10 top-3 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-[0_0_24px_rgba(225,224,255,0.2)]">
        <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed">
          <span class="material-symbols-outlined text-[16px] font-bold">flag</span>
        </div>
      </div>
      <div class="p-space-md sm:p-space-lg rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
        <div class="flex flex-wrap items-center justify-between gap-space-sm mb-space-xs">
          <div class="flex items-center gap-space-sm">
            <span class="font-milestone-marker text-milestone-marker text-secondary">FINAL NODE // HORIZON TARGET</span>
            <span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-badge text-label-badge font-bold">Goal Capstone</span>
          </div>
          <span class="font-label-code text-label-code text-secondary">+1,000 XP</span>
        </div>
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">TARGET ROLE — ${escapeHtml(targetRole)}</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Your selected route converges here. Progress is shared between Roadmap and Daily Mission.</p>
      </div>
    </div>`;

  container.innerHTML = cards.join('') + finalTarget;
}

function hydrateMetrics(route, progress) {
  const total = route.milestones.length;
  const completed = progress.completed.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const count = document.getElementById('completedCount');
  const totalCount = document.getElementById('totalCount');
  const percent = document.getElementById('completionPercent');
  const bar = document.getElementById('aggregateProgressBar');
  const status = document.getElementById('macroStatusValue');
  const note = document.getElementById('macroStatusNote');
  const all = document.getElementById('allMilestonesFilter');
  if (count) count.textContent = completed;
  if (totalCount) totalCount.textContent = `/ ${total} total milestones`;
  if (percent) percent.textContent = `${pct}% Complete`;
  if (bar) bar.style.width = `${pct}%`;
  if (status) status.textContent = completed === total ? 'Route Complete' : `Milestone ${Math.min(completed + 1, total)} of ${total} Active`;
  if (note) note.textContent = completed === total ? 'Journey Target Reached' : 'Unified Progress State';
  if (all) all.textContent = `All Milestones (${total + 1})`;
}

function hydrateSidebar(route, progress) {
  const remaining = route.milestones.find((m, i) => !progress.completed.includes(i));
  const nextTitle = document.getElementById('nextMilestoneTitle');
  const nextDetail = document.getElementById('nextMilestoneDetail');
  if (nextTitle) nextTitle.textContent = remaining ? remaining.title : 'All milestones complete';
  if (nextDetail) nextDetail.textContent = remaining ? remaining.detail : 'You have reached the current route horizon.';
  const mentor = document.getElementById('mentorNote');
  if (mentor) mentor.textContent = `Your current route is ${route.name}. Roadmap and Daily Mission now read the same progress state.`;
}

function wireStaticInteractions(route, progress, targetRole) {
  const markStepBtn = document.getElementById('mark-step-btn');
  if (markStepBtn) {
    markStepBtn.addEventListener('click', () => {
      const currentIndex = Meet2Progress.getCurrentIndex(route, progress);
      if (currentIndex === -1) return;

      Meet2Progress.completeMilestone(
        route.id,
        progress,
        currentIndex,
        { title: route.milestones[currentIndex].title, targetRole },
        route.milestones.length
      );

      renderTimeline(route, progress, targetRole);
      hydrateMetrics(route, progress);
      hydrateSidebar(route, progress);
      wireStaticInteractions(route, progress, targetRole);
      showToast(`✓ ${route.milestones[currentIndex].title} completed. Shared progress updated.`);
    });
  }

  document.getElementById('sandbox-btn')?.addEventListener('click', () => {
    showToast('Practice sandbox placeholder. Real learning tasks will connect in the next milestone layer.');
  });
  document.getElementById('export-btn')?.addEventListener('click', () => {
    const payload = { route, targetRole, progress };
    downloadJSON(payload, `meet2-${route.id}-roadmap.json`);
    showToast('Roadmap JSON exported.');
  });
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const payload = { route, targetRole, progress };
    downloadJSON(payload, `meet2-${route.id}-roadmap.json`);
    showToast('Roadmap JSON exported.');
  });
  document.getElementById('share-mentor-btn')?.addEventListener('click', () => showToast('Progress snapshot prepared for mentor review.'));
}

function downloadJSON(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function showToast(message) {
  let toast = document.getElementById('toast-message');
  if (!toast) {
    toast = document.createElement('div');
    toast.id='toast-message';
    toast.className='fixed bottom-6 right-6 z-[60] translate-y-20 opacity-0 pointer-events-none transition-all duration-300 bg-surface-container-high text-on-surface px-space-lg py-space-md rounded-xl shadow-2xl';
    toast.innerHTML='<span id="toast-text"></span>';
    document.body.appendChild(toast);
  }
  const text=document.getElementById('toast-text');
  if(text) text.textContent=message;
  toast.classList.add('toast-visible');
  setTimeout(()=>toast.classList.remove('toast-visible'),2800);
}
