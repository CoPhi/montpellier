import {updateLine} from './model.js';
export function fillEditor(line,textarea,information) {
  textarea.value=line?.text||'';textarea.disabled=!line||line.strings.length!==1;
  information.textContent=line?`${line.id} · ${line.zone} · confiance de l’export ${line.confidence??'absent'}`:'Sélectionner une ligne.';
}
export function applyEdit(model,lineKey,text){return updateLine(model,lineKey,text);}
