import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../.release/',import.meta.url)));
const port=Number(process.env.EXPERIENCE_PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
http.createServer(async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'local_preview_only',message:'No payment or telemetry providers are connected.'}));return;}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  try{
    let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';if(!path.extname(pathname))pathname+='.html';
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!['.html','.js','.css','.svg','.webp','.json','.txt','.xml'].includes(path.extname(file)))throw Error('not public');
    if(pathname.startsWith('/lib/')||pathname.includes('package'))throw Error('not public');
    await stat(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/experience`));
