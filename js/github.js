import {validateProject} from './model.js';
export function encodeUtf8(text) {
  const bytes=new TextEncoder().encode(text);let binary='';
  for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return btoa(binary);
}
export class GitHubStore {
  constructor({owner,repo,branch='main',path='data/manuscript.json',token=''}) {
    if(!/^[A-Za-z0-9-]+$/.test(owner)||!/^[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Propriétaire ou dépôt invalide.');
    path=path.replace(/^\/+/, '');
    if(!path||path.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('Chemin de fichier invalide.');
    this.owner=owner;this.repo=repo;this.branch=branch;this.path=path;this.token=token;this.sha=null;this.saving=false;
    this.contentsUrl=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  }
  headers(accept='application/vnd.github+json') {return {Accept:accept,'X-GitHub-Api-Version':'2026-03-10',...(this.token?{Authorization:`Bearer ${this.token}`}:{})};}
  async request(url,options={}) {
    if(new URL(url).origin!=='https://api.github.com')throw new Error('Origine API refusée.');
    const response=await fetch(url,{credentials:'omit',...options,headers:{...this.headers(),...options.headers}});
    if(!response.ok){const error=new Error(response.status===409?'Conflit: le fichier GitHub a changé. Conserver/exporter le travail local et recharger avant de fusionner les modifications.':`GitHub: ${response.status} ${response.statusText}`);error.status=response.status;throw error;}
    return response;
  }
  async load() {
    const metadata=await (await this.request(`${this.contentsUrl}?ref=${encodeURIComponent(this.branch)}`)).json();
    if(!metadata.sha||!metadata.git_url||metadata.type!=='file')throw new Error('La cible GitHub n’est pas un fichier.');
    // Read the immutable blob, not a branch URL that might change between requests.
    const raw=await (await this.request(metadata.git_url,{headers:this.headers('application/vnd.github.raw+json')})).text();
    const project=validateProject(JSON.parse(raw));this.sha=metadata.sha;return project;
  }
  async save(project,message='Update manuscript data') {
    if(!this.token)throw new Error('Un token avec Contents: write est requis.');
    if(this.saving)throw new Error('Un enregistrement est déjà en cours.');
    validateProject(project);this.saving=true;
    try {
      if(!this.sha){
        try{await this.request(`${this.contentsUrl}?ref=${encodeURIComponent(this.branch)}`);throw new Error('Le fichier existe déjà: charger sa version GitHub avant de l’éditer.');}
        catch(error){if(error.status!==404)throw error;}
      }
      const payload={message,branch:this.branch,content:encodeUtf8(JSON.stringify(project,null,2)),...(this.sha?{sha:this.sha}:{})};
      const result=await (await this.request(this.contentsUrl,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json();
      if(!result.content?.sha)throw new Error('Réponse GitHub sans confirmation du fichier.');
      this.sha=result.content.sha;return {sha:this.sha,commit:result.commit?.sha,url:result.commit?.html_url};
    }finally{this.saving=false;}
  }
  forget(){this.token='';this.sha=null;}
}
