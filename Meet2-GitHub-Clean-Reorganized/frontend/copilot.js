/* Meet 2 — Step 15 AI Co-pilot
 * One reusable UI layer. Real backend later: POST /api/copilot via api-client.js.
 */
(function(){
  'use strict';

  function readJSON(key, fallback){
    try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; }
  }
  function escapeHtml(v){ return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

  function getContext(){
    const profile = readJSON('meet2_student_profile', {});
    const selectedRouteId = localStorage.getItem('meet2_selected_route') || null;
    let roadmap = readJSON('meet2_generated_roadmap', null);
    if(!roadmap && typeof window.mockGenerateRoadmap === 'function'){
      try { roadmap = window.mockGenerateRoadmap(profile); } catch(e) { roadmap = null; }
    }
    const paths = Array.isArray(roadmap?.paths) ? roadmap.paths : [];
    const route = paths.find(p=>p.id===selectedRouteId) || paths[0] || null;
    let progress = null;
    let currentMilestone = null;
    if(route && window.Meet2Progress){
      progress = Meet2Progress.load(route.id, route.milestones?.length || 0);
      const index = Meet2Progress.getCurrentIndex(route, progress);
      currentMilestone = index >= 0 ? route.milestones[index] : null;
      progress = {...progress, total: route.milestones?.length || 0, current_index:index};
    }
    return {
      profile,
      targetRole: profile?.goal?.targetRole || roadmap?.targetRole || 'Career Explorer',
      route,
      progress,
      currentMilestone,
      mission: null
    };
  }

  function ensureMount(){
    if(document.getElementById('meet2-copilot-shell')) return;
    const launcher = document.createElement('button');
    launcher.type='button';
    launcher.id='meet2-copilot-launcher';
    launcher.className='meet2-copilot-launcher';
    launcher.innerHTML='<span class="material-symbols-outlined">auto_awesome</span><span class="copilot-label">Meet 2 Co-Pilot</span><span class="copilot-state"></span>';

    const shell=document.createElement('div');
    shell.id='meet2-copilot-shell';
    shell.className='meet2-copilot-shell';
    shell.setAttribute('aria-hidden','true');
    shell.innerHTML=`
      <div class="meet2-copilot-backdrop" data-copilot-close="true"></div>
      <section class="meet2-copilot-panel" role="dialog" aria-modal="true" aria-labelledby="copilotTitle">
        <div class="copilot-head">
          <div class="copilot-brand">
            <div class="copilot-icon"><span class="material-symbols-outlined">auto_awesome</span></div>
            <div><div class="copilot-title" id="copilotTitle">Meet 2 AI Co-Pilot</div><div class="copilot-subtitle">Journey-aware guidance // <span id="copilotApiState">MOCK API</span></div></div>
          </div>
          <button class="copilot-close" type="button" aria-label="Close Co-Pilot" data-copilot-close="true"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="copilot-context">
          <div class="copilot-context-chip"><div class="copilot-context-label">Goal</div><div class="copilot-context-value" id="copilotGoal">Career Explorer</div></div>
          <div class="copilot-context-chip"><div class="copilot-context-label">Route</div><div class="copilot-context-value" id="copilotRoute">Not selected</div></div>
          <div class="copilot-context-chip"><div class="copilot-context-label">Current node</div><div class="copilot-context-value" id="copilotMilestone">Start here</div></div>
          <div class="copilot-context-chip"><div class="copilot-context-label">Progress</div><div class="copilot-context-value" id="copilotProgress">0 verified</div></div>
        </div>
        <div class="copilot-body">
          <div class="copilot-welcome" id="copilotWelcome">Ask about your route, current milestone, daily mission, progress, or next step. The co-pilot uses the journey context currently available in the browser.</div>
          <div class="copilot-suggestions" id="copilotSuggestions"></div>
          <div class="copilot-response" id="copilotResponse" hidden><div class="copilot-response-meta">JourneyAI guidance</div><div id="copilotResponseText"></div></div>
        </div>
        <div class="copilot-foot">
          <form class="copilot-input-row" id="copilotForm">
            <input class="copilot-input" id="copilotInput" autocomplete="off" placeholder="Ask about your journey…" aria-label="Ask Meet 2 Co-Pilot" />
            <button class="copilot-send" id="copilotSend" type="submit" aria-label="Send question"><span class="material-symbols-outlined">arrow_upward</span></button>
          </form>
          <div class="copilot-status" id="copilotStatus"></div>
        </div>
      </section>`;
    document.body.appendChild(launcher);
    document.body.appendChild(shell);

    launcher.addEventListener('click', ()=>open());
    shell.addEventListener('click',(e)=>{ if(e.target?.dataset?.copilotClose==='true') close(); });
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && shell.classList.contains('is-open')) close(); });
    document.getElementById('copilotForm').addEventListener('submit', async (e)=>{ e.preventDefault(); await ask(); });
    window.addEventListener('meet2:copilot-open', ()=>open());
  }

  function renderContext(context){
    const route=context.route;
    const completed=context.progress?.completed?.length || 0;
    const total=context.progress?.total || route?.milestones?.length || 0;
    document.getElementById('copilotGoal').textContent=context.targetRole || 'Career Explorer';
    document.getElementById('copilotRoute').textContent=route?.name || 'Not selected';
    document.getElementById('copilotMilestone').textContent=context.currentMilestone?.title || (route ? 'Route target reached' : 'Start with Diagnostic');
    document.getElementById('copilotProgress').textContent=`${completed}${total ? ` / ${total}` : ''} verified`;
    const api=window.Meet2API?.getConfig?.();
    const apiState=document.getElementById('copilotApiState');
    if(apiState) apiState.textContent=api?.useMockApi===false ? 'LIVE API' : 'MOCK API';

    const suggestions=[
      'What should I do next?',
      'Why does this milestone matter?',
      'Make me a simple weekly plan'
    ];
    const box=document.getElementById('copilotSuggestions');
    if(box){
      box.innerHTML=suggestions.map(q=>`<button class="copilot-suggestion" type="button" data-question="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');
      box.querySelectorAll('[data-question]').forEach(btn=>btn.addEventListener('click',()=>{ document.getElementById('copilotInput').value=btn.dataset.question; ask(); }));
    }
  }

  async function ask(){
    const input=document.getElementById('copilotInput');
    const question=input?.value.trim();
    if(!question) return;
    const send=document.getElementById('copilotSend');
    const status=document.getElementById('copilotStatus');
    const responseBox=document.getElementById('copilotResponse');
    const responseText=document.getElementById('copilotResponseText');
    send.disabled=true; status.textContent='Thinking with your journey context…';
    const context=getContext();
    renderContext(context);
    try{
      const result=await window.Meet2API.askCopilot({question,context});
      responseText.textContent=result?.answer || 'I could not generate guidance for that question yet.';
      responseBox.hidden=false;
      status.textContent=result?.source==='mock' ? 'LOCAL DEMO RESPONSE • REAL LLM ENDPOINT CAN REPLACE THIS' : 'LIVE JOURNEYAI RESPONSE';
    }catch(error){
      console.error('[Meet2] Co-Pilot request failed',error);
      responseText.textContent='The Co-Pilot could not reach its guidance service. Your journey state is safe; try again in a moment.';
      responseBox.hidden=false;
      status.textContent='Request failed';
    }finally{ send.disabled=false; input.focus(); }
  }

  function open(){
    ensureMount();
    const shell=document.getElementById('meet2-copilot-shell');
    shell.classList.add('is-open'); shell.setAttribute('aria-hidden','false');
    renderContext(getContext());
    setTimeout(()=>document.getElementById('copilotInput')?.focus(),40);
  }
  function close(){
    const shell=document.getElementById('meet2-copilot-shell'); if(!shell) return;
    shell.classList.remove('is-open'); shell.setAttribute('aria-hidden','true');
  }

  window.Meet2CoPilot={open,close,refresh:()=>{ ensureMount(); renderContext(getContext()); }};
  window.openDiagnosticCoPilot=open;

  document.addEventListener('DOMContentLoaded',()=>ensureMount());
})();
