export function download(name,content,type='application/octet-stream') {
  const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const DB='manuscript-workbench-local';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('projects');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveDraft(project){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(project,'last');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function loadDraft(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects'),r=tx.objectStore('projects').get('last');r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>{reject(r.error);db.close();};});}
export async function downloadXmlZip(files,name){const zip=new globalThis.JSZip();for(const f of files)zip.file(f.name,f.content);download(name,await zip.generateAsync({type:'blob',compression:'DEFLATE'}));}
