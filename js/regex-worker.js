import {executeRegexJob} from './regex.js';
globalThis.onmessage=event=>{
  try{globalThis.postMessage({matches:executeRegexJob(event.data)});}
  catch(error){globalThis.postMessage({error:error.message});}
};
