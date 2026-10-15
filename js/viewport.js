// All values stay in the ALTO coordinate space, independent of image pixel dimensions.
export class Viewport {
  constructor(width,height){this.width=width;this.height=height;this.full();}
  full(){this.view=[0,0,this.width,this.height];return this.view;}
  set(view) {
    let [x,y,w,h]=view;
    if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return this.view;
    const ratio=Math.max(this.width/256/w,Math.min(1,this.width*4/w));
    w*=ratio;h*=ratio;
    x=w>=this.width?(this.width-w)/2:Math.max(0,Math.min(x,this.width-w));
    y=h>=this.height?(this.height-h)/2:Math.max(0,Math.min(y,this.height-h));
    this.view=[x,y,w,h];return this.view;
  }
  zoom(factor,point=null) {
    if(!(factor>0))return this.view;
    const [x,y,w,h]=this.view,[px,py]=point||[x+w/2,y+h/2];
    return this.set([px+(x-px)/factor,py+(y-py)/factor,w/factor,h/factor]);
  }
  pan(dx,dy){const [x,y,w,h]=this.view;return this.set([x+dx,y+dy,w,h]);}
  focus([x,y,w,h],aspect=1) {
    const pad=Math.max(20,h*.7);let vw=w+pad*2,vh=h+pad*2;
    if(vw/vh>aspect)vh=vw/aspect;else vw=vh*aspect;
    return this.set([x+w/2-vw/2,y+h/2-vh/2,vw,vh]);
  }
}
