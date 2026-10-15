import {children, descendants, rootElement, localName, textOf} from './xml.js';
export const PROJECT_FORMAT = 'manuscript-workbench';
export function validateProject(project) {
  if (project?.format !== PROJECT_FORMAT || project.version !== 1 || !Array.isArray(project.documents) || !project.documents.length) throw new Error('Projet JSON incompatible ou vide.');
  const names = new Set();
  for (const d of project.documents) {
    if (typeof d.name !== 'string' || !d.name || names.has(d.name)) throw new Error('Noms de fichiers absents ou dupliqués.');
    names.add(d.name);
    if (children(d.tree).length !== 1 || localName(rootElement(d.tree)?.name) !== 'alto' || descendants(d.tree,'Page').length !== 1) throw new Error(`${d.name}: arbre ALTO invalide.`);
  }
  return project;
}
export function lineText(lineNode) {
  const bits=[];
  for (const node of children(lineNode)) {
    const kind=localName(node.name);
    if (kind==='String') {if(bits.length && !bits.at(-1).endsWith(' ')) bits.push(' '); bits.push(node.attributes?.CONTENT ?? '');}
    if (kind==='SP') bits.push(' ');
    if (kind==='HYP') bits.push(node.attributes?.CONTENT ?? '-');
  }
  return bits.join('');
}
export function createModel(project) {
  validateProject(project);
  const pages=[],lines=[],byKey=new Map();
  project.documents.forEach((document,docIndex)=>{
    const pageNode=descendants(document.tree,'Page')[0], a=pageNode.attributes || {};
    const tags=new Map(descendants(document.tree,'OtherTag').map(n=>[n.attributes?.ID,n.attributes?.LABEL]));
    const page={document,docIndex,name:document.name,imageName:textOf(descendants(document.tree,'fileName')[0]),width:Number(a.WIDTH),height:Number(a.HEIGHT),lines:[],sourceNumber:a.PHYSICAL_IMG_NR};
    if (!(page.width>0 && page.height>0)) throw new Error(`${document.name}: dimensions manquantes.`);
    // Sort the runtime view only. The XML tree and its source order remain untouched.
    const blocks=descendants(pageNode,'TextBlock').map((node,i)=>({node,i,zone:tags.get(node.attributes?.TAGREFS)||'unclassified'}));
    blocks.sort((x,y)=>({ 'MainZone#left':0,'MainZone#right':1}[x.zone]??2)-({ 'MainZone#left':0,'MainZone#right':1}[y.zone]??2)||x.i-y.i);
    for (const block of blocks) {
      descendants(block.node,'TextLine').forEach((node,i)=>{
        const attr=node.attributes || {},id=attr.ID || `block${block.i}-line${i}`,key=`${document.name}#${id}`;
        if (byKey.has(key)) throw new Error(`Identifiant de ligne dupliqué: ${key}`);
        const strings=children(node,'String');
        const conf=strings.length===1 && strings[0].attributes?.WC!==undefined ? Number(strings[0].attributes.WC) : null;
        const line={key,id,node,page,zone:block.zone,order:lines.length,text:lineText(node),bbox:['HPOS','VPOS','WIDTH','HEIGHT'].map(k=>Number(attr[k])),baseline:attr.BASELINE||'',polygon:descendants(node,'Polygon')[0]?.attributes?.POINTS||'',confidence:Number.isFinite(conf)?conf:null,strings};
        page.lines.push(line);lines.push(line);byKey.set(key,line);
      });
    }
    pages.push(page);
  });
  return {project,pages,lines,byKey};
}
export function updateLine(model,key,newText) {
  const line=model.byKey.get(key);
  if (!line) throw new Error('Ligne introuvable.');
  if (line.strings.length!==1) throw new Error('Cette version édite les lignes contenant un seul String; les lignes à plusieurs String restent consultables.');
  if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(newText)||[...newText].some(c=>c.codePointAt(0)>=0xD800&&c.codePointAt(0)<=0xDFFF))throw new Error('Le texte contient un caractère non autorisé dans XML 1.0.');
  const before=line.text;
  line.strings[0].attributes.CONTENT=String(newText);
  line.text=String(newText);
  model.project.edits ||= [];
  model.project.edits.push({line:key,before,after:line.text,at:new Date().toISOString()});
  // WC is the recognition score of the original export, never a new score for the edited text.
  return line;
}
