import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
process.on('uncaughtException',error=>{console.error(error.stack);process.exitCode=1;});
process.on('unhandledRejection',error=>{console.error(error.stack);process.exitCode=1;});
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
globalThis.window=globalThis;
for(const lib of ['xml-js.min.js','jszip.min.js'])vm.runInThisContext(fs.readFileSync(path.join(root,'vendor',lib),'utf8'),{filename:lib});
const {importZip,importJson}=await import('../js/importer.js');
const {createModel,updateLine}=await import('../js/model.js');
const {buildIndex,search,tokenize}=await import('../js/index.js');
const {exportAllAlto}=await import('../js/xmlalto.js');
const {exportPage}=await import('../js/xmlpage.js');
const {parseXml,serializeXml,rootElement,localName,descendants}=await import('../js/xml.js');
const {GitHubStore,encodeUtf8}=await import('../js/github.js');
const out=path.join(root,'tests/out');fs.mkdirSync(out,{recursive:true});const metrics=[];
function semanticTree(node){
  if(node.type==='text'&&!node.text.trim())return null;
  return {type:node.type||'document',name:node.name,attributes:node.attributes?Object.fromEntries(Object.entries(node.attributes).sort(([a],[b])=>a.localeCompare(b))):undefined,text:node.text,cdata:node.cdata,comment:node.comment,instruction:node.instruction,declaration:node.declaration?semanticTree(node.declaration):undefined,elements:(node.elements||[]).map(semanticTree).filter(Boolean)};
}
async function verify(filename,expectedScans,expectedLines,label){
  const bytes=new Uint8Array(fs.readFileSync(filename)),start=performance.now();
  const imported=await importZip(bytes);const importedAt=performance.now();const model=createModel(imported.project);const index=buildIndex(model);const indexedAt=performance.now();
  assert.equal(model.pages.length,expectedScans);assert.equal(model.lines.length,expectedLines);
  assert.equal(index.total,model.lines.reduce((n,line)=>n+tokenize(line.text).length,0));
  const source=await JSZip.loadAsync(bytes);const exported=exportAllAlto(imported.project);
  for(const file of exported){const original=await source.file(file.name).async('string');try{assert.deepEqual(semanticTree(parseXml(file.content)),semanticTree(parseXml(original)),`ALTO round trip ${file.name}`);}catch(e){fs.writeFileSync(path.join(out,'bad.xml'),file.content);e.message=`${file.name}: ${e.message}`;throw e;}}
  const reload=importJson(JSON.stringify(imported.project));assert.deepEqual(reload,imported.project);
  const baseline=search(index,'selari');assert.ok(baseline.length>0);
  for(const hit of baseline)assert.equal(hit.line.text.slice(hit.start,hit.end),hit.text);
  const editLine=model.lines.find(l=>l.strings.length===1&&l.text.trim());const score=editLine.confidence;const old=editLine.text;updateLine(model,editLine.key,'probe probe ꝑ q̃');
  assert.equal(search(buildIndex(model),'probe').length,2);assert.equal(editLine.confidence,score);assert.equal(imported.project.edits.length,1);
  updateLine(model,editLine.key,old);imported.project.edits=[];
  const pageFiles=exportPage(imported.project,{timestamp:'2026-10-13T20:00:00Z'});
  for(const file of pageFiles){assert.equal(localName(rootElement(parseXml(file.content)).name),'PcGts');assert.equal(descendants(parseXml(file.content),'TextLine').length,model.pages.find(p=>file.name===p.name.replace(/\.xml$/i,'.page.xml')).lines.length);}
  const zip=new JSZip();for(const file of exported)zip.file(file.name,file.content);for(const m of imported.project.manifests)zip.file(m.name,serializeXml(m.tree));
  const reimport=await importZip(await zip.generateAsync({type:'uint8array',compression:'DEFLATE'}));assert.deepEqual(reimport.project.documents.map(d=>d.name),imported.project.documents.map(d=>d.name));
  const dest=path.join(out,label);fs.mkdirSync(dest,{recursive:true});for(const f of pageFiles)fs.writeFileSync(path.join(dest,path.basename(f.name)),f.content);
  fs.writeFileSync(path.join(dest,'project.json'),JSON.stringify(imported.project));
  const queries=['selari','soma','ꝑ','q̃','peire','resta'];const qstart=performance.now();for(let i=0;i<1000;i++)search(index,queries[i%queries.length]);const qms=performance.now()-qstart;
  metrics.push({corpus:label,scans:model.pages.length,lines:model.lines.length,occurrences:index.total,importMs:+(importedAt-start).toFixed(1),modelAndIndexMs:+(indexedAt-importedAt).toFixed(1),averageExactQueryMs:+(qms/1000).toFixed(3),jsonBytes:Buffer.byteLength(JSON.stringify(imported.project)),altoRoundTrip:'pass',pageFiles:pageFiles.length});
  console.log(label,'PASS',JSON.stringify(metrics.at(-1)));return imported.project;
}
const project=await verify(path.join(root,'data/clavaire_sample_10.zip'),10,775,'sample');
const fullPath=process.env.FULL_CORPUS_PATH||process.argv[2];if(fullPath)await verify(fullPath,152,9604,'full');
// A reordered ZIP must still use METS; a corpus without METS falls back to physical numbers.
const original=await JSZip.loadAsync(new Uint8Array(fs.readFileSync(path.join(root,'data/clavaire_sample_10.zip'))));const reversed=new JSZip();for(const f of Object.values(original.files).reverse())if(!f.dir)reversed.file(f.name,await f.async('uint8array'));
const again=await importZip(await reversed.generateAsync({type:'uint8array'}));assert.deepEqual(again.project.documents.map(d=>d.name),project.documents.map(d=>d.name));
assert.throws(()=>parseXml('<!DOCTYPE x><x/>'),/DOCTYPE/);assert.throws(()=>importJson('{"format":"other"}'),/incompatible/);
assert.throws(()=>parseXml('<x/><y/>'),/racine/);
assert.throws(()=>parseXml('<x A="1" A="2"/>'),/dupliqué/);
const special=parseXml('<?xml version="1.0" encoding="UTF-8"?><x a="&amp; &quot; &lt; ꝑ q̃"><!--retained--><![CDATA[text < >]]><y>été &amp; α</y></x>');assert.deepEqual(semanticTree(parseXml(serializeXml(special))),semanticTree(special));
// GitHub calls are mocked: no credentials, repositories or external writes are involved.
assert.equal(Buffer.from(encodeUtf8('ꝑ q̃ été Ελληνικά'),'base64').toString('utf8'),'ꝑ q̃ été Ελληνικά');
const calls=[];let conflict=false;
globalThis.fetch=async(url,options={})=>{
  calls.push({url,options});
  if(options.method==='PUT'){
    const body=JSON.parse(options.body);assert.equal(body.sha,'original-blob');assert.equal(Buffer.from(body.content,'base64').toString('utf8'),JSON.stringify(project,null,2));
    return conflict?new Response('',{status:409}):Response.json({content:{sha:'updated-blob'},commit:{sha:'commit-id',html_url:'https://github.com/example/repo/commit/commit-id'}});
  }
  if(url.includes('/git/blobs/'))return new Response(JSON.stringify(project));
  return Response.json({type:'file',sha:'original-blob',git_url:'https://api.github.com/repos/example/repo/git/blobs/original-blob'});
};
const store=new GitHubStore({owner:'example',repo:'repo',token:'test-token'});assert.deepEqual(await store.load(),project);await store.save(project);assert.equal(store.sha,'updated-blob');store.sha='original-blob';conflict=true;await assert.rejects(store.save(project),/Conflit/);assert.equal(store.sha,'original-blob');store.forget();assert.equal(store.token,'');
fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(metrics,null,2));console.log('GitHub immutable read, UTF-8 save and conflict handling: PASS (mocked).');
