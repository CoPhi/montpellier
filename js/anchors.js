// UTF-16 offsets; LCS edit mapping is deliberately conservative when identity is ambiguous.
export async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function editMap(before,after){
  const a=[...before],b=[...after],n=a.length,m=b.length;
  const ao=[0],bo=[0];for(const c of a)ao.push(ao.at(-1)+c.length);for(const c of b)bo.push(bo.at(-1)+c.length);
  if((n+1)*(m+1)>2000000)return {before,after,ambiguous:true};
  const width=m+1,s=new Uint32Array((n+1)*width),p=new Uint32Array(s.length);
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)s[i*width+j]=a[i]===b[j]?1+s[(i+1)*width+j+1]:Math.max(s[(i+1)*width+j],s[i*width+j+1]);
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)p[i*width+j]=a[i-1]===b[j-1]?1+p[(i-1)*width+j-1]:Math.max(p[(i-1)*width+j],p[i*width+j-1]);
  const mapping=new Map(),unique=new Map();let i=0,j=0;
  while(i<n&&j<m){if(a[i]===b[j]){mapping.set(i,j);i++;j++;}else if(s[(i+1)*width+j]>=s[i*width+j+1])i++;else j++;}
  for(const [x,y] of mapping){let candidates=0;for(let z=0;z<m;z++)if(a[x]===b[z]&&p[x*width+z]+1+s[(x+1)*width+z+1]===s[0])candidates++;unique.set(x,candidates===1);}
  return {before,after,a,b,ao,bo,mapping,unique};
}
export function moveTarget(target,map){
  if(target.anchor==='ambiguous'||target.anchor==='removed')return {...target,changed:false};
  if(map.before===map.after)return {...target,anchor:'resolved',changed:false};
  if(map.ambiguous)return {...target,anchor:'ambiguous',changed:true};
  const {ao,bo,mapping,unique}=map,first=ao.indexOf(target.start),last=ao.indexOf(target.end);
  if(first<0||last<0||first>=last)return {...target,anchor:'ambiguous',changed:true};
  const mapped=[];for(let k=first;k<last;k++)mapped.push(mapping.get(k));
  const contiguous=mapped.every((x,k)=>x!==undefined&&(k===0||x===mapped[k-1]+1));
  if(contiguous){const start=bo[mapped[0]],end=bo[mapped.at(-1)+1],uncertain=mapped.some((_,k)=>!unique.get(first+k));return {...target,start,end,quote:map.after.slice(start,end),anchor:uncertain?'ambiguous':'resolved',changed:uncertain};}
  let left=first-1,right=last;while(left>=0&&!mapping.has(left))left--;while(right<map.a.length&&!mapping.has(right))right++;
  const start=left<0?0:bo[mapping.get(left)+1],end=right===map.a.length?map.after.length:bo[mapping.get(right)];
  return {...target,start,end,quote:map.after.slice(start,end),anchor:start===end?'removed':'resolved',changed:true};
}
