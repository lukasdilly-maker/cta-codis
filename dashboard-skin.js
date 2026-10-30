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
const menu=document.createElement('div');menu.id='ctaSidebarExtra';menu.innerHTML='<button id="ctaCoopNav">♟ &nbsp; Coopération</button><button id="ctaOrsecNav">♧ &nbsp; ORSEC</button><button id="ctaAdminNav">⚙ &nbsp; Administration</button>';nav.append(menu);
$('ctaCoopNav').onclick=()=>$('ctaMultiOpen').click();
$('ctaOrsecNav').onclick=()=>document.querySelector('[data-action="orsec"]')?.click();
$('ctaAdminNav').onclick=()=>document.querySelector('[data-action="admin-reset"]')?.click();
const brand=header.querySelector('.brand');if(brand)brand.querySelector('h1')?.insertAdjacentHTML('beforeend',' <span class="cta-test-pill">MULTIJOUEUR — TEST</span>');
const session=document.createElement('div');session.id='ctaSession';session.innerHTML='<span id="ctaSessionName">Centre opérationnel</span><button id="ctaSessionLogout">Déconnexion</button>';header.append(session);
$('ctaSessionLogout').onclick=()=>parent.postMessage({type:'cta-logout'},'*');
function update(){
 for(const id of ['credits','tickets','level','staffCount']){const source=$(id),dest=$('ctaValue-'+id);if(source&&dest)dest.textContent=source.textContent}
 const active=$('activeCount')?.textContent||'—';$('ctaValue-ctaActive').textContent=active;$('ctaActiveBadge').textContent=active;
 const callItems=$('callsList')?.querySelectorAll('.alert-card')||[];
 $('ctaValue-ctaPending').textContent=String(callItems.length);
 $('ctaCallsSummary').textContent=Array.from(callItems).slice(0,3).map(x=>x.textContent.replace(/\s+/g,' ').trim().slice(0,95)).join(' · ')||'Aucun appel en attente';
 $('ctaFleetSummary').textContent=$('staffCount')?.textContent||'—';
 let game=null;
 try{const profiles=JSON.parse(localStorage.getItem('cta15-profiles-v4')||'null');game=profiles?.games?.[profiles.active]||null}catch(e){}
 const live=typeof window.__ctaLiveStats==='function'?window.__ctaLiveStats():null;
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
 $('ctaSumTerritory').textContent='Aucune partie active chargée';
 }
 const selected=nav.querySelector('[aria-selected="true"]')?.dataset.tab||'room';
 const home=selected==='room';dashboard.hidden=!home;bottom.hidden=!home;stats.hidden=!home;tools.hidden=!home;
 if(home&&mapSection.parentElement!==mapCard){mapCard.append(mapSection);window.dispatchEvent(new Event('resize'))}
 if(selected==='map'&&mapSection.parentElement!==mapLayout){mapLayout.prepend(mapSection);window.dispatchEvent(new Event('resize'))}
 if(home&&window.__ctaLastHome!==home)requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));window.__ctaLastHome=home;
}
nav.addEventListener('click',()=>setTimeout(update,60));
new MutationObserver(()=>setTimeout(update,50)).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-selected']});
setInterval(update,3000);update();
})();