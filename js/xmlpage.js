import {xmlElement as el, xmlText as text,serializeXml} from './xml.js';
import {createModel} from './model.js';
const PAGE_NS='http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15';
const pointString=raw=>{const v=raw.trim().split(/[\s,]+/).map(Number);if(v.length<4 || v.length%2 || v.some(n=>!Number.isFinite(n)))return '';return Array.from({length:v.length/2},(_,i)=>`${Math.round(v[2*i])},${Math.round(v[2*i+1])}`).join(' ');};
function rectPoints([x,y,w,h]) {return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(p=>p.map(Math.round).join(',')).join(' ');}
export function exportPage(project,{timestamp=new Date().toISOString()}={}) {
  const model=createModel(project),results=[];
  for(const page of model.pages) {
    const warnings=[],regions=[];
    const groups=new Map();for(const line of page.lines){if(!groups.has(line.zone))groups.set(line.zone,[]);groups.get(line.zone).push(line);}
    let regionNo=0;
    for(const [zone,lines] of groups) {
      const coords=lines.map(l=>l.bbox).filter(b=>b.every(Number.isFinite));
      const xmin=Math.min(...coords.map(b=>b[0])),ymin=Math.min(...coords.map(b=>b[1])),xmax=Math.max(...coords.map(b=>b[0]+b[2])),ymax=Math.max(...coords.map(b=>b[1]+b[3]));
      const nested=[el('Coords',{points:rectPoints([xmin,ymin,xmax-xmin,ymax-ymin])})];
      for(const line of lines) {
        const polygon=pointString(line.polygon)||rectPoints(line.bbox),baseline=pointString(line.baseline);
        if(line.bbox.some(n=>!Number.isFinite(n)))throw new Error(`Géométrie invalide: ${line.key}`);
        const lineChildren=[el('Coords',{points:polygon})];
        if(baseline)lineChildren.push(el('Baseline',{points:baseline}));
        lineChildren.push(el('TextEquiv',line.confidence===null?{}:{conf:String(line.confidence)},[el('Unicode',{},[text(line.text)])]));
        nested.push(el('TextLine',{id:`line_${regions.length}_${nested.length}`,custom:`source {id:${line.id.replace(/[;{}]/g,'_')};}`},lineChildren));
      }
      regions.push(el('TextRegion',{id:`region_${++regionNo}`,custom:`source {zone:${zone.replace(/[;{}]/g,'_')};}`},nested));
    }
    warnings.push('Export PAGE de consultation: géométrie et texte des lignes conservés; attributs ALTO supplémentaires conservés dans le JSON, pas tous transposés en PAGE.');
    if(page.lines.some(l=>l.strings.length>1))warnings.push('Les String sont réunis au niveau TextLine, sans coordonnées de mots ajoutées.');
    if(page.lines.some(l=>l.zone==='unclassified'))warnings.push('Bloc non classé: ordre des lignes à vérifier sur le fac-similé.');
    if(page.lines.some(l=>[...l.bbox].some(v=>!Number.isInteger(v))))warnings.push('Coordonnées arrondies aux pixels entiers pour PAGE.');
    const root=el('PcGts',{xmlns:PAGE_NS,'xmlns:xsi':'http://www.w3.org/2001/XMLSchema-instance','xsi:schemaLocation':`${PAGE_NS} https://www.primaresearch.org/schema/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd`},[
      el('Metadata',{},[el('Creator',{},[text('Manuscript Workbench 0.1')]),el('Created',{},[text(timestamp)]),el('LastChange',{},[text(timestamp)])]),
      el('Page',{imageFilename:page.imageName,imageWidth:String(Math.round(page.width)),imageHeight:String(Math.round(page.height))},regions)
    ]);
    results.push({name:page.name.replace(/\.xml$/i,'.page.xml'),content:serializeXml({declaration:{attributes:{version:'1.0',encoding:'UTF-8'}},elements:[root]}),warnings});
  }
  return results;
}
