import {digest,editMap,moveTarget} from './anchors.js';
export const getPath=(record,path)=>path.split('.').reduce((v,k)=>v&&Object.hasOwn(v,k)?v[k]:undefined,record);
export function values(value){if(Array.isArray(value))return value.flatMap(values);if(value===null||value===undefined)return [];return [typeof value==='object'?JSON.stringify(value):String(value)];}
export function parseLayer(text,name='analysis.jsonl'){
  const rows=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()).map((line,i)=>{try{return JSON.parse(line);}catch{throw new Error(`${name}: JSON invalide, enregistrement ${i+1}.`);}}),metadata=rows.shift();
  if(metadata?.recordType!=='metadata'||metadata.format!=='manuscript-analysis'||metadata.version!==1||!metadata.level?.id||!metadata.level?.label||!Array.isArray(metadata.level.fields)||metadata.anchoring?.unit!=='utf16-code-unit'||(metadata.anchoring.range!==undefined&&metadata.anchoring.range!=='half-open'))throw new Error('Métadonnées JSONL incompatibles. Voir docs/analysis-layers.md.');
  const ids=new Set();for(const [i,r] of rows.entries()){
    if(r.recordType!=='annotation'||typeof r.id!=='string'||!r.id||ids.has(r.id)||!Array.isArray(r.targets)||!r.targets.length||!r.analysis||typeof r.analysis!=='object')throw new Error(`Annotation invalide ou ID dupliqué: ${i+2}.`);ids.add(r.id);
    for(const t of r.targets)if(typeof t.lineKey!=='string'||typeof t.document!=='string'||typeof t.lineId!=='string'||t.lineKey!==`${t.document}#${t.lineId}`||!Number.isInteger(t.start)||!Number.isInteger(t.end)||t.start<0||t.end<=t.start||typeof t.quote!=='string'||typeof t.lineSha256!=='string')throw new Error(`Ancrage invalide: ${r.id}.`);
    if(r.dependencies!==undefined&&(!Array.isArray(r.dependencies)||r.dependencies.some(d=>typeof d.lineKey!=='string'||typeof d.lineSha256!=='string')))throw new Error(`Dépendances invalides: ${r.id}.`);
  }
  for(const f of metadata.level.fields)if(typeof f.path!=='string'||!f.path.startsWith('analysis.')||typeof f.label!=='string')throw new Error('Champ de métadonnées invalide.');
  return {uid:crypto.randomUUID(),name,metadata,records:rows,states:Object.fromEntries(rows.filter(r=>r.workbench?.current).map(r=>[r.id,r.workbench.current])),history:[...new Map(rows.flatMap(r=>r.workbench?.history||[]).map(e=>[JSON.stringify(e),e])).values()],view:{field:metadata.level.fields[0]?.path||'analysis.surface',value:'',mode:'exact',status:'current',context:8,sort:'document',offset:0,images:false,scroll:0}};
}
function recordHistory(layer,event,id){
 const existing=layer.history.find(e=>e.lineKey===event.lineKey&&e.before===event.before&&e.after===event.after&&e.at===event.at);
 if(existing){if(!existing.affected.includes(id))existing.affected.push(id);}else layer.history.push({...event,affected:[id]});
}
// Runtime hashes and posting maps never enter project JSON.
export async function bindLayer(layer,model,index,hashes=null){
  layer.uid ||= crypto.randomUUID();layer.name ||= layer.metadata.level.id+'.jsonl';
  hashes ||= new Map(await Promise.all(model.lines.map(async l=>[l.key,await digest(l.text)])));
  layer.states = Object.assign(Object.create(null),layer.states||{});layer.history ||= [];layer.view ||= {field:layer.metadata.level.fields[0]?.path||'analysis.surface',value:'',mode:'exact',status:'current',context:8,sort:'document',offset:0,images:false,scroll:0};
  const rows=[],byLine=new Map(),fields=new Map(layer.metadata.level.fields.map(f=>[f.path,new Map()])),documents=new Set(model.pages.map(p=>p.name));
  const chains=new Map();for(const e of model.project.edits||[]){if(!chains.has(e.line))chains.set(e.line,[]);chains.get(e.line).push(e);}
  const beforeHashes=new Map();for(const [key,events] of chains)beforeHashes.set(key,await Promise.all(events.map(e=>digest(e.before))));
  for(const record of layer.records){
    let current=layer.states[record.id];
    if(!current)current={targets:structuredClone(record.targets),analysis:record.status?.analysis||'current',anchor:'resolved',dependencyHashes:structuredClone(record.dependencies??record.targets.map(t=>({lineKey:t.lineKey,lineSha256:t.lineSha256})))};
    for(let k=0;k<current.targets.length;k++){
      const t=current.targets[k],line=model.byKey.get(t.lineKey);if(!line||t.lineSha256===hashes.get(t.lineKey))continue;
      const events=chains.get(t.lineKey)||[],from=(beforeHashes.get(t.lineKey)||[]).indexOf(t.lineSha256);
      if(from>=0){let old=events[from].before;for(const e of events.slice(from)){
        if(e.before!==old){current.targets[k].anchor='ambiguous';current.analysis='needs-review';break;}
        current.targets[k]=moveTarget(current.targets[k],editMap(e.before,e.after));if(current.targets[k].changed)current.analysis='needs-review';
        recordHistory(layer,{lineKey:t.lineKey,before:e.before,after:e.after,at:e.at},record.id);old=e.after;
      }if(old!==line.text){current.targets[k].anchor='ambiguous';current.analysis='needs-review';}}
      else {current.targets[k].anchor='ambiguous';current.analysis='needs-review';}
      current.targets[k].lineSha256=hashes.get(t.lineKey);
    }
    layer.states[record.id]=current;
    let outside=false,missing=false;
    const targets=current.targets.map(t=>{
      const line=model.byKey.get(t.lineKey);if(!line){if(!documents.has(t.document))outside=true;else missing=true;return null;}
      if(t.lineSha256!==hashes.get(t.lineKey)){t.anchor='ambiguous';current.analysis='needs-review';}
      if(t.anchor==='removed'||t.anchor==='ambiguous')return null;
      if(!Number.isInteger(t.start)||!Number.isInteger(t.end)||t.start<0||t.end<=t.start||t.end>line.text.length||line.text.slice(t.start,t.end)!==t.quote){t.anchor='ambiguous';current.analysis='needs-review';return null;}
      const g=index.lineGroups.get(line.key);return {...t,line,lineKey:line.key,text:line.text.slice(t.start,t.end),group:g.group,stream:g.group.stream,lineIndex:g.lineIndex};
    });
    for(const d of current.dependencyHashes||[]){if(!hashes.has(d.lineKey)){const doc=d.lineKey.slice(0,d.lineKey.lastIndexOf('#'));if(documents.has(doc))missing=true;else outside=true;}else if(hashes.get(d.lineKey)!==d.lineSha256)current.analysis='needs-review';}
    current.anchor=outside?'outside-subset':missing?'missing':current.targets.some(t=>t.anchor==='ambiguous')?'ambiguous':current.targets.some(t=>t.anchor==='removed')?'removed':'resolved';
    const row={record,current,targets:targets.filter(Boolean),available:!outside&&!missing&&targets.every(Boolean)};rows.push(row);
    for(const t of [...current.targets,...(current.dependencyHashes||[])]){if(!byLine.has(t.lineKey))byLine.set(t.lineKey,new Set());byLine.get(t.lineKey).add(row);}
    for(const [path,postings] of fields)for(const value of new Set(values(getPath(record,path)))){if(!postings.has(value))postings.set(value,new Set());postings.get(value).add(row);}
  }
  return {layer,rows,byLine,fields,hashes};
}
export async function bindLayers(layers,model,index){const hashes=new Map(await Promise.all(model.lines.map(async l=>[l.key,await digest(l.text)])));return Promise.all(layers.map(l=>bindLayer(l,model,index,hashes)));}
export async function propagateEdit(runtimes,lineKey,before,after){
  if(before===after)return;const map=editMap(before,after),hash=await digest(after),at=new Date().toISOString();
  for(const runtime of runtimes){const affected=[];for(const row of runtime.byLine.get(lineKey)||[]){const current=row.current;for(let i=0;i<current.targets.length;i++){const t=current.targets[i];if(t.lineKey!==lineKey)continue;const next=moveTarget(t,map);next.lineSha256=hash;current.targets[i]=next;if(next.changed)current.analysis='needs-review';}
    if((current.dependencyHashes||[]).some(d=>d.lineKey===lineKey))current.analysis='needs-review';affected.push(row.record.id);
  }if(affected.length)runtime.layer.history.push({lineKey,before,after,at,affected});}
}
export function searchLayer(runtime,{field,value='',mode='exact',status='current'}={}){
  let rows;if(!value)rows=runtime.rows;else {const posting=runtime.fields.get(field)||new Map();rows=mode==='prefix'?[...new Set([...posting].filter(([v])=>v.startsWith(value)).flatMap(([,r])=>[...r]))]:[...(posting.get(value)||[])];}
  return rows.filter(r=>r.available&&(status==='all'||r.current.analysis==='current')).map(r=>({...r.targets[0],analysisRecord:r.record,analysisState:r.current,targetsResolved:r.targets,analysisId:r.record.id})).sort((a,b)=>a.line.order-b.line.order||a.start-b.start||a.analysisId.localeCompare(b.analysisId));
}
export function layerSummary(runtime){const counts={total:runtime.rows.length,current:0,review:0,outside:0,unresolved:0};for(const r of runtime.rows){if(r.current.anchor==='outside-subset')counts.outside++;else if(!r.available)counts.unresolved++;else if(r.current.analysis!=='current')counts.review++;else counts.current++;}return counts;}
export function exportLayer(layer){return [layer.metadata,...layer.records.map(record=>({...record,workbench:{current:layer.states[record.id],history:layer.history.filter(e=>e.affected.includes(record.id))}}))].map(r=>JSON.stringify(r)).join('\n')+'\n';}
export function exportReview(runtime,model){return [runtime.layer.metadata,...runtime.rows.filter(r=>r.current.analysis!=='current'||['removed','ambiguous','missing'].includes(r.current.anchor)).map(r=>({...r.record,workbench:{current:r.current,history:runtime.layer.history.filter(e=>e.affected.includes(r.record.id)),context:r.current.targets.map(t=>({lineKey:t.lineKey,text:model.byKey.get(t.lineKey)?.text??null})),dependencies:(r.current.dependencyHashes||[]).map(d=>({lineKey:d.lineKey,text:model.byKey.get(d.lineKey)?.text??null})),request:'Reanalyse externally and return new annotations anchored to the current text.'}}))].map(r=>JSON.stringify(r)).join('\n')+'\n';}

export async function searchLayerRegex(runtime,view,engine){
 const eligible=searchLayer(runtime,{status:view.status}),byId=new Map(eligible.map(h=>[h.analysisId,h])),forms=new Map();
 for(const [value,rows] of runtime.fields.get(view.field)||[]){const hits=[...rows].map(r=>byId.get(r.record.id)).filter(Boolean).map(h=>({...h,analyticAttribute:{field:view.field,value}}));if(hits.length)forms.set(value,hits);}
 const hits=await engine.search({forms},view.value,{scope:'vocabulary',flags:view.flags??'u'});
 return [...new Map(hits.map(h=>[h.analysisId,h])).values()];
}
