/* CTA CODIS V2 — distinct operational call natures.
   Executed inside the game after SCENARIOS is initialized, before call generation.
   Existing scenarios are retained. One entry per nature; no time-of-day or contextual duplicates. */
(function(){
const templates=[
['INC','Feu d’appartement','De la fumée sort d’un appartement et des habitants sont encore dans l’immeuble.',{INC:2,EPC:1,COM:1,POLICE:1},'inc'],
['INC','Feu de maison','Une maison brûle, les flammes gagnent la toiture.',{INC:2},'inc'],
['INC','Feu de cuisine','Un feu a pris dans une cuisine et la fumée envahit le logement.',{INC:1},'inc'],
['INC','Feu de garage','Un garage attenant à une habitation est en feu.',{INC:2},'inc'],
['INC','Feu de toiture','La toiture d’un bâtiment commence à brûler.',{INC:2,EPC:1},'inc'],
['INC','Feu de cave','De la fumée remonte d’une cave dans la cage d’escalier.',{INC:2},'inc'],
['INC','Feu de commerce','De la fumée sort d’un commerce fermé.',{INC:2,EPC:1},'inc'],
['INC','Feu d’entrepôt important','Un entrepôt industriel est touché par un incendie important.',{INC:3},'major'],
['INC','Incendie industriel majeur','Des flammes et des fumées importantes sont visibles sur un site industriel.',{INC:3},'major'],
['INC','Feu de dépôt d’hydrocarbures','Un feu s’est déclaré dans une zone de stockage de carburant.',{INC:3},'major'],
['INC','Feu de véhicule','Une voiture brûle sur un parking.',{INC:1},'inc'],
['INC','Feu de poids lourd','Un camion est en feu sur la chaussée.',{INC:2},'inc'],
['INC','Feu de local poubelles','Un local poubelles brûle près des habitations.',{INC:1},'inc'],
['INC','Feu de bâtiment agricole','Un bâtiment agricole dégage une fumée noire.',{INC:2},'inc'],
['INC','Feu de parking souterrain','Un véhicule brûle dans un parking souterrain.',{INC:2},'inc'],
['INC','Feu de végétation','Un départ de feu progresse dans des broussailles.',{FDF:1},'fdf'],
['INC','Feu de forêt','Un feu se propage dans un massif forestier.',{FDF:2},'fdf'],
['INC','Feu de chaume','Un champ de chaume brûle et le vent pousse les flammes.',{FDF:1},'fdf'],
['INC','Feu de haie','Une haie brûle près de plusieurs maisons.',{FDF:1},'fdf'],
['INC','Feu de broussailles','Des broussailles brûlent en bord de route.',{FDF:1},'fdf'],
['SUAP','Malaise à domicile','Une personne se sent très mal et n’arrive plus à se lever.',{SUAP:1},'suap'],
['SUAP','Perte de connaissance','Une personne est inconsciente mais respire.',{SUAP:1},'suap'],
['SUAP','Arrêt cardiaque','Une personne ne répond plus et ne respire pas normalement.',{SUAP:1},'suap'],
['SUAP','Chute dans les escaliers','Une personne est tombée dans les escaliers et souffre beaucoup.',{SUAP:1},'suap'],
['SUAP','Accident domestique','Une personne s’est blessée avec un outil à son domicile.',{SUAP:1},'suap'],
['SUAP','Difficulté respiratoire','Une personne a beaucoup de mal à respirer.',{SUAP:1},'suap'],
['SUAP','Douleur thoracique','Une personne se plaint d’une forte douleur dans la poitrine.',{SUAP:1},'suap'],
['SUAP','Accident sportif','Un sportif est blessé et ne peut plus se relever.',{SUAP:1},'suap'],
['SUAP','Brûlure domestique','Une personne vient de se brûler avec un liquide très chaud.',{SUAP:1},'suap'],
['SUAP','Accouchement imminent','Une femme enceinte présente des contractions très rapprochées.',{SUAP:1},'suap'],
['SR','Collision entre voitures','Deux voitures se sont percutées et des personnes sont blessées.',{SR:1,SUAP:1},'sr'],
['SR','Accident avec incarcération','Une personne est coincée dans un véhicule accidenté.',{SR:1,SUAP:1},'sr'],
['SR','Accident de moto','Un motard est au sol après une collision.',{SUAP:1},'sr'],
['SR','Accident de poids lourd','Un poids lourd s’est renversé et bloque la route.',{SR:1},'sr'],
['SR','Piéton renversé','Un piéton vient d’être percuté par une voiture.',{SUAP:1},'sr'],
['SR','Sortie de route','Une voiture est sortie de la chaussée et le conducteur est blessé.',{SUAP:1},'sr'],
['SR','Accident sur autoroute','Plusieurs véhicules sont impliqués dans un accident sur autoroute.',{SR:1,SUAP:1},'sr'],
['SR','Collision vélo voiture','Un cycliste est blessé après un choc avec une voiture.',{SUAP:1},'sr'],
['POLICE','Rixe sur voie publique','Plusieurs personnes se battent dans la rue.',{POLICE:1},'police'],
['POLICE','Bagarre dans un bar','Une bagarre vient d’éclater dans un établissement.',{POLICE:1},'police'],
['POLICE','Vol avec violence','Une personne vient d’être agressée et volée.',{POLICE:1},'police'],
['POLICE','Cambriolage en cours','Des bruits suspects viennent d’un logement où personne ne devrait se trouver.',{POLICE:1},'police'],
['POLICE','Violences intrafamiliales','Des cris et des coups sont entendus dans un logement.',{POLICE:1},'police'],
['POLICE','Dégradations volontaires','Des individus endommagent des véhicules stationnés.',{POLICE:1},'police'],
['POLICE','Tapage nocturne','Un rassemblement bruyant provoque des troubles dans le quartier.',{POLICE:1},'police'],
['POLICE','Manifestation avec troubles à l’ordre public','Des affrontements collectifs surviennent pendant une manifestation.',{POLICE:1},'ordre'],
['POLICE','Émeute urbaine','Des violences collectives et des dégradations se multiplient dans le quartier.',{POLICE:1},'ordre'],
['POLICE','Maintien de l’ordre lors d’une manifestation','Un rassemblement important nécessite un dispositif de maintien de l’ordre.',{POLICE:1},'ordre'],
['DIV','Inondation de cave','Une cave est envahie par l’eau après de fortes pluies.',{DIV:1},'div'],
['DIV','Arbre sur chaussée','Un arbre est tombé sur une route.',{DIV:1},'div'],
['DIV','Bâchage de toiture','Une toiture endommagée laisse entrer la pluie.',{DIV:1},'div'],
['DIV','Fuite d’eau importante','Une canalisation a cédé et l’eau envahit les locaux.',{DIV:1},'div'],
['DIV','Dégagement de chaussée','Des matériaux bloquent la circulation.',{DIV:1},'div'],
['DIV','Animal en difficulté','Un animal est coincé dans un endroit difficile d’accès.',{DIV:1},'div'],
['DIV','Assèchement de locaux','Plusieurs locaux sont inondés après un orage.',{DIV:1},'div'],
['SANTE','Renfort médicalisé','Une équipe de secours demande une prise en charge médicalisée.',{MED:1},'medical'],
['SANTE','Urgence pédiatrique','Un enfant présente une détresse nécessitant une équipe spécialisée.',{PED:1},'medical'],
['TECH','Fuite de produit chimique','Une odeur suspecte se dégage d’un conteneur industriel.',{RISK:1},'tech'],
['TECH','Reconnaissance matières dangereuses','Un colis présente une fuite de substance inconnue.',{RISK:1},'tech'],
['DIR','Débris sur autoroute','Des débris encombrent une voie rapide.',{DIR:1},'dir'],
['DIR','Balisage d’urgence','Un obstacle dangereux nécessite un balisage sur un grand axe.',{DIR:1},'dir'],
['AP','Transfert pénitentiaire','Un transfert de détenu doit être organisé.',{AP:1},'ap'],
['AP','Renfort de sécurité pénitentiaire','Un établissement demande une équipe spécialisée de sécurisation.',{ERIS:1},'ap'],
['ADMIN','Liaison de coordination','Une liaison opérationnelle doit être assurée entre deux sites.',{ADMIN:1},'admin']
];
// Only distinct operational natures appear in call qualification menus.
// Caller wording is separate from the nature and never includes time or weather qualifiers.
const normalize=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const known=new Set(SCENARIOS.map(s=>normalize(s.name)));
let added=0;
for(let t=0;t<templates.length;t++){
 const [category,name,dialogue,needs,family]=templates[t];
 const key=normalize(name);
 if(known.has(key))continue;
 known.add(key);
 SCENARIOS.push({
  id:'cta-nature-'+String(t+1).padStart(3,'0'),
  category,name,text:dialogue,needs:{...needs},
  credits:category==='INC'?2400:category==='SUAP'?1200:1300,
  xp:category==='INC'?110:70,
  minutes:category==='INC'?35:category==='SUAP'?20:25,
  service:category==='INC'?'INCENDIE':category==='SUAP'?'SECOURS':'OPERATIONS',
  transport:category==='SUAP'||category==='SANTE',
  message:'Intervention en cours : compte rendu transmis au CTA.',
  family
 });
 added++;
}
window.__ctaScenarioCatalog={added,total:SCENARIOS.length,templates:templates.length};
})();
