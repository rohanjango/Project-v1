/* Meet 2 — Step 11 Progress Dashboard
 * Reads the same unified local state used by Roadmap + Daily Mission.
 * No new progress state is invented here.
 */
(function(){
  'use strict';

  const state = {
    profile: null,
    route: null,
    progress: null,
    currentIndex: -1
  };

  function readJSON(key, fallback){
    try{ const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
  }

  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }

  function missionFor(route,current,index){
    if(!current) return {mission:'All route milestones are complete. Review your proof-of-work or continue iterating on your existing artifacts.',done:[],nextCheck:'Next check: route target',time:'Done',xp:0};
    const title=current.title || 'Current milestone';
    const t=title.toLowerCase();
    let mission=`Turn “${title}” into one concrete proof-of-work artifact you can show, review, or iterate on today.`;
    let done=['Spend one focused session on the milestone.','Create one tangible artifact or verified result.','Write one sentence describing what you learned.'];
    let time='30m';
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
    return {mission,done,nextCheck:`Next check: ${route.milestones[index + 1]?.title || 'Route completion'}`,time,xp:150+index*50};
  }

  async function loadContext(){
    state.profile=readJSON('meet2_student_profile',{});
    const selected=readJSON('meet2_selected_route',null);
    const role=state.profile?.goal?.targetRole || 'Career Explorer';
    if(!selected){
      state.route=null; state.progress=null; state.currentIndex=-1; return;
    }
    let roadmap = window.Meet2API?.getStoredRoadmap?.() || null;
    if(!roadmap && window.Meet2API?.getRoutes){
      try{
        const response = await window.Meet2API.getRoutes(state.profile);
        roadmap = window.Meet2API.saveGeneratedRoadmap?.(response, response?.source || 'backend') || response;
      }catch(error){
        console.error('[Meet2] Progress roadmap retrieval failed', error);
      }
    }
    if(!roadmap && typeof mockGenerateRoadmap==='function') roadmap=mockGenerateRoadmap(state.profile);
    state.route=roadmap?.paths?.find(p=>p.id===selected) || null;
    if(state.route){
      state.progress=Meet2Progress.load(state.route.id,state.route.milestones.length);
      state.currentIndex=Meet2Progress.getCurrentIndex(state.route,state.progress);
    }
    setText('goal-chip',`Goal: ${role}`);
  }

  function renderHero(){
    const p=state.profile||{};
    const route=state.route;
    const progress=state.progress;
    const total=route?.milestones?.length||0;
    const completed=progress?.completed?.length||0;
    const pct=total?Math.round(completed/total*100):0;
    const xp=(progress?.completed||[]).reduce((sum,i)=>sum+150+i*50,0);
    const role=p?.goal?.targetRole || 'Career Explorer';
    const routeName=route?.name || 'No route selected';
    const phase=total===0?'DIAGNOSTIC PENDING':completed>=total?'ROUTE COMPLETE':`MILESTONE ${Math.max(1,state.currentIndex+1)} / ${total}`;

    setText('student-name','Rohan');
    setText('welcome-name','Rohan');
    setText('target-role',role);
    setText('active-route',routeName);
    setText('velocity-value',`${completed} / ${total}`);
    setText('velocity-note',completed===1?'milestone completed': 'milestones completed');
    setText('xp-value',String(xp));
    setText('phase-badge',phase);
    setText('macro-count',`${completed} / ${total} milestones unlocked`);
    setText('macro-pct',`${pct}% Complete`);
    setText('macro-bar','');
    const bar=document.getElementById('macro-bar'); if(bar) bar.style.width=`${pct}%`;
    const updated=progress?.updatedAt ? new Date(progress.updatedAt) : null;
    setText('updated-at',updated && !Number.isNaN(updated.valueOf()) ? `Updated ${updated.toLocaleString()}` : 'State: local');

    const rail=document.getElementById('milestone-rail');
    if(rail){
      rail.innerHTML=route?.milestones?.map((m,i)=>{
        const done=progress.completed.includes(i);
        const current=i===state.currentIndex;
        return `<span class="flex items-center justify-center gap-1 ${done?'text-tertiary font-semibold':''} ${current?'text-primary font-semibold':''}"><span class="w-1.5 h-1.5 rounded-full ${done?'bg-tertiary':current?'bg-primary animate-pulse':'bg-surface-container-highest'}"></span>${escapeHtml(m.title)}</span>`;
      }).join('') || '<span class="col-span-full text-outline">Complete the diagnostic and select a route.</span>';
    }
  }

  function renderMission(){
    const route=state.route, progress=state.progress, index=state.currentIndex;
    if(!route || !progress){
      setText('mission-node','// WAITING');
      setText('mission-title','Select a route to start');
      setText('mission-time','—');
      setText('mission-progress-label','0%');
      document.getElementById('mission-progress-bar').style.width='0%';
      setText('mission-scale','[░░░░░░░░░░]');
      setText('mission-next-check','Next check: —');
      setText('mission-task','Complete the diagnostic and select one route to generate a mission.');
      return;
    }
    if(index<0){
      setText('mission-node','// ROUTE COMPLETE');
      setText('mission-title','Route complete — no mission pending');
      setText('mission-time','Done');
      setText('mission-progress-label','100%');
      document.getElementById('mission-progress-bar').style.width='100%';
      setText('mission-scale','[██████████]');
      setText('mission-next-check','Next check: Route target');
      setText('mission-task','You completed every milestone on this route. Use the roadmap to review your proof-of-work.');
      return;
    }
    const current=route.milestones[index];
    const mission=missionFor(route,current,index);
    const checks=Meet2Progress.getMissionChecks(progress,index);
    const doneCount=checks.filter(Boolean).length;
    const pct=Math.round(doneCount/mission.done.length*100);
    setText('mission-node',`// NODE 0${index+1}_MISSION`);
    setText('mission-title',current.title);
    setText('mission-time',mission.time);
    setText('mission-progress-label',`${pct}%`);
    document.getElementById('mission-progress-bar').style.width=`${pct}%`;
    const bars=Math.round(pct/10); setText('mission-scale','['+'█'.repeat(bars)+'░'.repeat(10-bars)+']');
    setText('mission-next-check',mission.nextCheck);
    setText('mission-task',mission.mission);
  }

  function renderNext(){
    const route=state.route, index=state.currentIndex;
    if(!route){
      setText('next-title','No next milestone'); setText('next-detail','Complete the diagnostic and choose a route.'); setText('next-index','Milestone queue unavailable'); return;
    }
    const next=index>=0?route.milestones[index+1]||null:null;
    if(index<0){
      setText('next-status','Route complete');
      setText('next-title','No next milestone');
      setText('next-detail','The selected route is complete.');
      setText('next-index','All milestones verified');
      return;
    }
    if(!next){
      setText('next-status','Final milestone');
      setText('next-title','Complete the current milestone');
      setText('next-detail','This is the last node on the selected route.');
      setText('next-index',`Milestone ${index+1} of ${route.milestones.length}`);
      return;
    }
    setText('next-status','Queued');
    setText('next-title',next.title); setText('next-detail',next.detail);
    setText('next-index',`Unlocks after milestone ${index+1}`);
  }

  function renderSkills(){
    const skills=state.profile?.skills||{};
    const names=['Python / Programming','Mathematics','Problem Solving','Communication','Design / Creativity','Leadership'];
    const box=document.getElementById('skills-list');
    box.innerHTML=names.map(name=>{
      const score=Math.max(0,Math.min(5,Number(skills[name]??0)));
      const pct=score*20;
      return `<div class="skill-row"><div class="flex items-center justify-between text-sm"><span class="font-medium">${escapeHtml(name)}</span><span class="font-mono text-primary font-semibold">${score}/5</span></div><div class="skill-track"><div class="skill-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
  }

  function renderHeatmap(){
    const total=state.route?.milestones?.length||0;
    const completed=state.progress?.completed||[];
    const grid=document.getElementById('heatmap'); if(!grid) return;
    const cells=28;
    grid.innerHTML=Array.from({length:cells},(_,i)=>{
      const milestoneIndex=i%Math.max(1,total);
      let level=0;
      if(total>0 && completed.includes(milestoneIndex)) level=3;
      else if(total>0 && completed.length>0 && i<completed.length*2) level=1;
      const current=state.currentIndex>=0 && milestoneIndex===state.currentIndex && i<total*7;
      return `<div class="activity-cell" data-level="${level}" data-current="${current}"></div>`;
    }).join('');
    setText('proof-total',`${completed.length} MILESTONES`);
    const last=state.progress?.lastCompletedMission;
    const lastDate=last?.completedAt ? new Date(last.completedAt) : null;
    setText('last-verified',last?.title ? (lastDate && !Number.isNaN(lastDate.valueOf()) ? `${last.title} • ${lastDate.toLocaleDateString()}` : last.title) : 'No milestone yet');
  }

  function renderProofStream(){
    const box=document.getElementById('proof-stream'); if(!box) return;
    const last=state.progress?.lastCompletedMission;
    if(!last){
      box.innerHTML='<div class="p-4 rounded-xl bg-surface-container text-sm text-on-surface-variant">No verified milestone has been recorded yet. Your proof stream will appear here after the first completion.</div>';
      return;
    }
    const completed=state.progress.completed||[];
    const date=last.completedAt ? new Date(last.completedAt) : null;
    const when=date && !Number.isNaN(date.valueOf()) ? date.toLocaleString() : 'Recorded locally';
    box.innerHTML=`<div class="proof-item"><div class="absolute left-3.5 top-8 bottom-[-22px] w-0.5 bg-surface-container-highest"></div><div class="proof-icon bg-primary/20 text-primary ring-4 ring-surface-container-low"><span class="material-symbols-outlined text-[14px]">done_all</span></div><div class="flex flex-col"><div class="flex items-center gap-2"><span class="font-mono text-xs text-primary font-bold">${escapeHtml(when)}</span><span class="text-[11px] text-tertiary bg-surface-container-highest px-1.5 py-0.5 rounded">+${150+(Math.max(0,last.index||0)*50)} XP</span></div><p class="text-sm text-on-surface mt-1">Completed milestone: <span class="font-medium text-secondary">${escapeHtml(last.title)}</span>.</p><p class="text-xs text-outline mt-1">Verified milestone count: ${completed.length}</p></div></div>`;
  }

  async function handleCopilot(){
    const input=document.getElementById('ai-input-field');
    const tray=document.getElementById('ai-response-tray');
    const out=document.getElementById('ai-response-text');
    const q=input?.value.trim(); if(!q) return;
    const current=state.route && state.currentIndex>=0?state.route.milestones[state.currentIndex]:null;
    out.textContent='Thinking with your journey context…';
    tray.classList.remove('hidden');
    try{
      const result=await Meet2API.askCopilot({
        question:q,
        context:{
          profile:state.profile || {},
          targetRole:state.profile?.goal?.targetRole || 'Career Explorer',
          route:state.route,
          progress:{...(state.progress||{}),total:state.route?.milestones?.length||0,current_index:state.currentIndex},
          currentMilestone:current
        }
      });
      out.textContent=result?.answer || 'No guidance returned yet.';
    }catch(error){
      console.error('[Meet2] Progress Co-Pilot failed',error);
      out.textContent='Co-Pilot is temporarily unavailable.';
    }
  }

  function wire(){
    document.getElementById('quick-prompt-btn')?.addEventListener('click',()=>{ const input=document.getElementById('ai-input-field'); input.value='What should I do next?'; handleCopilot(); });
    document.getElementById('submit-prompt-btn')?.addEventListener('click',handleCopilot);
    document.getElementById('ai-input-field')?.addEventListener('keydown',e=>{if(e.key==='Enter') handleCopilot();});
  }

  document.addEventListener('DOMContentLoaded',async ()=>{
    await loadContext();
    renderHero();
    renderMission();
    renderNext();
    renderSkills();
    renderHeatmap();
    renderProofStream();
    wire();
  });
})();
