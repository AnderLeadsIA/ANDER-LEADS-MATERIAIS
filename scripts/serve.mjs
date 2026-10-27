import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir = path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
  try{
    const url = new URL(req.url,'http://localhost');
    const decoded=decodeURIComponent(url.pathname);
    let file=path.resolve(dir,'.'+decoded);
    if(!file.startsWith(dir+path.sep) && file!==path.resolve(dir)) {res.writeHead(403);res.end();return;}
    let info=await stat(file);
    if(info.isDirectory()) {
      if(!url.pathname.endsWith('/')) {res.writeHead(308,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(e){
    if(e instanceof URIError){res.writeHead(400);res.end('Invalid URL');return;}
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(path.join(dir,'404.html')));
  }
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
