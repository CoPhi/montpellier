import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {buildIndex,search,context} from '../js/index.js';
import {compileRegex,executeRegexJob,regexJob,regexHits,RegexSearch} from '../js/regex.js';
import {Viewport} from '../js/viewport.js';
import {Facsimile,lineCrop} from '../js/facsimile.js';
import {renderConcordance,markSelected,hitKey} from '../js/concordance.js';
import {importZip} from '../js/importer.js';
import {createModel} from '../js/model.js';
const root=new URL('../',import.meta.url);
const page={name:'a.xml',width:1000,height:800,imageName:'a.jpg'};
const other={name:'b.xml',width:1000,height:800,imageName:'b.jpg'};
const line=(key,text,order,source=page,zone='left',confidence=.9)=>({key,id:key,text,order,page:source,zone,confidence,bbox:[100,100,700,30],polygon:''});
const model={lines:[line('a0','Avant, hier.',0),line('a1','Été selari, probe probe ꝑ q̃.',1),line('a2','Après demain.',2,page,'left',null),line('a3','Horszone.',3,page,'right'),line('b0','Autre page selari.',4,other)]};
const index=buildIndex(model,{ignoreCase:true,ignoreDiacritics:true});
const run=(pattern,flags='gu',scope='lines',filters={})=>{const job=regexJob(index,pattern,{flags,scope});return regexHits(index,job,executeRegexJob(job),filters);};
assert.equal(search(index,'ete').length,1);
assert.equal(run('^ete$','iu','vocabulary').length,0);
assert.equal(run('^Été$','u','vocabulary').length,1);
assert.equal(run('^été$','iu','vocabulary').length,1);
assert.equal(run('probe','gu').length,2);
assert.equal(run('probe','u').length,1);
assert.equal(run('probe','gy').length,0);
assert.equal(run('(?<=selari, )probe','gu').length,1);
const repeated=run('(?<word>probe)\\s+\\k<word>','gdu')[0];
assert.equal(repeated.text,'probe probe');assert.equal(repeated.groups.word,'probe');assert.equal(repeated.captures[0],'probe');assert.deepEqual(repeated.indices.groups.word,[12,17]);
assert.ok(run('\\p{M}','gu').some(h=>h.text==='̃'));
assert.ok(run('[\\p{Script=Latin}&&\\p{Letter}]','gv').length>0);
assert.throws(()=>compileRegex('(','gu'),/invalides/);
assert.throws(()=>compileRegex('x','uv'),/invalides/);
assert.throws(()=>compileRegex('x','gg'),/invalides/);
const native=(pattern,flags,scope,subjects)=>executeRegexJob({pattern,flags,scope,subjects});
assert.deepEqual(native('(?=)','gu','lines',['😀']).map(m=>m.start),[0,2]);
assert.deepEqual(native('(?=)','g','lines',['😀']).map(m=>m.start),[0,1,2]);
assert.equal(native(' foo ','g','lines',[' foo '])[0].text,' foo ');
assert.equal(native('a.b','gs','lines',['a\nb'])[0].text,'a\nb');
assert.equal(native('^b','gm','lines',['a\nb'])[0].start,2);
for(const hit of run('probe|selari|\\p{M}','gu'))assert.equal(hit.line.text.slice(hit.start,hit.end),hit.text);
assert.equal(run('selari','gu','lines',{zone:'left',minimumConfidence:.95}).length,0);
assert.equal(run('.*','gu','lines',{minimumConfidence:0}).some(h=>h.lineKey==='a2'),false);
const hit=search(index,'selari')[0],ctx=context(hit,8);
assert.ok(ctx.leftParts.some(p=>p.lineKey==='a0'&&!p.sameLine));
assert.ok(ctx.leftParts.some(p=>p.lineKey==='a1'&&p.sameLine));
assert.ok(ctx.rightParts.some(p=>p.lineKey==='a2'&&!p.sameLine));
assert.ok(!ctx.right.includes('Horszone'));assert.ok(!ctx.right.includes('Autre page'));
assert.ok(ctx.left.includes('Avant, hier.'));assert.ok(ctx.right.includes(', probe'));
assert.deepEqual(context(hit,0).leftParts,[]);
assert.ok(context(repeated,1).left.endsWith('selari,'));
assert.ok(context(repeated,1).right.includes('ꝑ'));
const view=new Viewport(1000,800);view.zoom(2,[500,400]);assert.deepEqual(view.view,[250,200,500,400]);
view.pan(50,-50);assert.deepEqual(view.view,[300,150,500,400]);
view.zoom(2,[500,400]);assert.deepEqual(view.view,[400,275,250,200]);
view.focus([100,100,500,30],1.5);assert.ok(Math.abs(view.view[2]/view.view[3]-1.5)<1e-9);
view.full();assert.deepEqual(view.view,[0,0,1000,800]);
assert.deepEqual(lineCrop({...model.lines[1],bbox:[-2,-2,40,30]}),[0,0,42,32]);
// Minimal DOM test double for source identities, context classes and SVG geometry.
// This is a module test, not browser layout or gesture verification.
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.style={};this.className='';this.listeners={};this._text='';this.classList={add:x=>{this.className+=' '+x;},toggle:(x,on)=>{this.className=this.className.split(' ').filter(s=>s&&s!==x).concat(on?[x]:[]).join(' ');}};}
 set textContent(x){this._text=x;this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){if(n.tagName==='#fragment')this.children.push(...n.children);else this.children.push(n);}}
 replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=String(v);}addEventListener(k,f){this.listeners[k]=f;}
 getBoundingClientRect(){return {width:600,height:400};}
}
globalThis.document={createElement:tag=>new Element(tag),createElementNS:(ns,tag)=>new Element(tag),createTextNode:text=>{const n=new Element('#text');n.textContent=text;return n;},createDocumentFragment:()=>new Element('#fragment')};
const svg=new Element('svg'),message=new Element('p'),viewer=new Facsimile(svg,message);
viewer.show(page,model.lines[1]);assert.equal(svg.children[0].attributes.width,'1000');assert.equal(svg.children[0].attributes.height,'800');
viewer.zoom(2);assert.equal(svg.attributes.viewBox,viewer.viewport.view.join(' '));
const thumbnail=viewer.thumbnail(model.lines[1],()=>{});assert.equal(thumbnail.children[0].children[0].attributes.viewBox,lineCrop(model.lines[1]).join(' '));
const body=new Element('tbody');let chosen=null;
renderConcordance(body,[hit],{words:8,onSelect:h=>{chosen=h;},showImages:true,viewer});
assert.equal(body.children.length,2);const row=body.children[0];
assert.ok(row.children[0].children.some(n=>n.className==='other-line'&&n.dataset.lineKey==='a0'));
assert.ok(row.children[2].children.some(n=>n.className==='other-line'&&n.dataset.lineKey==='a2'));
row.children[3].children[0].onclick();assert.equal(chosen,hit);
body.children[1].children[0].children[0].children[0].onclick();assert.equal(chosen,hit);
markSelected(body,hitKey(hit));assert.ok(body.children.every(r=>r.className.includes('selected-occurrence')));
renderConcordance(body,[repeated],{onSelect:()=>{}});
const metadata=JSON.parse(body.children[0].children[1].dataset.tooltip);
assert.deepEqual(metadata.sourceRange,[12,23]);assert.deepEqual(metadata.matchRange,[12,23]);assert.deepEqual(metadata.indices.groups.word,[12,17]);
class WorkerAdapter {
 constructor(){this.worker=new NodeWorker(new URL('./worker-bridge.mjs',import.meta.url));this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.(error));}
 postMessage(data){this.worker.postMessage(data);}terminate(){this.worker.terminate();}
}
const factory=()=>new WorkerAdapter(),engine=new RegexSearch({workerFactory:factory,timeoutMs:1500});
let terminated=false;const failedTransport=new RegexSearch({workerFactory:()=>({postMessage(){throw new Error('post-failure');},terminate(){terminated=true;}})});
await assert.rejects(failedTransport.search(index,'probe'),/post-failure/);assert.equal(terminated,true);
assert.deepEqual((await engine.search(index,'probe',{scope:'lines',flags:'gu'})).map(h=>h.start),run('probe','gu').map(h=>h.start));
const pending=engine.search(index,'probe',{scope:'lines',flags:'gu'});engine.cancel();await assert.rejects(pending,{name:'AbortError'});
const slowIndex=buildIndex({lines:[line('slow','a'.repeat(5000)+'!',0)]});
await assert.rejects(engine.search(slowIndex,'(a+)+$',{scope:'lines',flags:'u'}),/interrompue/);
console.log('Native regex syntax/flags/captures/offsets; contexts, viewport, crops, rendered source links, Worker cancellation/timeout: PASS.');
globalThis.window=globalThis;
for(const lib of ['xml-js.min.js','jszip.min.js'])vm.runInThisContext(fs.readFileSync(new URL('vendor/'+lib,root),'utf8'));
const files=[['sample',new URL('data/clavaire_sample_10.zip',root)]];
if(process.env.FULL_CORPUS_PATH)files.push(['full',process.env.FULL_CORPUS_PATH]);
const metrics=[];
for(const [name,path] of files) {
 const imported=await importZip(new Uint8Array(fs.readFileSync(path))),actual=buildIndex(createModel(imported.project)),job=regexJob(actual,'^selari$',{flags:'iu',scope:'vocabulary'}),start=performance.now();
 const found=regexHits(actual,job,executeRegexJob(job));
 assert.equal(found.length,search(actual,'selari').length);
 for(const h of found){assert.equal(h.line.text.slice(h.start,h.end),h.text);assert.equal(h.group.lines[h.lineIndex],h.line);}
 const lineJob=regexJob(actual,'selari',{flags:'giu',scope:'lines'}),lineHits=regexHits(actual,lineJob,executeRegexJob(lineJob));
 for(const h of lineHits)assert.equal(h.line.text.slice(h.start,h.end),h.text);
 const measured={corpus:name,regexVocabularyOccurrences:found.length,regexLineMatches:lineHits.length,regexCombinedMs:+(performance.now()-start).toFixed(1)};
 metrics.push(measured);console.log(name,JSON.stringify(measured));
}
fs.mkdirSync(new URL('tests/out/',root),{recursive:true});fs.writeFileSync(new URL('tests/out/features-02.json',root),JSON.stringify(metrics,null,2));
