// One shared tooltip: keyboard focus, mouse hover, Escape and touch long-press.
export function installTooltips(root=document) {
  const tip=document.createElement('div');tip.id='workbench-tooltip';tip.role='tooltip';tip.hidden=true;
  document.body.append(tip);let owner=null,timer,enabled=true;
  function hide(){clearTimeout(timer);if(owner)owner.removeAttribute('aria-describedby');owner=null;tip.hidden=true;}
  function show(target){
    const text=target?.dataset?.tooltip;if(!text||!enabled)return;
    hide();owner=target;tip.textContent=text;tip.hidden=false;target.setAttribute('aria-describedby',tip.id);
    const rect=target.getBoundingClientRect(),width=tip.offsetWidth;
    tip.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-width-8))+'px';
    const height=tip.offsetHeight;tip.style.top=(rect.bottom+height+12<window.innerHeight?rect.bottom+6:Math.max(8,rect.top-height-6))+'px';
  }
  root.addEventListener('pointerover',event=>{const target=event.target.closest?.('[data-tooltip]');if(target&&target!==owner)show(target);});
  root.addEventListener('pointerout',event=>{if(owner&&!owner.contains(event.relatedTarget))hide();});
  root.addEventListener('focusin',event=>show(event.target.closest?.('[data-tooltip]')));
  root.addEventListener('focusout',hide);
  root.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  root.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){const target=event.target.closest?.('[data-tooltip]');timer=setTimeout(()=>show(target),550);}});
  root.addEventListener('pointerup',()=>clearTimeout(timer));
  root.addEventListener('pointercancel',hide);
  window.addEventListener('scroll',hide,true);
  return {setEnabled(value){enabled=!!value;if(!enabled)hide();},get enabled(){return enabled;}};
}
