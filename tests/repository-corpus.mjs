import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
globalThis.window=globalThis;
for(const lib of ['xml-js.min.js','jszip.min.js'])vm.runInThisContext(fs.readFileSync(new URL('../vendor/'+lib,import.meta.url),'utf8'));
const {importZip,importRepository}=await import('../js/importer.js');
const {createModel}=await import('../js/model.js');
const {exportAllAlto}=await import('../js/xmlalto.js');
const {parseXml,descendants}=await import('../js/xml.js');
const baseUrl='https://example.org/workbench/index.html';
const manifestPath='xml-alto/manifest.json';
const calls=[],progress=[];
const archive=await JSZip.loadAsync(fs.readFileSync(new URL('../data/clavaire_sample_10.zip',import.meta.url)));
const sampleFiles=Object.values(archive.files).filter(f=>!f.dir&&/\.xml$/i.test(f.name)).map(f=>f.name);
const fetcher=async url=>{
  calls.push(url);
  const relative=new URL(url).pathname.replace('/workbench/','');
  try{return new Response(fs.readFileSync(new URL('../'+relative,import.meta.url)));}
  catch{return new Response('',{status:404});}
};
const repositoryFetcher=fetcher;
const sampleFetcher=async url=>{calls.push(url);if(url.endsWith('/manifest.json'))return Response.json({files:sampleFiles});const name=decodeURIComponent(new URL(url).pathname.replace('/workbench/xml-alto/',''));const file=archive.file(name);return file?new Response(await file.async('string')):new Response('',{status:404});};
const imported=await importRepository(manifestPath,{baseUrl,fetcher:sampleFetcher,onProgress:(...p)=>progress.push(p)});
const zipped=await importZip(fs.readFileSync(new URL('../data/clavaire_sample_10.zip',import.meta.url)));
assert.deepEqual(imported.project.documents,zipped.project.documents);
assert.deepEqual(imported.project.manifests,zipped.project.manifests);
assert.equal(imported.project.sourceName,manifestPath);
assert.equal(createModel(imported.project).lines.length,775);
assert.equal(imported.images.length,0);
assert.deepEqual(progress.at(-1),[11,11]);
assert.ok(calls.every(url=>url.startsWith('https://example.org/workbench/xml-alto/')));
for(const doc of exportAllAlto(imported.project))assert.deepEqual(parseXml(doc.content),parseXml(await archive.file(doc.name).async('string')));
const manifest={files:sampleFiles};
const withManifest=(value,otherwise=sampleFetcher)=>async url=>url.endsWith('/manifest.json')?Response.json(value):otherwise(url);
const reversed=await importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:[...manifest.files].reverse()})});
assert.deepEqual(reversed.project.documents,imported.project.documents);
const noMets=await importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:manifest.files.filter(n=>n!=='METS.xml').reverse()})});
assert.deepEqual(noMets.project.documents.map(d=>d.name),[...noMets.project.documents].sort((a,b)=>Number(descendants(a.tree,'Page')[0].attributes.PHYSICAL_IMG_NR)-Number(descendants(b.tree,'Page')[0].attributes.PHYSICAL_IMG_NR)).map(d=>d.name));
for(const value of [{},{files:[]},{files:['a.xml','a.xml']},...['../a.xml','/a.xml','https://other/a.xml','a%2f.xml','a.xml?q','a\\b.xml',null,'image.jpg'].map(name=>({files:[name]}))]){
  await assert.rejects(importRepository(manifestPath,{baseUrl,fetcher:withManifest(value)}));
}
await assert.rejects(importRepository(manifestPath,{baseUrl,fetcher:async()=>new Response('',{status:404})}),/Manifeste indisponible/);
await assert.rejects(importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:['missing.xml']})}),/XML indisponible/);
await assert.rejects(importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:['bad.xml']},async()=>new Response('<alto>'))}));
await assert.rejects(importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:['METS.xml']})}),/Aucun fichier ALTO/);
const nested=await importRepository(manifestPath,{baseUrl,fetcher:withManifest({files:['nested/scan.xml']},async url=>{assert.equal(url,'https://example.org/workbench/xml-alto/nested/scan.xml');return new Response(await archive.file('FRAC34172_CC138_062.xml').async('string'));})});
assert.equal(nested.project.documents[0].name,'nested/scan.xml');
console.log('Repository corpus PASS: sample fidelity, export, METS order, fallback, relative URLs, nested paths, validation and loading failures.');

// Regression: the deployed manifest must load every ALTO in the repository, beyond the sample.
const deployed=JSON.parse(fs.readFileSync(new URL('../xml-alto/manifest.json',import.meta.url)));
const full=await importRepository(manifestPath,{baseUrl,fetcher:repositoryFetcher});
const fullModel=createModel(full.project);
assert.equal(full.project.documents.length,deployed.files.filter(name=>!full.project.manifests.some(m=>m.name===name)).length);
for(const doc of exportAllAlto(full.project))assert.deepEqual(parseXml(doc.content),parseXml(fs.readFileSync(new URL('../xml-alto/'+doc.name,import.meta.url),'utf8')));
assert.ok(fullModel.pages.some(page=>page.imageName==='FRAC34172_CC138_159.jpg'));
console.log(`Complete repository corpus PASS: ${fullModel.pages.length} views, ${fullModel.lines.length} lines, last view 159 reachable.`);
