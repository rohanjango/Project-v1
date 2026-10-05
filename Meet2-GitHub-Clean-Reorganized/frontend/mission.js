/* Meet 2 — Step 10 Daily Mission
 * Roadmap + Daily Mission share one unified progress state.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const profile = readJSON('meet2_student_profile', null) || {
    goal:{targetRole:'Career Explorer'}, skills:{}
  };
  const selectedId = localStorage.getItem('meet2_selected_route') || 'traditional';
  const data = typeof mockGenerateRoadmap === 'function' ? mockGenerateRoadmap(profile) : {targetRole:'Career Explorer',paths:[]};
  const route = data.paths.find(p => p.id === selectedId) || data.paths[0];
  if (!route) return showToast('No selected route found. Go back to Discover Routes first.');

  const progress = Meet2Progress.load(route.id, route.milestones.length);
  const currentIndex = Meet2Progress.getCurrentIndex(route, progress);
  const current = currentIndex >= 0 ? route.milestones[currentIndex] : null;
  const next = currentIndex >= 0 ? route.milestones[currentIndex + 1] || null : null;
  const targetRole = data.targetRole || profile.goal?.targetRole || 'Career Explorer';

  const apiBadge=document.querySelector('[data-api-status]');
  if(apiBadge) apiBadge.textContent = Meet2API.getConfig().useMockApi ? 'MOCK API' : 'LIVE API';

  setText('targetRole', targetRole);
  setText('goalChip', `Goal: ${targetRole}`);
  setText('activeRoute', route.name);
  setText('routeBadge', `ROUTE // ${route.code || route.id}`);
  setText('completedCount', progress.completed.length);
  setText('totalCount', route.milestones.length);
  const pct = route.milestones.length ? Math.round(progress.completed.length / route.milestones.length * 100) : 0;
  setText('completionPct', `${pct}%`);
  document.getElementById('progressBar').style.width = `${pct}%`;
  setText('xpValue', String(progress.completed.reduce((sum, i) => sum + 150 + i * 50, 0)));

  renderSkills(profile.skills || {});
  try {
    const missionResponse = await Meet2API.getCurrentMission({
      route, current, index: currentIndex, progress, profile
    });
    const mission = missionResponse?.mission || null;
    renderMission(route, current, currentIndex, progress, mission);
    renderNext(route, next, currentIndex);
    wireActions(route, progress, targetRole, mission);
  } catch (error) {
    console.error('[Meet2] Failed to load mission', error);
    showToast('Mission data could not be loaded.');
  }
});

function readJSON(key, fallback){
  try{ const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
}
function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }
function escapeHtml(v){ return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

function missionFor(route,current,index){
  const title = current?.title || 'Route complete';
  const t = title.toLowerCase();
  let mission = `Turn “${title}” into one concrete proof-of-work artifact you can show, review, or iterate on today.`;
  let done = ['Spend one focused session on the milestone.','Create one tangible artifact or verified result.','Write one sentence describing what you learned.'];
  let nextCheck = current ? `Next check: ${route.milestones[index + 1]?.title || 'Route completion'}` : 'Next check: Route complete';
  let time = '30m';
  if(t.includes('core') || t.includes('foundation') || t.includes('program')){
    mission='Complete one focused fundamentals sprint: learn the core concept, then solve or implement a small example without copy-paste.';
    done=['Finish one focused concept block.','Solve 3 small practice problems or examples.','Save your best solution as a reusable note/snippet.']; time='25m';
  } else if(t.includes('statistics') || t.includes('math')){
    mission='Work one quantitative exercise from start to finish and explain the reasoning in your own words.';
    done=['Complete 2 worked examples.','Write the key formula/idea in your notes.','Explain one result in plain language.']; time='30m';
  } else if(t.includes('project') || t.includes('build') || t.includes('production')){
    mission='Ship a small, testable slice of the milestone instead of planning the whole project.';
    done=['Define the smallest working slice.','Build and run it locally.','Record one test result or screenshot.']; time='45m';
  } else if(t.includes('internship') || t.includes('research') || t.includes('role')){
    mission='Create one portfolio-facing proof point for this milestone: a shortlist, outreach draft, research note, or project summary.';
    done=['Choose one concrete target.','Prepare one tailored artifact.','Save the next action for tomorrow.']; time='35m';
  } else if(t.includes('open source')){
    mission='Make one small contribution-ready change in a public or practice repository.';
    done=['Pick one issue or improvement.','Make and test the change.','Write a concise contribution note.']; time='40m';
  }
  return {mission,done,nextCheck,time, xp: index >= 0 ? 150 + index*50 : 0};
}

function renderMission(route,current,index,progress,apiMission){
  const completeBtn=document.getElementById('completeMissionBtn');
  if(!current){
    setText('nodeLabel','// ROUTE COMPLETE');
    setText('missionTitle','Route complete — no mission pending');
    setText('timeLeft','Done');
    setText('missionXP','Journey target reached');
    setText('masteryPct','100%'); document.getElementById('masteryBar').style.width='100%';
    setText('masteryScale','[██████████]'); setText('nextCheck','Next check: Route target');
    setText('missionTask','You completed every milestone on this route. Use the roadmap to review your proof-of-work or switch routes.');
    document.getElementById('definitionOfDone').innerHTML='<div class="p-3 rounded-lg bg-surface-container-high text-sm text-tertiary">✓ All route milestones completed.</div>';
    completeBtn.textContent='Route Complete ✓'; completeBtn.classList.add('disabled-action'); completeBtn.disabled=true;
    renderNext(route,null,index);
    return;
  }

  const m = apiMission ? {
    mission: apiMission.description,
    done: apiMission.definition_of_done || [],
    nextCheck: `Next check: ${apiMission.next_milestone_title || route.milestones[index + 1]?.title || 'Route completion'}`,
    time: `${apiMission.estimated_minutes || 30}m`,
    xp: apiMission.xp ?? (150 + index * 50),
    tasks: apiMission.tasks || []
  } : missionFor(route,current,index);
  setText('nodeLabel',`// NODE 0${index+1}_MISSION`);
  setText('missionTitle',current.title);
  setText('timeLeft',m.time);
  setText('missionXP',`+${m.xp} Mission XP`);
  const mastery = Math.min(95, 45 + index*8);
  setText('masteryPct',`${mastery}%`); document.getElementById('masteryBar').style.width=`${mastery}%`;
  setText('masteryScale','[' + '█'.repeat(Math.round(mastery/10)) + '░'.repeat(10-Math.round(mastery/10)) + ']');
  setText('nextCheck',m.nextCheck);
  setText('missionTask',m.mission);
  const taskList=document.getElementById('missionTaskList');
  if(taskList){
    taskList.innerHTML = (m.tasks || []).map((task,i)=>`<li class="flex items-start gap-2"><span class="text-primary">${i+1}.</span><span>${escapeHtml(task)}</span></li>`).join('');
  }

  const savedChecks = Meet2Progress.getMissionChecks(progress, index);
  document.getElementById('definitionOfDone').innerHTML=m.done.map((x,i)=>{
    const checked = Boolean(savedChecks[i]);
    return `<label class="mission-done-row flex items-start gap-3 p-3 rounded-lg bg-surface-container cursor-pointer transition-all ${checked ? 'ring-1 ring-tertiary/40' : ''}"><input class="mission-check mt-0.5" type="checkbox" data-mission-check="${i}" ${checked ? 'checked' : ''}><span class="text-sm text-on-surface-variant">${escapeHtml(x)}</span></label>`;
  }).join('');

  document.querySelectorAll('[data-mission-check]').forEach(box=>{
    box.addEventListener('change',()=>{
      box.closest('.mission-done-row')?.classList.toggle('ring-1', box.checked);
      box.closest('.mission-done-row')?.classList.toggle('ring-tertiary/40', box.checked);
      const checks = [...document.querySelectorAll('[data-mission-check]')].map(el=>el.checked);
      Meet2Progress.setMissionChecks(route.id, progress, index, checks, route.milestones.length);
    });
  });

  const checks = Meet2Progress.getMissionChecks(progress, index);
  completeBtn.textContent='Mark as Complete ✓';
  completeBtn.classList.remove('mission-complete','disabled-action');
  completeBtn.disabled=checks.filter(Boolean).length < Math.max(1, m.done.length - 1);
  if (completeBtn.disabled) {
    completeBtn.title = 'Complete at least two mission checks first.';
  } else {
    completeBtn.removeAttribute('title');
  }
}

function renderNext(route,next,index){
  setText('nextTitle', next ? next.title : 'No next milestone');
  setText('nextDetail', next ? next.detail : 'Complete route target reached.');
  setText('nextWhy', next ? `Unlocks after completing Node 0${index+1}.` : 'The selected route is complete.');
}

function renderSkills(skills){
  const names=['Python / Programming','Mathematics','Problem Solving','Communication','Design / Creativity','Leadership'];
  const box=document.getElementById('skillsList');
  box.innerHTML=names.map(name=>{
    const score=Math.max(0,Math.min(5,Number(skills?.[name] ?? 0)));
    const pct=score*20;
    return `<div><div class="flex items-center justify-between text-sm"><span>${escapeHtml(name)}</span><span class="font-mono text-primary">${score}/5</span></div><div class="mt-1 h-1.5 rounded-full bg-surface-container-lowest overflow-hidden"><div class="skill-bar h-full bg-primary rounded-full" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

function wireActions(route,progress,targetRole,mission){
  const btn=document.getElementById('completeMissionBtn');
  btn?.addEventListener('click',()=>{
    const current=Meet2Progress.getCurrentIndex(route, progress);
    if(current===-1) return;

    const checks=[...document.querySelectorAll('[data-mission-check]')];
    const checked=checks.filter(x=>x.checked).length;
    if(checked<Math.max(1,checks.length-1)){
      showToast('Complete at least two mission checks before closing the mission.');
      return;
    }

    Meet2API.completeMission({
      mission_id: mission?.id || `local_${route.id}_${current}`,
      route_id: route.id,
      milestone_id: current,
      milestone_count: route.milestones.length,
      target_role: targetRole,
      title: route.milestones[current].title,
      checks_completed: checks.map(x=>x.checked),
      completed: true
    }).then(()=>{
      showToast(`✓ ${route.milestones[current].title} completed. Shared journey progress updated.`);
      setTimeout(()=>location.reload(),450);
    }).catch(error=>{
      console.error('[Meet2] Mission completion failed', error);
      showToast('Could not save mission completion.');
    });
  });

  document.getElementById('sandboxBtn')?.addEventListener('click',()=>showToast('Practice sandbox placeholder — connect your real editor here later.'));
  document.getElementById('copilotSend')?.addEventListener('click',()=>handleCopilot(route,progress));
  document.getElementById('copilotInput')?.addEventListener('keydown',e=>{if(e.key==='Enter') handleCopilot(route,progress);});
}

async function handleCopilot(route,progress){
  const input=document.getElementById('copilotInput'); const out=document.getElementById('copilotResponse');
  const q=input?.value.trim(); if(!q) return;
  out.classList.remove('hidden');
  out.textContent='Thinking with your journey context…';
  const currentIndex=Meet2Progress.getCurrentIndex(route, progress);
  try{
    const result=await Meet2API.askCopilot({
      question:q,
      context:{
        profile:readJSON('meet2_student_profile',{}),
        targetRole:document.getElementById('targetRole')?.textContent || 'Career Explorer',
        route,
        progress:{...progress,total:route.milestones.length,current_index:currentIndex},
        currentMilestone:currentIndex>=0?route.milestones[currentIndex]:null
      }
    });
    out.textContent=result?.answer || 'No guidance returned yet.';
  }catch(error){
    console.error('[Meet2] Mission Co-Pilot failed',error);
    out.textContent='Co-Pilot is temporarily unavailable.';
  }
}

function showToast(message){ const t=document.getElementById('toast'); if(!t) return; t.textContent=message; t.classList.add('toast-visible'); setTimeout(()=>t.classList.remove('toast-visible'),2800); }
