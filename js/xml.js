export const localName = name => (name || '').split(':').at(-1);
export function* elements(node) {
  if (node?.type === 'element') yield node;
  for (const child of node?.elements || []) yield* elements(child);
}
export const descendants = (node, name) => [...elements(node)].filter(e => localName(e.name) === name);
export const children = (node, name) => (node?.elements || []).filter(e => e.type === 'element' && (!name || localName(e.name) === name));
export const rootElement = tree => children(tree)[0];
export function parseXml(text) {
  if (/<!DOCTYPE/i.test(text)) throw new Error('Les déclarations DOCTYPE ne sont pas prises en charge.');
  // The bundled parser is permissive about duplicate attributes and multiple roots.
  // Use the native browser validator, plus deterministic checks for Node-based tests.
  if (globalThis.DOMParser) {
    const parsed = new DOMParser().parseFromString(text, 'application/xml');
    if (parsed.getElementsByTagName('parsererror').length) throw new Error('XML mal formé.');
  }
  const markup = text.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g, '');
  for (const tag of markup.matchAll(/<[A-Za-z_][A-Za-z0-9_.:-]*(?:\s(?:[^"'<>]|"[^"]*"|'[^']*')*)?\s*\/?\>/g)) {
    const seen = new Set();
    for (const attribute of tag[0].matchAll(/([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*(?:"[^"]*"|'[^']*')/g)) {
      if (seen.has(attribute[1])) throw new Error(`XML mal formé: attribut dupliqué ${attribute[1]}.`);
      seen.add(attribute[1]);
    }
  }
  const tree = globalThis.xml2js(text, {compact:false, alwaysChildren:true});
  if (children(tree).length !== 1) throw new Error('XML doit contenir exactement un élément racine.');
  return tree;
}
export function serializeXml(tree) {
  const escapeText=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escapeAttribute=value=>escapeText(value).replace(/"/g,'&quot;').replace(/\r/g,'&#13;').replace(/\n/g,'&#10;').replace(/\t/g,'&#9;');
  const name=value=>{if(!/^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value))throw new Error(`Nom XML invalide: ${value}`);return value;};
  const attributes=obj=>Object.entries(obj||{}).map(([k,v])=>` ${name(k)}="${escapeAttribute(v)}"`).join('');
  const write=node=>{
    if(node.type==='element'){const tag=name(node.name),a=attributes(node.attributes);return node.elements?.length?`<${tag}${a}>${node.elements.map(write).join('')}</${tag}>`:`<${tag}${a}/>`;}
    if(node.type==='text')return escapeText(node.text||'');
    if(node.type==='cdata')return `<![CDATA[${String(node.cdata||'').replace(/\]\]>/g,']]]]><![CDATA[>')}]]>`;
    if(node.type==='comment')return `<!--${node.comment||''}-->`;
    if(node.type==='instruction')return `<?${name(node.name)} ${node.instruction||''}?>`;
    throw new Error(`Type de nœud XML non pris en charge: ${node.type}`);
  };
  return (tree.declaration?`<?xml${attributes(tree.declaration.attributes)}?>`:'')+(tree.elements||[]).map(write).join('');
}
export function textOf(node) {
  return (node?.elements || []).map(c => c.type === 'text' ? c.text : c.type === 'cdata' ? c.cdata : textOf(c)).join('');
}
export function xmlElement(name, attributes={}, nested=[]) {return {type:'element',name,attributes,elements:nested};}
export const xmlText = text => ({type:'text',text});
