import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
// Explicit, one-time import. Never scans/copies a directory or changes originals.
const source=process.argv[2];
if(!source) throw Error('Uso: node scripts/prepare-materials.mjs "pasta dos originais"');
const root=fileURLToPath(new URL('../',import.meta.url));
const catalog=JSON.parse(await readFile(path.join(root,'catalog.json'),'utf8'));
const allowlist=[
 ['Guia_Qual_Canal_Anunciar_AnderLeads.pdf','google-ou-instagram.pdf'],
 ['checklist_google_ads_anderleads.html','checklist-google-ads.html'],
 ['tutorial_flow_localizacao_atualizado.html','flow-localizacao.html']
];
const report=[];
await mkdir(path.join(root,'materials'),{recursive:true});
for(const [original,target] of allowlist){
  const data=await readFile(path.join(source,original));
  let publicData=data;
  if(target.endsWith('.html')){
    let html=data.toString('utf8');
    const material=catalog.find(m=>m.file===target);
    html=html.replace(/https:\/\/wa\.me\/\d+(?:\?[^"'<>\s]*)?/g,`https://wa.me/5511915627350?text=${encodeURIComponent(material.message)}`);
    if(target==='checklist-google-ads.html'){
      html=html.replace('</head>','<link rel="stylesheet" href="/assets/checklist.css"></head>');
      html=html.replace("el.className='item';", "el.className='item '+(['planejamento','acompanhamento'].includes(group)?'item-light':'');");
    }
    if(target==='flow-localizacao.html'){
      // Original example images explicitly authorized by the owner for this tutorial.
      const images=html.match(/<img\b[^>]*>/gi)||[];
      if(images.length!==5) throw Error('Tutorial alterado: revise as imagens antes de importar.');
      html=html.replace(/<img\b[^>]*>/gi,tag=>tag.replace(/>$/, ' loading="lazy" decoding="async">'));
      html=html.replace(/(<input\b[^>]*\bid="(?:company|address)"[^>]*\bvalue=")[^"]*(")/g,'$1$2');
      html=html.replace(/(<h1>[\s\S]*?<\/h1>)/,'$1<p class="note">Exemplo do material original: as imagens abaixo mostram o mapa, a fachada, o logo e as telas usados na demonstração. Para criar o seu vídeo, substitua essas referências pelos materiais da sua empresa.</p>');
      html=html.replace('</head>','<link rel="stylesheet" href="/assets/tutorial.css"><meta name="description" content="Tutorial de localização no Flow: prepare suas imagens, gere um prompt personalizado e copie ou baixe o texto."><style>input{max-width:100%;min-width:0}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #facc15;outline-offset:4px}</style></head>');
    }
    publicData=Buffer.from(html);
  }
  await writeFile(path.join(root,'materials',target),publicData);
  report.push({original,sha256:createHash('sha256').update(data).digest('hex'),publicFile:target,publicSha256:createHash('sha256').update(publicData).digest('hex')});
}
await writeFile(path.join(root,'originals-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log('3 materiais preparados; originais intactos. Confira originals-audit.json.');
