import {vocabulary} from './index.js';
export function frequencyRange(index,min=1,max=Infinity){if(!Number.isInteger(min)||min<1||!(max===Infinity||Number.isInteger(max))||max<min)throw new Error('Fréquences: choisir des entiers, min. ≥ 1 et max. ≥ min.');return vocabulary(index).filter(v=>v.count>=min&&v.count<=max);}
