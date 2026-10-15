import {parseXml, serializeXml, rootElement, descendants, localName} from './xml.js';
export function importAlto(name, text) {
  const tree = parseXml(text), root = rootElement(tree);
  if (localName(root.name) !== 'alto') throw new Error(`${name}: ce fichier n'est pas un ALTO.`);
  const ns = root.attributes?.xmlns || root.attributes?.[`xmlns:${root.name.split(':')[0]}`];
  if (!ns || !/loc.gov\/standards\/alto\/ns-v\d+#/.test(ns)) throw new Error(`${name}: espace de noms ALTO non reconnu.`);
  if (descendants(tree, 'Page').length !== 1) throw new Error(`${name}: une page ALTO par fichier est requise dans cette version.`);
  return {name,tree};
}
export function exportAlto(document) {return serializeXml(document.tree);}
export function exportAllAlto(project) {
  return project.documents.map(document => ({name:document.name,content:exportAlto(document)}));
}
