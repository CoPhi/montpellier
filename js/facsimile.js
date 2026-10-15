import {Viewport} from './viewport.js';
const SVG='http://www.w3.org/2000/svg';
const basename=name=>name.split('/').at(-1);
const svgNode=(tag,attributes={})=>{const node=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attributes))node.setAttribute(k,v);return node;};
export function lineCrop(line,padding=4) {
  const [x,y,w,h]=line.bbox,p=line.page,left=Math.max(0,x-padding),top=Math.max(0,y-padding);
  return [left,top,Math.max(1,Math.min(p.width,x+w+padding)-left),Math.max(1,Math.min(p.height,y+h+padding)-top)];
}
export class Facsimile {
  constructor(svg,message) {
    this.svg=svg;this.message=message;this.urls=new Map();this.line=null;this.page=null;this.base='images/';this.viewport=null;this.pointers=new Map();
    this.installNavigation();
  }
  imageUrl(page) {
    const name=basename(page.imageName);if(!name)return null;
    return this.urls.get(name)||(this.base?this.base.replace(/\/?$/,'/')+encodeURIComponent(name):null);
  }
  addImages(images) {
    for(const image of images) {
      const name=basename(image.name),old=this.urls.get(name);if(old)URL.revokeObjectURL(old);
      const type=/\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':/\.gif$/i.test(name)?'image/gif':'image/jpeg';
      this.urls.set(name,URL.createObjectURL(new Blob([image.bytes],{type})));
    }
    if(this.page)this.show(this.page,this.line);
  }
  clearImages(){for(const url of this.urls.values())URL.revokeObjectURL(url);this.urls.clear();this.page=null;this.line=null;this.pointers.clear();}
  show(page,line=null) {
    this.page=page;this.line=line;this.svg.replaceChildren();if(!page)return;
    this.viewport=new Viewport(page.width,page.height);this.applyView();const url=this.imageUrl(page);
    this.message.textContent=(page.imageName||'Nom d’image absent')+(line?' · ligne '+line.id:'');
    if(!url){this.message.textContent+=' · ajouter une image pour cette page';return;}
    const image=svgNode('image',{href:url,width:page.width,height:page.height,preserveAspectRatio:'none'});
    image.addEventListener('error',()=>{if(this.page===page)this.message.textContent='Image indisponible: '+page.imageName+'. Utiliser « Images ». La transcription reste consultable.';});this.svg.append(image);
    if(line) {
      const shape=svgNode(line.polygon?'polygon':'rect');
      if(line.polygon){const v=line.polygon.trim().split(/[\s,]+/);shape.setAttribute('points',Array.from({length:v.length/2},(_,i)=>v[2*i]+','+v[2*i+1]).join(' '));}
      else ['x','y','width','height'].forEach((key,i)=>shape.setAttribute(key,line.bbox[i]));
      for(const [k,v] of Object.entries({fill:'#466b99','fill-opacity':'.10',stroke:'#17365d','stroke-width':'1.5','vector-effect':'non-scaling-stroke'}))shape.setAttribute(k,v);
      shape.style.pointerEvents='none';this.svg.append(shape);this.focus();
    }
  }
  applyView(){if(this.viewport)this.svg.setAttribute('viewBox',this.viewport.view.join(' '));}
  full(){this.viewport?.full();this.applyView();}
  focus() {
    if(!this.line)return this.full();
    const rect=this.svg.getBoundingClientRect();this.viewport.focus(this.line.bbox,(rect.width||640)/(rect.height||430));this.applyView();
  }
  zoom(factor,point=null){this.viewport?.zoom(factor,point);this.applyView();}
  pan(dx,dy){this.viewport?.pan(dx,dy);this.applyView();}
  clientPoint(x,y) {
    const matrix=this.svg.getScreenCTM();if(!matrix)return null;
    const point=this.svg.createSVGPoint();point.x=x;point.y=y;const result=point.matrixTransform(matrix.inverse());return [result.x,result.y];
  }
  installNavigation() {
    const svg=this.svg;
    svg.addEventListener('wheel',event=>{
      if(!this.viewport)return;event.preventDefault();
      const unit=event.deltaMode===1?16:event.deltaMode===2?svg.clientHeight:1;
      if(event.shiftKey){const a=this.clientPoint(0,0),b=this.clientPoint(event.deltaX*unit||event.deltaY*unit,event.deltaY*unit);if(a&&b)this.pan(b[0]-a[0],b[1]-a[1]);}
      else this.zoom(Math.exp(-Math.max(-300,Math.min(300,event.deltaY*unit))*.003),this.clientPoint(event.clientX,event.clientY));
    },{passive:false});
    svg.addEventListener('pointerdown',event=>{
      if(!this.viewport || (event.pointerType==='mouse'&&event.button!==0))return;
      event.preventDefault();svg.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});svg.classList.add('panning');
    });
    svg.addEventListener('pointermove',event=>{
      if(!this.pointers.has(event.pointerId))return;event.preventDefault();
      const before=[...this.pointers.values()];this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...this.pointers.values()];
      const center=list=>({x:list.reduce((s,p)=>s+p.x,0)/list.length,y:list.reduce((s,p)=>s+p.y,0)/list.length});
      const oldCenter=center(before),newCenter=center(after),a=this.clientPoint(oldCenter.x,oldCenter.y),b=this.clientPoint(newCenter.x,newCenter.y);
      if(a&&b)this.pan(a[0]-b[0],a[1]-b[1]);
      if(before.length===2){
        const distance=list=>Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y),oldDistance=distance(before);
        if(oldDistance>0)this.zoom(distance(after)/oldDistance,this.clientPoint(newCenter.x,newCenter.y));
      }
    });
    const release=event=>{this.pointers.delete(event.pointerId);if(!this.pointers.size)svg.classList.remove('panning');};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(name,release);
    svg.addEventListener('keydown',event=>{
      if(!this.viewport)return;const [, ,w,h]=this.viewport.view;
      const actions={'+':()=>this.zoom(1.4),'=':()=>this.zoom(1.4),'-':()=>this.zoom(1/1.4),Home:()=>this.full(),l:()=>this.focus(),ArrowLeft:()=>this.pan(-w*.1,0),ArrowRight:()=>this.pan(w*.1,0),ArrowUp:()=>this.pan(0,-h*.1),ArrowDown:()=>this.pan(0,h*.1)};
      if(actions[event.key]){event.preventDefault();actions[event.key]();}
    });
  }
  thumbnail(line,onSelect) {
    const strip=document.createElement('div');strip.className='line-strip';
    const button=document.createElement('button');button.className='line-thumbnail';button.onclick=()=>onSelect(line);
    button.setAttribute('aria-label','Voir la ligne '+line.id+' dans le fac-similé');
    button.dataset.tooltip='Ouvrir cette ligne dans le fac-similé, puis zoomer ou déplacer l’image.';
    const crop=lineCrop(line),url=this.imageUrl(line.page);
    if(!url){button.textContent='Image à ajouter: '+line.page.imageName;strip.append(button);return strip;}
    const svg=svgNode('svg',{viewBox:crop.join(' '),width:Math.max(120,72*crop[2]/crop[3]),height:72,'aria-hidden':'true'});
    const image=svgNode('image',{href:url,width:line.page.width,height:line.page.height,preserveAspectRatio:'none'});
    image.addEventListener('error',()=>{button.replaceChildren(document.createTextNode('Image indisponible: '+line.page.imageName));button.classList.add('missing-image');});
    svg.append(image);button.append(svg);strip.append(button);return strip;
  }
}
