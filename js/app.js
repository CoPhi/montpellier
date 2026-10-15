import {importZip,importJson} from './importer.js';
import {createModel} from './model.js';
import {buildIndex,search,vocabulary} from './index.js';
import {renderReader} from './reader.js';
import {renderConcordance,orderHits,hitKey,markSelected} from './concordance.js';
import {RegexSearch} from './regex.js';
import {installTooltips} from './tooltips.js';
import {Facsimile} from './facsimile.js';
import {fillEditor,applyEdit} from './editor.js';
import {download,downloadXmlZip,saveDraft,loadDraft} from './storage.js';
import {exportAllAlto} from './xmlalto.js';
import {exportPage} from './xmlpage.js';
import {GitHubStore} from './github.js';
import {serializeXml} from './xml.js';
import {parseLayer,bindLayers,propagateEdit} from './analysis.js';
import {AnalysisUI} from './analysis-ui.js';
import {frequencyRange} from './vocabulary.js';
import {installLayout} from './layout.js';
const $=id=>document.getElementById(id),status=$('status');
const state={model:null,index:null,page:null,line:null,hits:[],offset:0,dirty:false,busy:false,searchId:0,selectedHit:''};
const config=await fetch('config.json').then(r=>r.ok?r.json():Promise.reject(new Error('config.json introuvable.')));
const viewer=new Facsimile($('facsimile'),$('image-status'));viewer.base=config.imageBase;
const regexSearch=new RegexSearch({timeoutMs:config.regexTimeoutMs||4000}),analysisRegex=new RegexSearch({timeoutMs:config.regexTimeoutMs||4000});
const tips=installTooltips();
try{$('tooltip-toggle').checked=localStorage.getItem('workbench-tooltips')!=='off';}catch{}
tips.setEnabled($('tooltip-toggle').checked);$('tooltip-toggle').onchange=()=>{tips.setEnabled($('tooltip-toggle').checked);try{localStorage.setItem('workbench-tooltips',$('tooltip-toggle').checked?'on':'off');}catch{}};
const layout=installLayout();$('reset-layout').onclick=()=>layout.reset();
let runtimes=[],textHits=[],textOffset=0,vocabOffset=0,frequencyMin=1,frequencyMax=Infinity;
const analysisUI=new AnalysisUI({getModel:()=>state.model,onChange:showActiveResults,onImport:importAnalysis,onText:()=>{state.hits=textHits;state.offset=textOffset;}});
async function importAnalysis(file){if(!state.model){message('Importer le corpus avant un niveau analytique.',true);return;}if(state.busy)return;state.busy=true;try{message('Indexation du niveau analytique…');const model=state.model,index=state.index,layer=parseLayer(await file.text(),file.name),bound=await bindLayers([layer],model,index);if(state.model!==model)throw new Error('Le corpus a changé pendant l’importation. Réessayer.');state.model.project.analysisLayers||=[];state.model.project.analysisLayers.push(layer);runtimes.push(bound[0]);analysisUI.setRuntimes(runtimes);analysisUI.select(bound[0]);state.dirty=true;message('Onglet ajouté. Les autres niveaux restent indépendants.');}catch(e){message(e.message,true);}finally{state.busy=false;}}
async function showActiveResults({restoreScroll=false}={}){const active=analysisUI.active,id=state.displayId=(state.displayId||0)+1;analysisRegex.cancel();try{let hits;if(active){if(active.layer.view.mode==='regex')$('result-count').textContent='Recherche analytique…';hits=await analysisUI.hits(analysisRegex);}else hits=textHits;if(id!==state.displayId)return;state.hits=hits;state.offset=active?active.layer.view.offset||0:textOffset;state.offset=Math.min(state.offset,Math.max(0,Math.floor((hits.length-1)/config.resultsPerPage)*config.resultsPerPage));state.selectedHit='';renderHits();if(state.page)renderPage();if(restoreScroll)$('results-scroll').scrollTop=(active?active.layer.view.scroll:analysisUI.textScroll)||0;}catch(e){if(id!==state.displayId||e.name==='AbortError')return;state.hits=[];state.offset=0;renderHits();if(state.page)renderPage();message(e.message,true);}}
async function refreshAnalyses(){runtimes=await bindLayers(state.model.project.analysisLayers||[],state.model,state.index);analysisUI.setRuntimes(runtimes);}
let gitStore=null,gitTarget='';
$('context').value=config.contextWords;$('ignore-case').checked=config.ignoreCase;$('ignore-diacritics').checked=config.ignoreDiacritics;$('image-base').value=config.imageBase;
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
function options(){return {ignoreCase:$('ignore-case').checked,ignoreDiacritics:$('ignore-diacritics').checked};}
function refreshIndex(prepared=null){const start=performance.now();state.index=prepared||buildIndex(state.model,options());$('corpus-stats').textContent=`${state.model.pages.length} vues · ${state.model.lines.length} lignes · ${state.index.total.toLocaleString('fr')} occurrences · index ${(performance.now()-start).toFixed(0)} ms`;renderVocabulary();}
function setWordQuery(word){if(analysisUI.active)analysisUI.select(null);$('match-mode').value='exact';$('query').value=word;updateSearchControls();runSearch();}
function renderVocabulary(){if(!state.index)return;const entries=frequencyRange(state.index,frequencyMin,frequencyMax),target=$('vocabulary'),limit=100;vocabOffset=Math.min(vocabOffset,Math.max(0,Math.floor((entries.length-1)/limit)*limit));target.replaceChildren();for(const v of entries.slice(vocabOffset,vocabOffset+limit)){const b=document.createElement('button');b.textContent=`${v.term} (${v.count})`;b.onclick=()=>setWordQuery(v.term);target.append(b);}$('frequency-count').textContent=`${entries.length} formes${entries.length?' · '+(vocabOffset+1)+'–'+Math.min(entries.length,vocabOffset+limit):''}`;$('vocab-prev').disabled=vocabOffset===0;$('vocab-next').disabled=vocabOffset+limit>=entries.length;}
$('frequency-form').onsubmit=e=>{e.preventDefault();try{const min=Number($('frequency-min').value),max=$('frequency-max').value===''?Infinity:Number($('frequency-max').value);frequencyRange(state.index,min,max);frequencyMin=min;frequencyMax=max;vocabOffset=0;renderVocabulary();}catch(e){message(e.message,true);}};
$('vocab-prev').onclick=()=>{vocabOffset=Math.max(0,vocabOffset-100);renderVocabulary();};$('vocab-next').onclick=()=>{vocabOffset+=100;renderVocabulary();};
function updateSearchControls(){const isRegex=$('match-mode').value==='regex';$('regex-controls').hidden=!isRegex;$('regex-hint').hidden=!isRegex;for(const name of ['ignore-case','ignore-diacritics'])$(name).disabled=isRegex;}
function renderPage(){const matches=new Map();for(const hit of state.hits)for(const target of hit.targetsResolved||[hit]){if(target.line.page!==state.page)continue;if(!matches.has(target.lineKey))matches.set(target.lineKey,[]);matches.get(target.lineKey).push([target.start,target.end]);}renderReader($('reader'),state.page,{selectedKey:state.line?.key,matches,options:options(),onLine:selectLine,onWord:setWordQuery});}
function selectPage(page){state.page=page;state.line=null;state.selectedHit='';markSelected($('results'),'');$('page-select').value=String(page.docIndex);renderPage();viewer.show(page);fillEditor(null,$('edit-text'),$('line-info'));}
function selectLine(line){state.page=line.page;state.line=line;state.selectedHit='';markSelected($('results'),'');$('page-select').value=String(line.page.docIndex);renderPage();viewer.show(line.page,line);fillEditor(line,$('edit-text'),$('line-info'));const reader=$('reader'),row=[...reader.children].find(n=>n.dataset.key===line.key);if(row){const r=row.getBoundingClientRect(),box=reader.getBoundingClientRect();if(r.top<box.top)reader.scrollTop+=r.top-box.top;else if(r.bottom>box.bottom)reader.scrollTop+=r.bottom-box.bottom;}}
function selectHit(hit){selectLine(hit.line);const primary=hit.analysisId?state.hits.find(h=>h.analysisId===hit.analysisId)||hit:hit;state.selectedHit=hitKey(primary);markSelected($('results'),state.selectedHit);}
function renderHits({preserveScroll=false}={}){const count=state.hits.length,limit=config.resultsPerPage,scroll=$('results-scroll'),position=[scroll.scrollLeft,scroll.scrollTop];renderConcordance($('results'),state.hits,{offset:state.offset,limit,words:analysisUI.active?analysisUI.active.layer.view.context:Number($('context').value),onSelect:selectHit,selectedKey:state.selectedHit,showImages:analysisUI.active?analysisUI.active.layer.view.images:$('show-line-images').checked,viewer});if(preserveScroll){scroll.scrollLeft=position[0];scroll.scrollTop=position[1];}else scroll.scrollTop=0;$('result-count').textContent=count?`${count} occurrences · ${state.offset+1}–${Math.min(count,state.offset+limit)}`:'Aucune occurrence';$('results-prev').disabled=state.offset===0;$('results-next').disabled=state.offset+limit>=count;}
async function runSearch(){
  if(!state.index)return;
  const id=++state.searchId;regexSearch.cancel();textHits=[];textOffset=0;state.selectedHit='';if(!analysisUI.active){state.hits=[];state.offset=0;renderHits();renderPage();}
  const score=$('minimum-confidence').value,filters={mode:$('match-mode').value,zone:$('zone-filter').value,minimumConfidence:score===''?null:Number(score)};
  try{
    let hits;
    if(filters.mode==='regex'){$('result-count').textContent='Recherche…';hits=await regexSearch.search(state.index,$('query').value,{...filters,flags:$('regex-flags').value,scope:$('regex-scope').value});}
    else hits=search(state.index,$('query').value,filters);
    if(id!==state.searchId)return;
    textHits=orderHits(hits,$('sort').value,Number($('context').value));textOffset=0;if(!analysisUI.active)await showActiveResults();
    if(!analysisUI.active)message(state.hits.length+' occurrences'+(state.dirty?' · modifications à enregistrer.':'.'));
  }catch(error){if(id!==state.searchId||error.name==='AbortError')return;message(error.message,true);if(!analysisUI.active)$('result-count').textContent='Recherche non exécutée';}
}
async function useProject(project,images=[],warnings=[]){const start=performance.now();++state.searchId;++state.displayId;regexSearch.cancel();analysisRegex.cancel();const model=createModel(project),prepared=buildIndex(model,options()),bound=await bindLayers(project.analysisLayers||[],model,prepared);viewer.clearImages();viewer.addImages(images);state.model=model;state.hits=[];textHits=[];textOffset=0;analysisUI.active=null;analysisUI.setRuntimes([]);$('text-controls').hidden=false;$('analysis-controls').hidden=true;state.dirty=false;refreshIndex(prepared);runtimes=bound;analysisUI.setRuntimes(runtimes);const select=$('page-select');select.replaceChildren();for(const page of model.pages){const opt=document.createElement('option');opt.value=page.docIndex;opt.textContent=`${page.docIndex+1}. ${page.name} (${page.lines.length})`;select.append(opt);}selectPage(model.pages.find(p=>config.preferredImageName&&p.imageName.endsWith(config.preferredImageName))||model.pages[0]);$('workspace').hidden=false;runSearch();message(`Corpus chargé en ${((performance.now()-start)/1000).toFixed(2)} s.${warnings.length?' '+warnings.join(' '):''}`);window.workbench={get project(){return state.model.project;},get model(){return state.model;},get index(){return state.index;},get layers(){return runtimes;}};}
async function loadFile(file){if(state.busy)return;if(state.dirty&&!confirm('Remplacer le corpus? Exporter ou sauvegarder les modifications avant de continuer.'))return;state.busy=true;try{message('Importation…');if(/\.json$/i.test(file.name)){await useProject(importJson(await file.text()));}else{const result=await importZip(await file.arrayBuffer(),(done,total)=>message(`Importation: ${done}/${total} fichiers`));result.project.sourceName=file.name;await useProject(result.project,result.images,result.warnings);}gitStore?.forget();gitStore=null;gitTarget='';}catch(e){message(e.message,true);}finally{state.busy=false;}}
$('corpus-input').onchange=e=>{if(e.target.files[0])loadFile(e.target.files[0]);};
$('import-corpus').onclick=()=>$('corpus-input').click();
$('add-images').onclick=()=>$('image-input').click();
$('sample').onclick=async()=>{try{const r=await fetch(config.sampleZip);if(!r.ok)throw new Error('Exemple indisponible.');await loadFile(new File([await r.blob()],'clavaire_sample_10.zip'));}catch(e){message(e.message,true);}};
const drop=$('dropzone');drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag');};drop.ondragleave=()=>drop.classList.remove('drag');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('drag');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);};
$('page-select').onchange=e=>selectPage(state.model.pages[Number(e.target.value)]);
$('page-prev').onclick=()=>{if(state.page.docIndex>0)selectPage(state.model.pages[state.page.docIndex-1]);};$('page-next').onclick=()=>{if(state.page.docIndex+1<state.model.pages.length)selectPage(state.model.pages[state.page.docIndex+1]);};
$('search-form').onsubmit=e=>{e.preventDefault();runSearch();};for(const name of ['zone-filter','sort','context','minimum-confidence','regex-scope','regex-flags'])$(name).onchange=runSearch;
$('match-mode').onchange=()=>{updateSearchControls();runSearch();};
$('show-line-images').onchange=()=>renderHits({preserveScroll:true});
for(const name of ['ignore-case','ignore-diacritics'])$(name).onchange=()=>{if(state.model){refreshIndex();runSearch();}};
function resultsPage(delta){state.offset=Math.max(0,state.offset+delta*config.resultsPerPage);if(analysisUI.active)analysisUI.active.layer.view.offset=state.offset;else textOffset=state.offset;renderHits();}
$('results-prev').onclick=()=>resultsPage(-1);$('results-next').onclick=()=>resultsPage(1);
$('image-full').onclick=()=>viewer.full();$('image-line').onclick=()=>viewer.focus();$('image-zoom-in').onclick=()=>viewer.zoom(1.4);$('image-zoom-out').onclick=()=>viewer.zoom(1/1.4);
$('image-base').onchange=e=>{viewer.base=e.target.value;if(state.page)viewer.show(state.page,state.line);renderHits({preserveScroll:true});};
$('image-input').onchange=async e=>{viewer.addImages(await Promise.all([...e.target.files].map(async f=>({name:f.name,bytes:new Uint8Array(await f.arrayBuffer())}))));renderHits({preserveScroll:true});};
$('apply-edit').onclick=async()=>{if(state.busy)return;state.busy=true;$('apply-edit').disabled=true;try{if(!state.line)return;analysisRegex.cancel();++state.displayId;const line=state.line,before=line.text,after=$('edit-text').value;if(before===after)return;++state.searchId;regexSearch.cancel();applyEdit(state.model,line.key,after);state.dirty=true;await propagateEdit(runtimes,line.key,before,after);state.dirty=true;refreshIndex();await refreshAnalyses();await runSearch();if(analysisUI.active)await showActiveResults();fillEditor(line,$('edit-text'),$('line-info'));message('Texte modifié; ancrages actualisés. Les analyses touchées sont à réexaminer, sans réanalyse automatique.');}catch(e){message(e.message,true);}finally{state.busy=false;$('apply-edit').disabled=false;}};
$('export-json').onclick=()=>{if(state.model)download('manuscript.json',JSON.stringify(state.model.project,null,2),'application/json;charset=utf-8');};
$('export-alto').onclick=async()=>{try{if(!state.model)return;const files=exportAllAlto(state.model.project);for(const m of state.model.project.manifests||[])files.push({name:m.name,content:serializeXml(m.tree)});await downloadXmlZip(files,'manuscript_alto.zip');}catch(e){message(e.message,true);}};
$('export-page').onclick=async()=>{try{if(!state.model)return;const output=exportPage(state.model.project),warnings=[...new Set(output.flatMap(o=>o.warnings))];await downloadXmlZip([...output,{name:'conversion-report.json',content:JSON.stringify({schema:'PAGE 2019-07-15',warnings,files:output.map(o=>({name:o.name,warnings:o.warnings}))},null,2)}],'manuscript_page.zip');message(warnings.join(' '));}catch(e){message(e.message,true);}};
$('save-local').onclick=async()=>{try{if(!state.model)return;await saveDraft(state.model.project);state.dirty=false;message('Projet sauvegardé dans ce navigateur. Les images ajoutées ne sont pas incluses; recharger les images ou utiliser leur chemin.');}catch(e){message(e.message,true);}};
$('restore-local').onclick=async()=>{try{if(state.dirty&&!confirm('Remplacer le travail non sauvegardé par la sauvegarde locale?'))return;const project=await loadDraft();if(!project)throw new Error('Aucune sauvegarde locale.');await useProject(project);gitStore?.forget();gitStore=null;gitTarget='';}catch(e){message(e.message,true);}};
function githubConnection(){const values={owner:$('github-owner').value.trim(),repo:$('github-repo').value.trim(),branch:$('github-branch').value.trim()||'main',path:$('github-path').value.trim(),token:$('github-token').value.trim()},target=JSON.stringify([values.owner,values.repo,values.branch,values.path]);if(!gitStore||target!==gitTarget){gitStore?.forget();gitStore=new GitHubStore(values);gitTarget=target;}else gitStore.token=values.token;return gitStore;}
$('github-load').onclick=async()=>{try{if(state.dirty&&!confirm('Remplacer le travail non sauvegardé par le fichier GitHub?'))return;const store=githubConnection(),project=await store.load();await useProject(project);$('github-status').textContent=`Chargé · blob ${store.sha.slice(0,10)}`;}catch(e){$('github-status').textContent=e.message;}};
$('github-save').onclick=async()=>{const button=$('github-save');button.disabled=true;try{if(!state.model)throw new Error('Importer un corpus avant de sauvegarder.');const result=await githubConnection().save(state.model.project,$('github-message').value.trim()||'Update manuscript data');state.dirty=false;$('github-status').textContent=`Sauvegardé dans le dépôt · commit ${result.commit?.slice(0,10)||result.sha.slice(0,10)}. Publication Pages distincte.`;}catch(e){$('github-status').textContent=e.message;}finally{button.disabled=false;}};
$('github-forget').onclick=()=>{gitStore?.forget();gitStore=null;gitTarget='';$('github-token').value='';$('github-status').textContent='Token oublié.';};
window.addEventListener('beforeunload',e=>{if(state.dirty){e.preventDefault();e.returnValue='';}});
