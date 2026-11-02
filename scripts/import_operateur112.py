#!/usr/bin/env python3
"""Generate complete deduplicated mission natures from Operateur112's public listing."""
import html as htmlmod
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

URL="https://www.operateur112.fr/einsaetze"
class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows=[];self.row=None;self.cell=None;self.link=False
    def handle_starttag(self, tag, attrs):
        if tag=="tr": self.row=[] 
        if tag in ("td","th") and self.row is not None: self.cell=[]
    def handle_data(self, data):
        if self.cell is not None: self.cell.append(data)
    def handle_endtag(self,tag):
        if tag in ("td","th") and self.cell is not None and self.row is not None:
            self.row.append(" ".join(" ".join(self.cell).split()));self.cell=None
        if tag=="tr" and self.row is not None:
            if len(self.row)>=5:self.rows.append(self.row)
            self.row=None
def classify(name,category):
    s=(name+" "+category).lower()
    if re.search(r"maintien de l'ordre|manifestation|émeute|crs|gendarmerie mobile",s):return "POL",{ "POL":2 },"ORDRE"
    if re.search(r"police|gign|vol |agression|otage|stupéfiant|détenu|mandat|tapage|rixe|contrôle routier",s):return "POL",{"POL":1},"POLICE"
    if re.search(r"nautique|océanique|côtière|noyade|naufrage|bateau|navire|plongeur|surfeur",s):return "DIV",{"DIV":1},"NAUTIQUE"
    if re.search(r"ambulanci|secours|malaise|chute|douleur|convulsion|blessure|victime|crise|arrêt cardio|fièvre",s):return "SUAP",{"SUAP":1},"SUAP"
    if re.search(r"chimique|radiolog|pollution|déversement|gaz toxique|nucléaire",s):return "TECH",{"RISK":1},"RISK"
    if re.search(r"accident|carambolage|collision|désincarcération",s):return "SR",{"SR":1,"SUAP":1},"SR"
    if re.search(r"incendie|feu|explosion|fumée|embrasement",s):return "INC",{"INC":1},"INC"
    return "DIV",{"DIV":1},"DIV"
req=urllib.request.Request(URL,headers={"User-Agent":"CTA-CODIS-Catalogue/1.0 (public mission list)"})
with urllib.request.urlopen(req,timeout=45) as response: raw=response.read().decode("utf-8")
parser=Parser();parser.feed(raw)
seen=set();rows=[]
for cells in parser.rows:
    # Typical columns: image, mission name, point of interest, credits, conditions, categories, details.
    if len(cells)<5:continue
    name=cells[1] if len(cells)>=6 else cells[0]
    name=re.sub(r"\\s+"," ",name).strip()
    if not name or name.lower() in ("nom de mission","détails","details"):continue
    key=re.sub(r"[^a-z0-9]+"," ",__import__("unicodedata").normalize("NFKD",name).encode("ascii","ignore").decode().lower()).strip()
    if key in seen:continue
    seen.add(key)
    category_text=" ".join(cells[-2:])
    cat,needs,family=classify(name,category_text)
    rows.append({"name":name,"category":cat,"needs":needs,"family":family})
if len(rows)<90:raise SystemExit(f"Unexpected catalogue size ({len(rows)}); refusing to replace file")
script="""/* Automatically generated from Operateur112 public mission listing; distinct natures only. */
(function(){
const source=DATA;
const norm=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const existing=new Set(SCENARIOS.map(s=>norm(s.name)));let added=0;
for(let n=0;n<source.length;n++){const s=source[n],key=norm(s.name);if(existing.has(key))continue;existing.add(key);
SCENARIOS.push({id:'cta-o112-'+String(n+1).padStart(4,'0'),category:s.category,name:s.name,text:'Appel au 18/112 : '+s.name+'. Le requérant demande une intervention.',needs:{...s.needs},credits:1500,xp:80,minutes:30,service:s.category==='INC'?'INCENDIE':s.category==='SUAP'?'SECOURS':'OPERATIONS',transport:s.category==='SUAP',message:'Compte rendu transmis au CTA.',family:s.family});added++}
window.__ctaOperateur112={added,total:SCENARIOS.length,source:source.length};
})();"""
Path("scenario-operateur112.js").write_text(script.replace("DATA",json.dumps(rows,ensure_ascii=False,separators=(",",":"))),encoding="utf-8")
print(f"Generated {len(rows)} unique mission natures")
