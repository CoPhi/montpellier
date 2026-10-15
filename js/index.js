const TOKEN_PATTERN=/[\p{L}\p{N}\p{M}\p{Co}⁊]+(?:[’'][\p{L}\p{N}\p{M}\p{Co}]+)*/gu;
export function normalize(text,{ignoreCase=true,ignoreDiacritics=false}={}) {
  let value=text.normalize('NFC');
  if(ignoreCase)value=value.toLowerCase();
  if(ignoreDiacritics)value=value.normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC');
  return value;
}
export function tokenize(text) {return [...text.matchAll(TOKEN_PATTERN)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));}
export function buildIndex(model,options={}) {
  const postings=new Map(),forms=new Map(),byLine=new Map(),groups=new Map(),lineGroups=new Map();let total=0;
  for(const line of model.lines) {
    const key=line.page.name+'#'+line.zone;
    if(!groups.has(key))groups.set(key,{lines:[],stream:[]});
    const group=groups.get(key),lineIndex=group.lines.length,lineTokens=[];
    group.lines.push(line);lineGroups.set(line.key,{group,lineIndex});
    for(const token of tokenize(line.text)) {
      const term=normalize(token.text,options),occurrence={...token,term,lineKey:line.key,line,position:group.stream.length,stream:group.stream,group,lineIndex};
      group.stream.push(occurrence);lineTokens.push(occurrence);
      if(!postings.has(term))postings.set(term,[]);
      if(!forms.has(token.text))forms.set(token.text,[]);
      postings.get(term).push(occurrence);forms.get(token.text).push(occurrence);total++;
    }
    byLine.set(line.key,lineTokens);
  }
  return {postings,forms,byLine,groups,lineGroups,lines:model.lines,total,options};
}
export function filterHits(hits,{zone='',minimumConfidence=null}={}) {
  if(zone)hits=hits.filter(h=>h.line.zone===zone);
  if(minimumConfidence!==null)hits=hits.filter(h=>h.line.confidence!==null && h.line.confidence>=minimumConfidence);
  return hits.sort((a,b)=>a.line.order-b.line.order||a.start-b.start||a.end-b.end);
}
export function search(index,query,filters={}) {
  const q=normalize(query.trim(),index.options);
  if(!q)return [];
  const hits=filters.mode==='prefix'?[...index.postings.entries()].filter(([k])=>k.startsWith(q)).flatMap(([,v])=>v):[...(index.postings.get(q)||[])];
  return filterHits(hits,filters);
}
function lowerBound(stream,predicate) {
  let lo=0,hi=stream.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(predicate(stream[mid]))lo=mid+1;else hi=mid;}
  return lo;
}
function partsBetween(hit,first,last,start,end) {
  const parts=[];
  for(let i=first;i<=last;i++) {
    const line=hit.group.lines[i],text=line.text.slice(i===first?start:0,i===last?end:line.text.length);
    if(text)parts.push({text,lineKey:line.key,sameLine:line.key===hit.lineKey});
  }
  return parts;
}
export function context(hit,words=8) {
  words=Math.max(0,Math.min(40,Math.floor(Number(words)||0)));
  if(!words)return {left:'',right:'',leftParts:[],rightParts:[]};
  const stream=hit.stream;
  const leftEnd=lowerBound(stream,t=>t.line.order<hit.line.order || (t.line.order===hit.line.order && t.end<=hit.start));
  const rightStart=lowerBound(stream,t=>t.line.order<hit.line.order || (t.line.order===hit.line.order && t.start<hit.end));
  const first=stream[Math.max(0,leftEnd-words)],last=stream[Math.min(stream.length-1,rightStart+words-1)];
  const leftParts=first&&leftEnd>0?partsBetween(hit,first.lineIndex,hit.lineIndex,first.start,hit.start):partsBetween(hit,hit.lineIndex,hit.lineIndex,0,hit.start);
  const rightParts=last&&rightStart<stream.length?partsBetween(hit,hit.lineIndex,last.lineIndex,hit.end,last.end):partsBetween(hit,hit.lineIndex,hit.lineIndex,hit.end,hit.line.text.length);
  const join=parts=>parts.map(p=>p.text).join(' ').trim();
  return {left:join(leftParts),right:join(rightParts),leftParts,rightParts};
}
export function vocabulary(index) {return [...index.postings].map(([term,hits])=>({term,count:hits.length})).sort((a,b)=>b.count-a.count||a.term.localeCompare(b.term));}
