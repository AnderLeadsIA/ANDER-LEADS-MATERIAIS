import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {root,build,whatsapp} from './build.mjs';
await build();
const dist=path.join(root,'dist');
const read=file=>readFile(path.join(dist,file),'utf8');
const catalog=JSON.parse(await readFile(path.join(root,'catalog.json'),'utf8'));
test('Todos os links locais apontam para arquivos reais; páginas têm SEO e WhatsApp correto',async()=>{
  const files=(await readdir(dist,{recursive:true})).filter(name=>name.endsWith('.html'));
  for(const file of files){
    const html=await read(file);
    assert.match(html,/<html lang="pt-BR"/);
    assert.match(html,/<title>/);
    assert.match(html,/<meta name="description"/);
    assert.match(html,/og:title/);
    for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
      let local=decodeURIComponent(match[1]);
      if(local.endsWith('/')) local+='index.html';
      assert.ok((await readFile(path.join(dist,local))).length,`${file}: ${local}`);
    }
    for(const match of html.matchAll(/https:\/\/wa\.me\/([^"?]+)/g)) assert.equal(match[1],'5511915627350');
  }
  for(const m of catalog){
    assert.ok((await read(m.slug+'/index.html')).includes(m.title));
    assert.equal(new URL(whatsapp(m.message)).searchParams.get('text'),m.message);
  }
});
test('Tutorial público conserva 5 fotos de exemplo autorizadas, gerador e campos vazios',async()=>{
  const html=await read('materiais/flow-localizacao.html');
  assert.equal((html.match(/data:image\/jpeg;base64,/g)||[]).length,5);
  assert.doesNotMatch(html,/data:image\/svg|value="[^"]+"|5514991291256/i);
  assert.match(html,/navigator.clipboard.writeText/);
  assert.match(html,/URL.createObjectURL/);
  const elements=Object.fromEntries(['company','address','prompt','copy','download'].map(id=>[id,{value:'',textContent:'',addEventListener(){}}]));
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const context={document:{getElementById:id=>elements[id]}};
  vm.createContext(context);vm.runInContext(script,context);
  assert.match(elements.prompt.textContent,/\[COMPANY NAME\]/);
  elements.company.value='Empresa de teste';elements.address.value='Endereço de teste';
  vm.runInContext('generate()',context);
  assert.match(elements.prompt.textContent,/Empresa de teste/);
  assert.match(elements.prompt.textContent,/Endereço de teste/);
});
test('Checklist conserva as quatro seções, armazenamento e impressão',async()=>{
  const html=await read('materiais/checklist-google-ads.html');
  for(const token of ['essenciais','planejamento','tecnico','acompanhamento','localStorage','window.print()','Limpar marcações']) assert.ok(html.includes(token),token);
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const declaration=script.slice(0,script.indexOf('const labels='));
  const context={};vm.createContext(context);
  vm.runInContext(declaration+';globalThis.count=groups.essenciais.length;',context);
  assert.equal(context.count,8);
});
test('Build não aceita artefato fora da lista explícita',async()=>{
  const sentinel=path.join(dist,'unapproved-test.txt');
  await writeFile(sentinel,'test');
  try{await assert.rejects(build(),/Arquivo inesperado/);}finally{await unlink(sentinel);}
});
test('Nenhum laboratório, credencial ou fonte interna no pacote',async()=>{
  const files=await readdir(dist,{recursive:true});
  for(const file of files) assert.doesNotMatch(file,/laborat|reels|biblioteca_estilos|\.env|node_modules|original|\.git/i);
  const pdf=await readFile(path.join(dist,'materiais/google-ou-instagram.pdf'));
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');
});
test('HTTP entrega CSS, JS, PDF e rotas diretas; desconhecidas retornam 404',async()=>{
  const server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{cwd:root,env:{...process.env,PORT:'4188'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  try{
    await once(server.stdout,'data',{signal:AbortSignal.timeout(10000)});
    for(const route of ['/',...catalog.map(m=>'/'+m.slug+'/'),'/assets/site.css','/assets/site.js','/materiais/google-ou-instagram.pdf']){
      const response=await fetch('http://127.0.0.1:4188'+route,{signal:AbortSignal.timeout(5000)});
      assert.equal(response.status,200,route);
      assert.ok((await response.arrayBuffer()).byteLength>100,route);
    }
    const css=await fetch('http://127.0.0.1:4188/assets/site.css');
    assert.match(css.headers.get('content-type'),/text\/css/);
    assert.match(await css.text(),/:root/);
    assert.equal((await fetch('http://127.0.0.1:4188/checklists/google-ads',{redirect:'manual'})).status,308);
    assert.equal((await fetch('http://127.0.0.1:4188/nao-existe/')).status,404);
    assert.equal((await fetch('http://127.0.0.1:4188/.env')).status,404);
  }finally{server.kill();}
});
