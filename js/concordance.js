import {context} from './index.js';
export const hitKey=hit=>(hit.analysisId?hit.analysisId+':':'')+hit.lineKey+':'+hit.start+':'+hit.end;
export function orderHits(hits,sort='document',words=8) {
  const result=[...hits],cache=new Map(),ctx=h=>{if(!cache.has(h))cache.set(h,context(h,words));return cache.get(h);};
  const tie=(a,b)=>a.line.order-b.line.order||a.start-b.start||a.end-b.end;
  if(sort==='left')result.sort((a,b)=>ctx(a).left.split(/\s+/).reverse().join(' ').localeCompare(ctx(b).left.split(/\s+/).reverse().join(' '))||tie(a,b));
  if(sort==='right')result.sort((a,b)=>ctx(a).right.localeCompare(ctx(b).right)||tie(a,b));
  return result;
}
function appendContext(cell,parts) {
  parts.forEach((part,i)=>{
    if(i)cell.append(document.createTextNode(' '));
    const span=document.createElement('span');span.textContent=part.text;span.dataset.lineKey=part.lineKey;
    if(!part.sameLine){span.className='other-line';span.dataset.tooltip='Contexte provenant d’une autre ligne';}
    cell.append(span);
  });
}
export function markSelected(body,key) {
  for(const row of body.children)row.classList.toggle('selected-occurrence',row.dataset.hitKey===key);
}
export function renderConcordance(body,hits,{offset=0,limit=50,words=8,onSelect,selectedKey='',showImages=false,viewer}={}) {
  body.replaceChildren();const fragment=document.createDocumentFragment();
  for(const hit of hits.slice(offset,offset+limit)) {
    const c=context(hit,words),row=document.createElement('tr');row.dataset.hitKey=hitKey(hit);row.className='kwic-row';
    const left=document.createElement('td');left.className='kwic-left';appendContext(left,c.leftParts);row.append(left);
    const term=document.createElement('td');term.className='kwic-term';term.textContent=hit.text||'∅';
    if(hit.start===hit.end)term.dataset.tooltip='Correspondance de longueur nulle à la position '+hit.start;
    const activate=()=>onSelect(hit);
    term.tabIndex=0;term.setAttribute('role','button');term.setAttribute('aria-label','Voir cette occurrence sur le fac-similé');term.onclick=activate;term.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    if(hit.regexMatch){const m=hit.regexMatch,info={match:m.text,sourceRange:[hit.start,hit.end],matchRange:[m.start,m.end],captures:m.captures,groups:m.groups,indices:m.indices?{ranges:[...m.indices],groups:m.indices.groups}:undefined};term.dataset.tooltip=JSON.stringify(hit.analyticAttribute?{attribute:hit.analyticAttribute,captures:m.captures,groups:m.groups,indices:m.indices}:info);}
    row.append(term);
    const right=document.createElement('td');right.className='kwic-right';appendContext(right,c.rightParts);row.append(right);
    const source=document.createElement('td'),button=document.createElement('button');button.className='source-link';
    button.textContent=hit.line.page.name.replace(/^FRAC34172_CC138_/,'').replace(/\.xml$/,'')+' · '+hit.line.id.replace('eSc_line_','');
    button.dataset.tooltip=hit.line.zone+' · confiance de l’export: '+(hit.line.confidence??'absente')+' · ouvrir le fac-similé';
    button.onclick=activate;source.append(button);row.append(source);fragment.append(row);
    if(hit.analysisRecord){
      const detail=document.createElement('tr');detail.className='analysis-detail';detail.dataset.hitKey=hitKey(hit);const cell=document.createElement('td');cell.colSpan=4;
      const label=document.createElement('span');label.textContent=(hit.analysisState.analysis==='current'?'':'À réexaminer · ')+JSON.stringify(hit.analysisRecord.analysis);cell.append(label);
      if(hit.targetsResolved.length>1){const fragments=document.createElement('div');fragments.className='analysis-fragments';for(const target of hit.targetsResolved){const b=document.createElement('button');b.className='source-link';b.textContent=target.text+' → '+target.line.page.name+' · '+target.line.id;b.onclick=()=>onSelect({...target,analysisId:hit.analysisId});fragments.append(b);}cell.append(fragments);}
      detail.append(cell);fragment.append(detail);
    }
    if(showImages&&viewer){
      const imageRow=document.createElement('tr');imageRow.className='thumbnail-row';imageRow.dataset.hitKey=hitKey(hit);
      const imageCell=document.createElement('td');imageCell.colSpan=4;for(const target of hit.targetsResolved||[hit])imageCell.append(viewer.thumbnail(target.line,()=>onSelect(hit.analysisId?{...target,analysisId:hit.analysisId}:hit)));imageRow.append(imageCell);fragment.append(imageRow);
    }
  }
  body.append(fragment);markSelected(body,selectedKey);
}
