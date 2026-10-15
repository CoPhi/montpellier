import {filterHits} from './index.js';
export function compileRegex(pattern,flags) {
  try{return new RegExp(pattern,flags);}
  catch(error){throw new Error('Expression régulière ou flags invalides: '+error.message);}
}
function advance(text,position,unicode) {return position+(unicode&&text.codePointAt(position)>0xFFFF?2:1);}
// Shared by the browser Worker and Node tests: no pattern/text rewriting or flag injection.
export function executeRegexJob({pattern,flags,scope,subjects}) {
  const re=compileRegex(pattern,flags),matches=[];
  for(let subject=0;subject<subjects.length;subject++) {
    const text=subjects[subject];re.lastIndex=0;let match;
    while((match=re.exec(text))!==null) {
      matches.push({subject,start:match.index,end:match.index+match[0].length,text:match[0],
        captures:match.slice(1),groups:match.groups,indices:match.indices});
      if(scope==='vocabulary'||!re.global)break;
      if(match[0]==='')re.lastIndex=advance(text,re.lastIndex,re.unicode||re.unicodeSets);
    }
  }
  return matches;
}
export function regexJob(index,pattern,{flags='gu',scope='vocabulary'}={}) {
  compileRegex(pattern,flags);
  return {pattern,flags,scope,subjects:scope==='lines'?index.lines.map(l=>l.text):[...index.forms.keys()]};
}
export function regexHits(index,job,matches,filters={}) {
  const hits=[];
  for(const match of matches) {
    if(job.scope==='vocabulary') {
      for(const token of index.forms.get(job.subjects[match.subject])||[])hits.push({...token,regexMatch:match});
    } else {
      const line=index.lines[match.subject],info=index.lineGroups.get(line.key);
      hits.push({...match,lineKey:line.key,line,...info,stream:info.group.stream,regexMatch:match});
    }
  }
  return filterHits(hits,filters);
}
export class RegexSearch {
  constructor({timeoutMs=4000,workerFactory=url=>new Worker(url,{type:'module'})}={}) {
    this.timeoutMs=timeoutMs;this.workerFactory=workerFactory;this.pending=null;
  }
  cancel() {
    if(!this.pending)return;
    const {worker,timer,reject}=this.pending;this.pending=null;
    clearTimeout(timer);worker.terminate();reject(new DOMException('Recherche remplacée.','AbortError'));
  }
  search(index,pattern,options={}) {
    this.cancel();const job=regexJob(index,pattern,options);
    return new Promise((resolve,reject)=>{
      const worker=this.workerFactory(new URL('./regex-worker.js',import.meta.url));
      const finish=(result,error)=>{
        if(this.pending?.worker!==worker)return;
        clearTimeout(this.pending.timer);this.pending=null;worker.terminate();
        if(error)reject(error);else resolve(regexHits(index,job,result,options));
      };
      const timer=setTimeout(()=>finish(null,new Error('Recherche interrompue après '+this.timeoutMs/1000+' s. Affiner le motif ou augmenter regexTimeoutMs dans config.json.')),this.timeoutMs);
      this.pending={worker,timer,reject};
      worker.onmessage=event=>event.data.error?finish(null,new Error(event.data.error)):finish(event.data.matches);
      worker.onerror=()=>finish(null,new Error('Le traitement des expressions régulières n’a pas pu démarrer.'));
      try{worker.postMessage(job);}catch(error){finish(null,error);}
    });
  }
}
