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
  const toolbar=document.createElement('div');
  toolbar.style.cssText='display:flex;justify-content:flex-end;flex:0 0 auto';
  const toggle=document.createElement('button');
  toggle.type='button';toggle.textContent='Afficher les moyens classiques';
  toggle.style.cssText='background:#194e75;color:white;border:1px solid #406889;border-radius:5px;padding:7px 12px';
  toolbar.append(toggle);
  const frame=document.createElement('iframe');
  frame.id='ctaSynopticFrame';frame.title='Synoptique opérationnelle des moyens';
  frame.src=new URL('synoptique-test.html?embedded=1',parent.location.href).href;
  frame.style.cssText='width:100%;height:100%;flex:1 1 auto;min-height:460px;border:0;background:#081525;border-radius:6px';
  wrapper.append(toolbar,frame);
  panel.append(wrapper);
  let classic=false;
  function show(){
   for(const node of originals)node.style.display=classic?'':'none';
   wrapper.style.display=classic?'none':'flex';
   toggle.textContent=classic?'':'Afficher les moyens classiques';
  }
  toggle.onclick=()=>{classic=true;show()};
  const back=document.createElement('button');
  back.type='button';back.textContent='Revenir à la synoptique';
  back.style.cssText='background:#194e75;color:white;border:1px solid #406889;border-radius:5px;padding:7px 12px;margin:5px';
  back.onclick=()=>{classic=false;back.style.display='none';show()};
  panel.append(back);back.style.display='none';
  toggle.onclick=()=>{classic=true;show();back.style.display='inline-block'};
  show();
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
// Experimental industrial-fire operations view, isolated from real dispatch and saves.
(function(){
 let installed=false;
 function install(){
  if(installed)return;
  const tab=nav.querySelector('[data-tab="operations"]');
  const panels=[...workspace.querySelectorAll('main[role="tabpanel"]')];
  const panel=panels.find(el=>el.id==='operationsPanel'||el.id==='tab-operations'||el.getAttribute('aria-labelledby')===tab?.id)
    ||panels.find(el=>/opérations en cours|interventions actives|gestion des opérations/i.test(el.textContent||''))
    ||(tab&&document.getElementById(tab.getAttribute('aria-controls')||''));
  if(!panel||panel.id==='ctaOperations')return;
  installed=true;
  const original=[...panel.children];
  const controls=document.createElement('div');controls.id='ctaOperationsExperimentControls';
  controls.style.cssText='display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:9px;margin-bottom:10px';
  const label=document.createElement('span');label.textContent='Prototype feu industriel · simulation indépendante';label.style.cssText='font-size:12px;color:#aac1d4';
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Tester le nouveau suivi d’intervention';
  toggle.style.cssText='border:1px solid #447493;border-radius:6px;padding:9px 12px;background:#17618d;color:#fff';
  controls.append(label,toggle);
  const frame=document.createElement('iframe');frame.id='ctaOperationsExperimentFrame';frame.title='Simulation expérimentale feu industriel';
  frame.src=new URL('operation-feu-industriel-test.html',parent.location.href).href;
  frame.style.cssText='display:none;width:100%;height:calc(100% - 58px);min-height:560px;border:0;background:#e9eef3;border-radius:7px';
  panel.prepend(controls);panel.append(frame);
  let preview=false;
  function display(){
   for(const el of original)el.style.display=preview?'none':'';
   frame.style.display=preview?'block':'none';
   toggle.textContent=preview?'Revenir aux opérations réelles':'Tester le nouveau suivi d’intervention';
   label.textContent=preview?'Démonstration fictive — aucune opération du jeu n’est modifiée':'Prototype feu industriel · simulation indépendante';
  }
  toggle.addEventListener('click',()=>{preview=!preview;display()});
  display();
 }
 nav.querySelector('[data-tab="operations"]')?.addEventListener('click',()=>setTimeout(install,80));
 setTimeout(install,300);
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
 if(home&&mapSection.parentElement!==mapCard){mapCard.append(mapSection);window.dispatchEvent(new Event('resize'))}
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