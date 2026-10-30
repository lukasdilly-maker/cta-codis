(function(){
'use strict';
const icons={room:'⌂',map:'▧',training:'◈',calls:'☎',operations:'▣',fleet:'▰',buildings:'▥',guard:'☷',personnel:'♟',finance:'◉',journal:'≡'};
const nav=document.querySelector('body>nav');
if(!nav||document.getElementById('ctaQuickPanel'))return;
for(const b of nav.querySelectorAll('[data-tab]')){b.dataset.ctaIcon=icons[b.dataset.tab]||'•'}
const room=document.getElementById('roomPanel'),mapPanel=document.getElementById('mapPanel'),mapSection=mapPanel?.querySelector('.map-section');
if(!room||!mapSection)return;
const homeMap=document.createElement('section');homeMap.id='ctaHomeMap';
homeMap.innerHTML='<h2>▧ Cartographie opérationnelle</h2>';
room.append(homeMap);
const quick=document.createElement('div');quick.id='ctaQuickPanel';
quick.innerHTML='<section class="cta-widget"><h3>☎ Derniers appels</h3><div id="ctaCallsSummary" class="cta-sub">Aucun appel récent</div></section><section class="cta-widget"><h3>▰ Moyens disponibles</h3><div id="ctaFleetSummary" class="cta-value">—</div><div class="cta-sub">Consultez le synoptique pour les détails.</div><button type="button" id="ctaFleetOpen">Voir les moyens</button></section><section class="cta-widget" id="ctaMultiWidget"><h3>♟ Coopération multijoueur</h3><div class="cta-sub">Demandes de renfort et coordination entre joueurs.</div><button type="button" id="ctaMultiOpen">Ouvrir la console</button></section>';
room.append(quick);
document.getElementById('ctaFleetOpen').addEventListener('click',()=>document.getElementById('tab-fleet')?.click());
document.getElementById('ctaMultiOpen').addEventListener('click',()=>parent.postMessage({type:'cta-open-console'},'*'));
function moveMap(){
 const inRoom=!room.hidden;
 const target=inRoom?homeMap:mapPanel.querySelector('.cartography');
 if(!target)return;
 if(mapSection.parentElement!==target){
  if(inRoom)target.append(mapSection);else target.prepend(mapSection);
  window.dispatchEvent(new Event('resize'));
 }
}
const observer=new MutationObserver(moveMap);
observer.observe(room,{attributes:true,attributeFilter:['hidden']});
nav.addEventListener('click',()=>setTimeout(moveMap,50));
moveMap();
function refresh(){
 const calls=document.getElementById('callsList');
 const items=calls?.querySelectorAll('.alert-card,.activity-row,.item');
 const callBox=document.getElementById('ctaCallsSummary');
 if(callBox&&items?.length)callBox.textContent=[...items].slice(0,3).map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,85)).join(' · ');
 const fleet=document.getElementById('ctaFleetSummary');
 const available=document.querySelector('header .stat:last-child strong');
 if(fleet&&available)fleet.textContent=available.textContent;
}
setInterval(refresh,2500);refresh();
})();