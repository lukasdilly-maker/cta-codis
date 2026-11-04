/* CTA CODIS — affectation manuelle des CIS par commune. Aucune affectation par défaut. */
(function(){
'use strict';
if(window.__ctaManualCoverageInstalled)return;
window.__ctaManualCoverageInstalled=true;
const STORAGE='cta-codis-manual-coverage-v1';
let data={};
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))data=saved}catch(e){console.warn('Affectations non récupérées',e)}
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const communeName=p=>p&&(p.nom||p.NOM||p.name||p.NAME||p.libelle||p.LIBELLE||p.commune||p.COMMUNE||p.nom_commune||p.NOM_COM||p.NOM_COMMUNE||p.libgeo||p.LIBGEO);
const communeCode=p=>p&&(p.code||p.CODE||p.insee||p.INSEE||p.code_insee||p.CODE_INSEE||p.code_commune||p.INSEE_COM||p.id);
const keyFor=p=>{const name=communeName(p);if(!name)return '';return String(communeCode(p)||normalize(name))};
const colorFor=key=>{const first=data[key]?.first;if(!first)return '#9ba9b9';let h=0;for(const ch of String(first))h=(h*31+ch.charCodeAt(0))>>>0;return 'hsl('+(h%360)+' 67% 51%)'};
const stations=()=>{const raw=typeof window.__ctaCoverageStations==='function'?window.__ctaCoverageStations():[];return (Array.isArray(raw)?raw:[]).filter(x=>x&&x.id!=null).map(x=>({id:String(x.id),name:String(x.name||x.callsign||x.id)})).sort((a,b)=>a.name.localeCompare(b.name,'fr'))};
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(data))}catch(e){console.error('Sauvegarde des affectations impossible',e);alert('Impossible de sauvegarder les affectations sur ce navigateur.')}repaint()}
function repaint(){
 const map=window.__ctaCoverageMap;
 if(!map||typeof map.eachLayer!=='function')return;
 map.eachLayer(function walk(layer){
  if(layer.eachLayer&&!layer.feature){layer.eachLayer(walk);return}
  const p=layer.feature?.properties;const k=keyFor(p);
  if(!k||typeof layer.setStyle!=='function')return;
  const first=data[k]?.first;
  layer.setStyle({color:first?colorFor(k):'#9ba9b9',weight:first?2.4:1,fillColor:first?colorFor(k):'#9ba9b9',fillOpacity:first?.length?.25:.09});
 });
}
const dialog=document.createElement('dialog');dialog.id='ctaCoverageDialog';
dialog.style.cssText='width:min(540px,94vw);max-height:90vh;overflow:auto;border:1px solid #47789a;border-radius:14px;background:#10253b;color:#edf7ff;padding:22px;box-shadow:0 16px 50px #0009';
dialog.innerHTML='<form method="dialog"><button type="submit" style="float:right;background:#29465c;color:white;border:0;border-radius:5px;padding:6px 10px;cursor:pointer">✕</button><h2 id="ctaCoverageTitle" style="margin:0 0 8px">Affectation des départs</h2><p style="font-size:12px;color:#b4cde0">Aucune caserne n’est attribuée automatiquement. Une commune sans 1er appel reste non affectée.</p></form><div id="ctaCoverageFields"></div><div style="display:flex;gap:8px;margin-top:16px"><button id="ctaCoverageSave" style="flex:1;padding:10px;background:#1677b8;color:white;border:0;border-radius:7px;cursor:pointer">Enregistrer</button><button id="ctaCoverageClear" style="padding:10px;background:#713346;color:white;border:0;border-radius:7px;cursor:pointer">Effacer</button></div>';
(document.body||document.documentElement).append(dialog);
let currentKey='';
function open(p){
 const k=keyFor(p);if(!k)return;
 currentKey=k;dialog.querySelector('#ctaCoverageTitle').textContent='Départs — '+communeName(p);
 const st=stations(),record=data[k]||{},fields=dialog.querySelector('#ctaCoverageFields');
 fields.replaceChildren();
 const opts=(value)=>'<option value="">— Aucun CIS —</option>'+st.map(s=>'<option value="'+esc(s.id)+'"'+(String(value||'')===s.id?' selected':'')+'>'+esc(s.name)+'</option>').join('');
 for(const [field,label] of [['first','1er appel'],['second','2e appel'],['third','3e appel'],['fourth','4e appel']]){
  const row=document.createElement('label');row.style.cssText='display:block;margin:12px 0;font-size:13px';
  row.innerHTML='<strong>'+label+'</strong><select data-coverage="'+field+'" style="display:block;width:100%;margin-top:5px;padding:10px;background:#18344d;color:white;border:1px solid #53708a;border-radius:7px">'+opts(record[field])+'</select>';
  fields.append(row);
 }
 const group=document.createElement('fieldset');group.style.cssText='border:1px solid #53708a;border-radius:8px;margin-top:12px;max-height:180px;overflow:auto';
 group.innerHTML='<legend>Renforts — plusieurs CIS possibles</legend>'+(st.length?st.map(s=>'<label style="display:block;padding:5px"><input type="checkbox" data-coverage-renfort="'+esc(s.id)+'" '+((record.renfort||[]).map(String).includes(s.id)?'checked':'')+'> '+esc(s.name)+'</label>').join(''):'Aucun CIS enregistré');
 fields.append(group);
 if(!st.length){const p=document.createElement('p');p.textContent='Créez d’abord un CIS dans Bâtiments pour pouvoir l’affecter.';fields.append(p)}
 if(!dialog.open)dialog.showModal();
}
dialog.querySelector('#ctaCoverageSave').addEventListener('click',()=>{
 if(!currentKey)return;
 const record={};for(const field of ['first','second','third','fourth'])record[field]=dialog.querySelector('[data-coverage="'+field+'"]').value;
 record.renfort=Array.from(dialog.querySelectorAll('[data-coverage-renfort]:checked'),e=>e.getAttribute('data-coverage-renfort'));
 const selected=[record.first,record.second,record.third,record.fourth].filter(Boolean);
 if(new Set(selected).size!==selected.length){alert('Un même CIS ne peut pas occuper plusieurs rangs d’appel.');return}
 if(selected.length||record.renfort.length)data[currentKey]=record;else delete data[currentKey];
 save();dialog.close();
});
dialog.querySelector('#ctaCoverageClear').addEventListener('click',()=>{if(!currentKey)return;delete data[currentKey];save();dialog.close()});
function captureMap(map){if(!map||map===window.__ctaCoverageMap)return;window.__ctaCoverageMap=map;setTimeout(repaint,100);map.on('layeradd',()=>setTimeout(repaint,0))}
function handleClick(map,e){
 captureMap(map);
 const original=e?.originalEvent?.target;
 let target=original,layer=null;
 while(target&&target!==map.getContainer()){if(map._targets&&target._leaflet_id&&map._targets[target._leaflet_id]){layer=map._targets[target._leaflet_id];break}target=target.parentNode}
 const p=layer?.feature?.properties;
 if(communeName(p))setTimeout(()=>open(p),0);
}
function install(){
 if(!window.L?.Map?.prototype)return false;
 const proto=L.Map.prototype;
 if(!proto.__ctaCoveragePatched){
  const original=proto._fireDOMEvent;
  if(typeof original==='function')proto._fireDOMEvent=function(e,type,targets){if(type==='click')try{handleClick(this,e)}catch(error){console.warn('Sélection commune',error)}return original.apply(this,arguments)};
  const oldAdd=proto.addLayer;
  proto.addLayer=function(layer){const result=oldAdd.apply(this,arguments);captureMap(this);if(layer?.feature?.properties&&communeName(layer.feature.properties))setTimeout(repaint,0);return result};
  proto.__ctaCoveragePatched=true;
 }
 return true;
}
if(!install()){let attempts=0;const timer=setInterval(()=>{if(install()||++attempts>60)clearInterval(timer)},500)}
window.__ctaCoverage={get:()=>JSON.parse(JSON.stringify(data)),open,refresh:repaint};
})();
