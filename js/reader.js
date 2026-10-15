import {tokenize,normalize} from './index.js';
export function renderReader(container,page,{selectedKey='',query='',options={},matches=null,onLine,onWord}={}) {
  const active=document.activeElement,focus=active&&container.contains(active)?{key:active.closest('.text-line')?.dataset.key,start:active.dataset.start,number:active.classList.contains('line-number')}:null;
  const scroll=container.scrollTop;
  container.replaceChildren();
  if(!page){container.textContent='Importer un corpus pour commencer.';return;}
  if(!page.lines.length){container.textContent='Cet ALTO ne contient aucune ligne. Cela ne prouve pas que l’image est blanche.';return;}
  const fragment=document.createDocumentFragment();let lastZone='';
  for(const line of page.lines) {
    if(line.zone!==lastZone){const h=document.createElement('h3');h.textContent=line.zone;fragment.append(h);lastZone=line.zone;}
    const row=document.createElement('div');row.className='text-line'+(line.key===selectedKey?' selected':'');row.dataset.key=line.key;
    const number=document.createElement('button');number.className='line-number';number.textContent=String(page.lines.indexOf(line)+1);number.dataset.tooltip=line.id;number.onclick=()=>onLine(line);row.append(number);
    const content=document.createElement('span');content.className='line-text';let offset=0;
    for(const token of tokenize(line.text)) {
      content.append(document.createTextNode(line.text.slice(offset,token.start)));
      const word=document.createElement('button');word.className='word';word.textContent=token.text;word.dataset.start=String(token.start);
      if(matches?(matches.get(line.key)||[]).some(([start,end])=>token.start<end&&token.end>start):(query && normalize(token.text,options)===normalize(query,options)))word.classList.add('match');
      word.dataset.tooltip='Ouvrir la concordance';word.onclick=()=>{onLine(line);onWord(token.text);};content.append(word);offset=token.end;
    }
    content.append(document.createTextNode(line.text.slice(offset)));if(!line.text)content.textContent='[ligne sans transcription]';row.append(content);fragment.append(row);
  }
  container.append(fragment);
  container.scrollTop=scroll;
  if(focus){const row=[...container.children].find(n=>n.dataset.key===focus.key);const target=focus.number?row?.querySelector('.line-number'):[...row?.querySelectorAll('.word')||[]].find(n=>n.dataset.start===focus.start);target?.focus({preventScroll:true});}
}
