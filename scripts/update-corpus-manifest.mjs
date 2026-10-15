import fs from 'node:fs/promises';
const directory=new URL('../xml-alto/',import.meta.url);
async function xmlFiles(folder,prefix=''){
  const files=[];
  for(const entry of await fs.readdir(folder,{withFileTypes:true})){
    if(entry.isDirectory())files.push(...await xmlFiles(new URL(encodeURIComponent(entry.name)+'/',folder),prefix+entry.name+'/'));
    else if(entry.isFile()&&/\.xml$/i.test(entry.name))files.push(prefix+entry.name);
  }
  return files;
}
const files=(await xmlFiles(directory)).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
const path=new URL('manifest.json',directory),content=JSON.stringify({files},null,2)+'\n';
if(process.argv.includes('--check')){
  const current=JSON.parse(await fs.readFile(path,'utf8'));
  if(JSON.stringify(current.files)!==JSON.stringify(files)){
    console.error('Manifest XML incomplet ou périmé. Exécuter npm run update-corpus-manifest.');
    process.exitCode=1;
  }else console.log(`Manifest PASS: ${files.length} XML répertoriés.`);
}else{
  await fs.writeFile(path,content);
  console.log(`Manifest actualisé: ${files.length} XML.`);
}
