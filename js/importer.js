import {importAlto} from './xmlalto.js';
import {parseXml, descendants, rootElement, localName} from './xml.js';
import {PROJECT_FORMAT,validateProject} from './model.js';
const basename=name=>name.split('/').at(-1);
export async function importZip(bytes,onProgress=()=>{}) {
  const zip=await globalThis.JSZip.loadAsync(bytes,{checkCRC32:true});
  const entries=Object.values(zip.files).filter(f=>!f.dir && !f.name.includes('__MACOSX/'));
  return importEntries(entries,onProgress);
}
// The manifest lists XML paths relative to itself; no directory listing or backend is needed.
export async function importRepository(manifestPath,{baseUrl=globalThis.location?.href,fetcher=globalThis.fetch,onProgress=()=>{}}={}) {
  const manifestUrl=new URL(manifestPath,baseUrl);
  const response=await fetcher(manifestUrl.href);
  if(!response.ok)throw new Error(`Manifeste indisponible (${response.status}): ${manifestPath}`);
  const manifest=await response.json(),files=manifest?.files;
  if(!Array.isArray(files)||!files.length)throw new Error('Le manifeste doit contenir une liste files non vide.');
  const names=new Set();
  for(const name of files){
    if(typeof name!=='string'||! /\.xml$/i.test(name)||/[\\:%?#\u0000-\u001F\u007F]/u.test(name)||name.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error(`Chemin XML relatif invalide: ${name}`);
    if(names.has(name))throw new Error(`Fichier dupliqué dans le manifeste: ${name}`);
    names.add(name);
  }
  const entries=files.map(name=>({name,async:async()=>{
    const r=await fetcher(new URL(name,manifestUrl).href);
    if(!r.ok)throw new Error(`XML indisponible (${r.status}): ${name}`);
    return r.text();
  }}));
  const result=await importEntries(entries,onProgress);
  result.project.sourceName=manifestPath;
  return result;
}
async function importEntries(entries,onProgress) {
  const documents=[],manifests=[],images=[],warnings=[];
  let completed=0;
  for (const entry of entries) {
    if (/\.xml$/i.test(entry.name)) {
      const raw=await entry.async('string'),tree=parseXml(raw),root=localName(rootElement(tree).name);
      if(root==='alto') documents.push(importAlto(entry.name,raw));
      else if(root==='mets') manifests.push({name:entry.name,tree});
      else warnings.push(`${entry.name}: XML non ALTO/METS ignoré.`);
    } else if (/\.(jpe?g|png|webp|gif)$/i.test(entry.name)) {
      images.push({name:entry.name,bytes:await entry.async('uint8array')});
    }
    onProgress(++completed,entries.length);
  }
  if(!documents.length) throw new Error('Aucun fichier ALTO dans ce corpus.');
  const order=[];
  for(const manifest of manifests) {
    const files=new Map(descendants(manifest.tree,'file').map(f=>[f.attributes?.ID,descendants(f,'FLocat')[0]?.attributes?.['xlink:href']]));
    for(const pointer of descendants(manifest.tree,'fptr')) {const path=files.get(pointer.attributes?.FILEID);if(path)order.push(path);}
  }
  const used=new Set(),ordered=[];
  for(const path of order) {
    const exact=documents.find(d=>d.name===path), candidates=documents.filter(d=>basename(d.name)===basename(path));
    const doc=exact || (candidates.length===1?candidates[0]:null);
    if(doc && !used.has(doc.name)){ordered.push(doc);used.add(doc.name);}
    else if(!doc) warnings.push(`Référence METS absente ou ambiguë: ${path}`);
  }
  const remaining=documents.filter(d=>!used.has(d.name)).sort((a,b)=>{
    const pa=Number(descendants(a.tree,'Page')[0].attributes.PHYSICAL_IMG_NR),pb=Number(descendants(b.tree,'Page')[0].attributes.PHYSICAL_IMG_NR);
    return (Number.isFinite(pa)&&Number.isFinite(pb)?pa-pb:0)||a.name.localeCompare(b.name,undefined,{numeric:true});
  });
  ordered.push(...remaining);
  const project={format:PROJECT_FORMAT,version:1,sourceName:'',documents:ordered,manifests,edits:[]};
  validateProject(project);
  return {project,images,warnings};
}
export function importJson(text) {return validateProject(JSON.parse(text));}
