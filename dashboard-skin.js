(function(){
'use strict';
if(window.__ctaDashboardInstalled)return;window.__ctaDashboardInstalled=true;
const $=id=>document.getElementById(id);
const nav=document.querySelector('body>nav[role="tablist"]');
const room=$('roomPanel'),mapPanel=$('mapPanel'),mapSection=mapPanel?.querySelector('.map-section'),mapLayout=mapPanel?.querySelector('.cartography');
if(!nav||!room||!mapSection||!mapLayout)return;
const icons={room:'⌂',map:'▧',training:'◇',calls:'☎',operations:'▣',fleet:'▰',buildings:'▥',guard:'☷',personnel:'♟',finance:'◉',journal:'≡'};
for(const b of nav.querySelectorAll('[data-tab]')){b.dataset.ctaIcon=icons[b.dataset.tab]||'•'}
const header=document.querySelector('body>header');
const shell=document.createElement('div');shell.id='ctaDashboardShell';
header.insertAdjacentElement('afterend',shell);
shell.append(nav);
const mainArea=document.createElement('div');mainArea.id='ctaMainArea';shell.append(mainArea);
const stats=document.createElement('div');stats.id='ctaStats';
const specs=[
['●','Centre opérationnel','ctaStatus','OCCUPÉ','green'],
['◉','Crédits','credits','',''],['▣','Billets','tickets','',''],['▥','Niveau','level','',''],['♟','Effectif disponible','staffCount','',''],
['♨','Réseau radio','ctaRadio','Initialisé','amber'],['☎','Appels en attente','ctaPending','0','red'],['▰','Interventions en cours','ctaActive','0','green']];
for(const [icon,label,id,fallback,tone] of specs){
 const card=document.createElement('div');card.className='cta-stat '+tone;
 card.innerHTML='<span class="cta-stat-icon">'+icon+'</span><div><small>'+label+'</small><strong></strong></div>';
 card.querySelector('strong').id='ctaValue-'+id;
 card.querySelector('strong').textContent=fallback||'—';stats.append(card);
}
mainArea.append(stats);

// Operational radio inbox: blinking indicator, acknowledgement and persistent local read state.
// Events are observed from the real intervention log; no fictitious messages are generated.
(function(){
 const widget=document.createElement('div');widget.id='ctaRadioInbox';
 widget.innerHTML='<button type="button" id="ctaRadioAlert" aria-label="Messages radio" aria-expanded="false"><span class="cta-radio-symbol">◉</span><span>Messages radio</span><span id="ctaRadioUnread" hidden>0</span></button><section id="ctaRadioPanel" hidden><div class="cta-radio-head"><strong>Trafic radio</strong><button type="button" id="ctaRadioClose" aria-label="Fermer">✕</button></div><div id="ctaRadioMessages"></div></section>';
 stats.insertAdjacentElement('afterend',widget);
 const button=widget.querySelector('#ctaRadioAlert'),panel=widget.querySelector('#ctaRadioPanel'),list=widget.querySelector('#ctaRadioMessages'),count=widget.querySelector('#ctaRadioUnread');
 const seen=new Set(),messages=[],acknowledged=new Set();
 let initialized=false;
 function classify(text){
  const t=String(text||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
  if(/renfort|demande de moyens|moyens supplementaires/.test(t))return 'renfort';
  if(/bilan|compte.rendu|situation sur les lieux|point de situation/.test(t))return 'bilan';
  if(/urgent|prioritaire|detresse|mayday/.test(t))return 'urgent';
  return null;
 }
 function render(){
  const unread=messages.filter(m=>!acknowledged.has(m.key));
  const urgent=unread.some(m=>m.type==='urgent'),renfort=unread.some(m=>m.type==='renfort');
  button.classList.toggle('has-unread',unread.length>0);
  button.dataset.level=urgent?'urgent':renfort?'renfort':'bilan';
  count.hidden=!unread.length;count.textContent=String(unread.length);
  list.replaceChildren();
  if(!messages.length){const p=document.createElement('p');p.className='cta-radio-empty';p.textContent='Aucun message radio reçu pour le moment.';list.append(p);return}
  for(const m of messages.slice().reverse().slice(0,60)){
   const row=document.createElement('div');row.className='cta-radio-message '+m.type+(acknowledged.has(m.key)?' read':'');
   const content=document.createElement('div');const title=document.createElement('strong');
   title.textContent=(m.type==='renfort'?'Demande de renfort':m.type==='urgent'?'Message prioritaire':'Bilan reçu')+' · Intervention n°'+m.incident;
   const body=document.createElement('p');body.textContent=m.text;
   content.append(title,body);row.append(content);
   const ack=document.createElement('button');ack.type='button';ack.textContent=acknowledged.has(m.key)?'Acquitté':'Acquitter';ack.disabled=acknowledged.has(m.key);
   ack.onclick=()=>{acknowledged.add(m.key);render()};row.append(ack);list.append(row);
  }
 }
 function addMessage(msg){
  if(seen.has(msg.key))return;
  seen.add(msg.key);messages.push(msg);if(messages.length>150)messages.shift();render();
 }
 function check(){
  const data=window.__ctaOperationsData?.();if(!data||!Array.isArray(data.incidents))return;
  const found=[];
  for(const i of data.incidents){
   for(let n=0;n<(i.logs||[]).length;n++){
    const log=i.logs[n];
    const content=typeof log==='string'?log:[log?.text,log?.message,log?.detail,log?.nature,log?.status].filter(Boolean).join(' ');
    const type=classify(content);if(!type)continue;
    const key=String(i.id)+':'+n+':'+content;
    found.push({key,incident:i.id,text:content,type});
   }
  }
  // Do not blink for historic messages when the dashboard first opens.
  if(!initialized){for(const m of found)seen.add(m.key);initialized=true;render();return}
  for(const m of found)addMessage(m);
 }
 button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden))};
 widget.querySelector('#ctaRadioClose').onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false')};
 window.addEventListener('message',e=>{
  if(e.source!==window.parent&&e.source!==window)return;
  const d=e.data;if(d?.type!=='cta-radio-message'||!d.text)return;
  const type=classify(d.text)||'bilan';
  addMessage({key:String(d.id||Date.now()+':'+d.text),incident:d.incident||'—',text:String(d.text),type});
 });
 setInterval(()=>{try{check()}catch(e){console.warn('CTA radio inbox',e)}},1500);
 render();
})();
const workspace=document.createElement('div');workspace.id='ctaWorkspace';mainArea.append(workspace);
const toolbars=[...document.querySelectorAll('body>.toolbar')];
const notice=document.querySelector('body>#notice');
const tools=document.createElement('div');tools.id='ctaTools';toolbars.forEach(t=>tools.append(t));if(notice)tools.append(notice);
mainArea.append(tools);
const dashboard=document.createElement('div');dashboard.id='ctaDashboard';
workspace.append(dashboard);
const left=document.createElement('div');left.id='ctaDashboardLeft';
const right=document.createElement('div');right.id='ctaDashboardRight';
dashboard.append(left,right);
left.append(room);
const mapCard=document.createElement('section');mapCard.id='ctaMapCard';
mapCard.innerHTML='<div class="cta-card-head"><h2>▧ Cartographie opérationnelle</h2><button id="ctaOpenMap" type="button">Ouvrir la carte ↗</button></div>';
right.append(mapCard);
mapCard.append(mapSection);
const bottom=document.createElement('div');bottom.id='ctaDashboardBottom';workspace.append(bottom);
const callCard=document.createElement('section');callCard.className='cta-mini-card';callCard.innerHTML='<h3>☎ Derniers appels</h3><div id="ctaCallsSummary">Aucun appel récent</div>';
const fleetCard=document.createElement('section');fleetCard.className='cta-mini-card';fleetCard.innerHTML='<h3>▰ Moyens disponibles</h3><div id="ctaFleetSummary">—</div><button id="ctaFleetOpen">Voir les moyens</button>';
const multiCard=document.createElement('section');multiCard.className='cta-mini-card';multiCard.innerHTML='<h3>♟ Coopération multijoueur <span class="cta-online">● En ligne</span></h3><p>Demandes de renfort et coordination des joueurs.</p><button id="ctaMultiOpen">Ouvrir la console</button>';
bottom.append(callCard,fleetCard,multiCard);
$('ctaOpenMap').onclick=()=>$('tab-map')?.click();
$('ctaFleetOpen').onclick=()=>$('tab-fleet')?.click();
$('ctaMultiOpen').onclick=()=>parent.postMessage({type:'cta-open-console'},'*');
for(const panel of document.querySelectorAll('body>main[role="tabpanel"]')){if(panel!==room)workspace.append(panel)}
// Unified simulation bar: move native controls (preserving original handlers and state).
const ctaSimulationControls=document.createElement('div');
ctaSimulationControls.id='ctaSimulationControls';
const ctaSimulationLabel=document.createElement('strong');
ctaSimulationLabel.textContent='Simulation';
ctaSimulationControls.append(ctaSimulationLabel);
function moveNativeControl(id,target){
 const input=$(id);if(!input)return;
 const label=input.closest('label');
 if(label)target.append(label);else target.append(input);
}
moveNativeControl('speed',ctaSimulationControls);
moveNativeControl('auto',ctaSimulationControls);
const ctaSettingsButton=document.createElement('button');
ctaSettingsButton.type='button';ctaSettingsButton.id='ctaSettingsToggle';
ctaSettingsButton.textContent='⚙ Paramètres';
ctaSettingsButton.setAttribute('aria-expanded','false');
ctaSimulationControls.append(ctaSettingsButton);
const ctaSettingsPanel=document.createElement('div');
ctaSettingsPanel.id='ctaSettingsPanel';
ctaSettingsPanel.hidden=true;
const ctaSettingsTitle=document.createElement('strong');
ctaSettingsTitle.textContent='Paramètres de la simulation';
ctaSettingsPanel.append(ctaSettingsTitle);
const ctaSettingsGroups=[
 ['Gestion',()=>{const box=document.createElement('div');box.className='cta-settings-group';const title=document.createElement('h3');title.textContent='Gestion de partie';box.append(title);for(const bar of toolbars){if(bar.querySelector('#profileSelect')||bar.querySelector('[data-action="new-profile"]')){while(bar.firstChild)box.append(bar.firstChild);}}return box;}],
 ['Trafic',()=>{const box=document.createElement('div');box.className='cta-settings-group';const title=document.createElement('h3');title.textContent='Trafic et alertes';box.append(title);for(const id of ['trafficBadge','traffic','popup'])moveNativeControl(id,box);const create=tools.querySelector('[data-action="new-call"]');if(create)box.append(create);return box;}],
 ['Conditions',()=>{const box=document.createElement('div');box.className='cta-settings-group';const title=document.createElement('h3');title.textContent='Conditions de simulation';box.append(title);for(const id of ['simulationInfo','weather','school','environment'])moveNativeControl(id,box);return box;}]
];
for(const [,factory] of ctaSettingsGroups)ctaSettingsPanel.append(factory());
ctaSettingsButton.onclick=()=>{
 ctaSettingsPanel.hidden=!ctaSettingsPanel.hidden;
 ctaSettingsButton.setAttribute('aria-expanded',String(!ctaSettingsPanel.hidden));
 ctaSettingsButton.textContent=ctaSettingsPanel.hidden?'⚙ Paramètres':'✕ Fermer les paramètres';
};
mainArea.insertBefore(ctaSimulationControls,workspace);
mainArea.insertBefore(ctaSettingsPanel,workspace);
const operations=document.createElement('section');operations.id='ctaOperations';operations.innerHTML='<div class="cta-card-head"><h2>▦ Synthèse du centre</h2><button id="ctaOperationsOpen">Voir les opérations ↗</button></div><div id="ctaOperationsContent" class="cta-summary-grid"><div class="cta-summary-item"><small>▥ Bâtiments</small><strong id="ctaSumBuildings">—</strong></div><div class="cta-summary-item"><small>▰ Engins</small><strong id="ctaSumVehicles">—</strong></div><div class="cta-summary-item"><small>♟ Personnels</small><strong id="ctaSumStaff">—</strong></div><div class="cta-summary-item"><small>● Engins disponibles</small><strong id="ctaSumReady">—</strong></div><div class="cta-summary-item"><small>▣ Engins engagés</small><strong id="ctaSumEngaged">—</strong></div><div class="cta-summary-item"><small>☎ Interventions actives</small><strong id="ctaSumIncidents">—</strong></div></div><div class="cta-summary-note" id="ctaSumTerritory">Données de la partie active</div>';
left.append(operations);$('ctaOperationsOpen').onclick=()=>$('tab-operations')?.click();
const actions=document.createElement('div');actions.className='cta-quick-actions';actions.innerHTML='<button type="button" id="ctaGoCalls">☎ Gérer les appels</button><button type="button" id="ctaGoFleet">▰ Consulter les moyens</button>';
operations.insertBefore(actions,$('ctaOperationsContent'));
$('ctaGoCalls').onclick=()=>$('tab-calls')?.click();
$('ctaGoFleet').onclick=()=>$('tab-fleet')?.click();
// Synoptic attached to the actual tab panel, even when its ID differs.
(function(){
 let attached=false;
 function attach(){
  if(attached)return;
  const button=nav.querySelector('[data-tab="fleet"]');
  const candidates=[...workspace.querySelectorAll('main[role="tabpanel"]')];
  const panel=candidates.find(el=>el.id==='fleetPanel'||el.id==='tab-fleet'||el.getAttribute('aria-labelledby')===button?.id)
   ||candidates.find(el=>/synoptique global des moyens/i.test(el.textContent||''))
   ||(button&&document.getElementById(button.getAttribute('aria-controls')||''));
  if(!panel)return;
  attached=true;
  const originals=[...panel.children];
  const wrapper=document.createElement('div');
  wrapper.id='ctaSynopticWrapper';
  wrapper.style.cssText='display:flex;flex-direction:column;width:100%;height:100%;min-height:520px;gap:6px';
  const frame=document.createElement('iframe');
  frame.id='ctaSynopticFrame';frame.title='Synoptique opérationnelle des moyens';
  frame.src=new URL('synoptique-test.html?embedded=1',parent.location.href).href;
  frame.style.cssText='width:100%;height:100%;flex:1 1 auto;min-height:460px;border:0;background:#081525;border-radius:6px';
  wrapper.append(frame);
  panel.append(wrapper);
  for(const node of originals)node.style.display='none';
  wrapper.style.display='flex';
  setInterval(()=>{
   try{
    if(!frame.isConnected||typeof window.__ctaSynopticData!=='function')return;
    const data=window.__ctaSynopticData();
    if(data)frame.contentWindow?.postMessage({type:'cta-synoptic-live',data},location.origin);
   }catch(e){console.warn('CTA synoptique :',e)}
  },1500);
 }
 nav.querySelector('[data-tab="fleet"]')?.addEventListener('click',()=>setTimeout(attach,80));
 setTimeout(attach,250);
})();
// Renommage de la synoptique embarquée : valider l'origine et transmettre au moteur.
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='cta-synoptic-rename-vehicle')return;
 const frame=document.getElementById('ctaSynopticFrame');
 if(!frame||event.source!==frame.contentWindow)return;
 const id=Number(event.data.id),name=String(event.data.name||'').trim();
 if(!Number.isFinite(id)||!name||name.length>60)return;
 if(window.__ctaRenameSynopticVehicle?.(id,name)!==true)console.warn('CTA : renommage synoptique non disponible',id);
});
// Real operations: compact cards built from the live game snapshot. Native treatment remains available.
(function(){
 const panel=$('operationsPanel'),native=$('operationsList');
 if(!panel||!native)return;
 const container=document.createElement('div');container.id='ctaRealOperations';container.style.cssText='margin-top:10px';
 native.insertAdjacentElement('beforebegin',container);
 const css=document.createElement('style');css.textContent=`
 #ctaRealOperations .op-card{background:#10263d;color:#eaf3fc;border:1px solid #34536d;border-radius:6px;margin:0 0 8px;overflow:hidden}
 #ctaRealOperations .op-head{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:10px 12px;font-size:12px}
 #ctaRealOperations .op-id{font-weight:800;color:#36d3c4;font-size:14px}
 #ctaRealOperations .op-head button{border:0;background:transparent;color:#c7deef;padding:3px 6px;cursor:pointer}
 #ctaRealOperations .op-head button:hover{background:#20435f}
 #ctaRealOperations .op-head .op-expand{margin-left:auto;border:1px solid #466987;border-radius:4px}
 #ctaRealOperations .op-body{padding:4px 12px 10px}
 #ctaRealOperations .op-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-top:1px solid #36536d;padding:5px}
 #ctaRealOperations .op-station{background:#168e88;color:white;border-radius:3px;min-width:88px;text-align:center;padding:5px;font-size:11px;font-weight:700}
 #ctaRealOperations .op-unit{border-radius:3px;padding:6px 10px;font-size:11px;font-weight:700}
 #ctaRealOperations .op-log{border-top:1px solid #36536d;padding:9px 12px;font-size:12px}
 #ctaRealOperations .op-log p{margin:5px 0}
 #ctaRealOperations .op-sub{font-size:11px;color:#9dbbd1;padding:4px}
 `;document.head.append(css);
 let collapsed=new Set(),logsOpen=new Set(),last='';
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const status=v=>{
  if(v.fault)return ['#050505','#fff','Indisponible'];
  const s=v.status;
  if(s==='ready')return ['#10842c','#fff','Disponible'];
  if(s==='planning')return ['#fff','#111','Alerté'];
  if(['enroute','routing_detour','roadblock','road_wait'].includes(s))return ['#ff4248','#111','Parti'];
  if(['operation','onscene','awaiting_hospital','awaiting_release'].includes(s))return ['#ff4248','#fff','Sur les lieux'];
  if(s==='return')return ['#087c22','#ff0','En retour'];
  if(['transport','routing_hospital'].includes(s))return ['#0023a5','#fff','Transport CH'];
  if(s==='hospital')return ['#0023a5','#ff0','Arrivée CH'];
  return ['#050505','#fff',s||'Indisponible'];
 };
 function update(){
  if(panel.hidden)return;
  const data=window.__ctaOperationsData?.();if(!data)return;
  const active=data.incidents.filter(i=>!i.closed);
  const sig=JSON.stringify(active.map(i=>[i.id,i.phase,i.units,i.logs.length,...i.units.map(id=>{const v=data.vehicles.find(v=>String(v.id)===String(id));return v?.status})]));
  if(sig===last)return;last=sig;
  native.style.display='none';
  const existing=[...native.querySelectorAll('details')];
  container.innerHTML=active.map(i=>{
   const old=existing.find(d=>d.querySelector('summary')?.textContent?.includes('#'+i.id+' ·'));
   const summary=old?.querySelector('summary')?.textContent||('#'+i.id+' · '+i.scenario);
   const title=summary.replace(/^#[^·]+·\s*/,'').replace(/\s+—\s+[^—]*$/,'');
   const grouped=new Map();
   for(const id of i.units){const v=data.vehicles.find(v=>String(v.id)===String(id));if(!v)continue;const b=data.stations.find(b=>String(b.id)===String(v.station));const key=b?.id||'other';if(!grouped.has(key))grouped.set(key,{name:b?.callsign||b?.name||'Autres moyens',vs:[]});grouped.get(key).vs.push(v)}
   const rows=[...grouped.values()].map(g=>'<div class="op-row"><span class="op-station" title="'+safe(g.name)+'">'+safe(g.name)+'</span>'+g.vs.map(v=>{const [bg,fg,label]=status(v);return '<span class="op-unit" style="background:'+bg+';color:'+fg+'" title="'+safe(label)+'">'+safe(v.name)+'</span>'}).join('')+'</div>').join('');
   const history=i.logs.slice().reverse().map(l=>'<p><strong>'+new Date(l.at).toLocaleTimeString('fr-FR')+'</strong> · '+safe(l.text)+'</p>').join('');
   return '<div class="op-card" data-incident="'+safe(i.id)+'"><div class="op-head"><span class="op-id">⚙ '+safe(i.id)+'</span><button data-act="open" title="Ajouter des moyens ou services en renfort">⊞</button><button data-act="log" title="Main courante de l’intervention">◷</button><span>◉ '+safe(i.phase)+'</span><span>◉ '+safe(title)+'</span><span>♧ '+safe(i.address)+'</span><button class="op-expand" data-act="fold">'+(collapsed.has(String(i.id))?'▾ Déplier':'▴ Replier')+'</button></div><div class="op-body" style="'+(collapsed.has(String(i.id))?'display:none':'')+'">'+(rows||'<div class="op-sub">Aucun moyen engagé</div>')+'</div><div class="op-log" style="'+(logsOpen.has(String(i.id))?'':'display:none')+'"><strong>Main courante</strong>'+(history||'<p>Aucun événement</p>')+'</div></div>';
  }).join('')||'<p>Aucune intervention active.</p>';
 }
 container.addEventListener('click',e=>{
  const btn=e.target.closest('[data-act]'),card=e.target.closest('[data-incident]');if(!btn||!card)return;
  const id=card.dataset.incident,act=btn.dataset.act;
  if(act==='fold'){collapsed.has(id)?collapsed.delete(id):collapsed.add(id);last='';update()}
  if(act==='log'){logsOpen.has(id)?logsOpen.delete(id):logsOpen.add(id);last='';update()}
  if(act==='open'){const d=[...native.querySelectorAll('details')].find(x=>x.querySelector('summary')?.textContent?.includes('#'+id+' ·'));d?.querySelector('[data-action="treat-incident"]')?.click()}
 });
 setInterval(()=>{try{update()}catch(e){console.warn('CTA operations real',e)}},1200);
 nav.querySelector('[data-tab="operations"]')?.addEventListener('click',()=>setTimeout(()=>{last='';update()},100));
})();
const menu=document.createElement('div');menu.id='ctaSidebarExtra';menu.innerHTML='<button id="ctaCoopNav">♟ &nbsp; Coopération</button><button id="ctaOrsecNav">♧ &nbsp; ORSEC</button><button id="ctaAdminNav">⚙ &nbsp; Administration</button>';nav.append(menu);
$('ctaCoopNav').onclick=()=>$('ctaMultiOpen').click();
$('ctaOrsecNav').onclick=()=>document.querySelector('[data-action="orsec"]')?.click();
$('ctaAdminNav').onclick=()=>document.querySelector('[data-action="admin-reset"]')?.click();
const brand=header.querySelector('.brand');if(brand)brand.querySelector('h1')?.insertAdjacentHTML('beforeend',' <span class="cta-test-pill">MULTIJOUEUR — TEST</span>');
const session=document.createElement('div');session.id='ctaSession';session.innerHTML='<span id="ctaSessionName">Centre opérationnel</span><button id="ctaSessionLogout">Déconnexion</button>';header.append(session);
$('ctaSessionLogout').onclick=()=>parent.postMessage({type:'cta-logout'},'*');
function update(){
 for(const id of ['credits','tickets','level','staffCount']){const source=$(id),dest=$('ctaValue-'+id);if(source&&dest)dest.textContent=source.textContent}
 const active=$('activeCount')?.textContent||'—';if($('ctaValue-ctaActive'))$('ctaValue-ctaActive').textContent=active;
 const callItems=$('callsList')?.querySelectorAll('.alert-card')||[];
 $('ctaValue-ctaPending').textContent=String(callItems.length);
 $('ctaCallsSummary').textContent=Array.from(callItems).slice(0,3).map(x=>x.textContent.replace(/\s+/g,' ').trim().slice(0,95)).join(' · ')||'Aucun appel en attente';
 $('ctaFleetSummary').textContent=$('staffCount')?.textContent||'—';
 let game=null;
 try{const profiles=JSON.parse(localStorage.getItem('cta15-profiles-v4')||'null');game=profiles?.games?.[profiles.active]||null}catch(e){}
 let live=null;try{live=typeof window.__ctaLiveStats==='function'?window.__ctaLiveStats():null}catch(error){console.warn('CTA statistiques indisponibles',error)}
 if(live){
 $('ctaSumBuildings').textContent=live.buildings.toLocaleString('fr-FR');
 $('ctaSumVehicles').textContent=live.vehicles.toLocaleString('fr-FR');
 $('ctaSumStaff').textContent=live.staff.toLocaleString('fr-FR');
 $('ctaSumReady').textContent=live.ready.toLocaleString('fr-FR');
 $('ctaSumEngaged').textContent=live.engaged.toLocaleString('fr-FR');
 $('ctaSumIncidents').textContent=live.incidents.toLocaleString('fr-FR');
 $('ctaSumTerritory').textContent='Données synchronisées avec le centre';
 }else if(game){
 const stations=Array.isArray(game.stations)?game.stations:[];
 const vehicles=Array.isArray(game.vehicles)?game.vehicles:[];
 const personnel=Array.isArray(game.staff)?game.staff:[];
 const incidents=Array.isArray(game.incidents)?game.incidents.filter(i=>!i.closed):[];
 const ready=vehicles.filter(v=>v.status==='ready'&&!v.mission&&!v.fault).length;
 const engaged=vehicles.filter(v=>!!v.mission||v.status==='engaged').length;
 $('ctaSumBuildings').textContent=stations.length.toLocaleString('fr-FR');
 $('ctaSumVehicles').textContent=vehicles.length.toLocaleString('fr-FR');
 $('ctaSumStaff').textContent=personnel.length.toLocaleString('fr-FR');
 $('ctaSumReady').textContent=ready.toLocaleString('fr-FR');
 $('ctaSumEngaged').textContent=engaged.toLocaleString('fr-FR');
 $('ctaSumIncidents').textContent=incidents.length.toLocaleString('fr-FR');
 $('ctaSumTerritory').textContent='Données actualisées depuis la partie active';
 }else{
 for(const id of ['ctaSumBuildings','ctaSumVehicles','ctaSumStaff','ctaSumReady','ctaSumEngaged','ctaSumIncidents'])$(id).textContent='—';
 $('ctaSumTerritory').textContent='Données indisponibles — liaison au moteur à vérifier';
 }
 const selected=nav.querySelector('[aria-selected="true"]')?.dataset.tab||'room';
 const home=selected==='room';dashboard.hidden=!home;bottom.hidden=!home;stats.hidden=!home;tools.hidden=!home;
 // Keep the cartography exclusively in the dedicated Map tab; the operations room is statistics-only.
 if(home&&mapSection.parentElement!==mapLayout){mapLayout.prepend(mapSection)}
 if(selected==='map'&&mapSection.parentElement!==mapLayout){mapLayout.prepend(mapSection);window.dispatchEvent(new Event('resize'))}
 if(home&&window.__ctaLastHome!==home)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));window.__ctaLastHome=home;
}
nav.addEventListener('click',()=>setTimeout(update,60));
new MutationObserver(()=>setTimeout(update,50)).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
// Independent, fault-isolated summary refresh: never depends on dashboard update().
function refreshSummary(){
 try{
  let data=typeof window.__ctaLiveStats==='function'?window.__ctaLiveStats():null;
  if(!data){
   const saved=JSON.parse(localStorage.getItem('cta15-profiles-v4')||'null');
   const g=saved?.games?.[saved.active];
   if(g){const v=g.vehicles||[];data={buildings:(g.stations||[]).length,vehicles:v.length,staff:(g.staff||[]).length,ready:v.filter(x=>x.status==='ready'&&!x.mission&&!x.fault).length,engaged:v.filter(x=>!!x.mission||x.status==='engaged').length,incidents:(g.incidents||[]).filter(x=>!x.closed).length}}
  }
  const ids={buildings:'ctaSumBuildings',vehicles:'ctaSumVehicles',staff:'ctaSumStaff',ready:'ctaSumReady',engaged:'ctaSumEngaged',incidents:'ctaSumIncidents'};
  if(!data){$('ctaSumTerritory').textContent='Connexion aux données du jeu indisponible';return}
  for(const [key,id] of Object.entries(ids)){const el=$(id);if(el)el.textContent=Number(data[key]??0).toLocaleString('fr-FR')}
  $('ctaSumTerritory').textContent='Synchronisation : '+(typeof window.__ctaLiveStats==='function'?'moteur de jeu':'sauvegarde locale');
 }catch(e){console.error('CTA: erreur synthèse',e);const el=$('ctaSumTerritory');if(el)el.textContent='Erreur de synchronisation : '+e.message}
}
setInterval(refreshSummary,2000);
setTimeout(refreshSummary,200);
setInterval(()=>{try{update()}catch(e){console.error('CTA: tableau de bord',e)}},3000);
try{update()}catch(e){console.error('CTA: tableau de bord initial',e)}

})();