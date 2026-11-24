const methods={health:'GET',catalog:'GET',product:'GET','quote-preview':'POST','basket-preview':'POST','cost-preview':'POST','capacity-preview':'POST'};
const base='https://lechantilly-api.vercel.app/api/v1/';
const respond=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
export function createPreviewHandler(env,fetcher=fetch){return async req=>{
 if(env.VERCEL_ENV!=='preview')return respond({error:{message:'Solo entorno de desarrollo'}},404);
 const url=new URL(req.url),resource=url.searchParams.get('resource');if(!Object.hasOwn(methods,resource)||url.searchParams.getAll('resource').length!==1||url.href.length>2048)return respond({error:{message:'Ruta inválida'}},400);
 if(req.method!==methods[resource])return respond({error:{message:'Método no permitido'}},405);
 if(req.method==='POST'&&(req.headers.get('origin')!==url.origin||!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||'')))return respond({error:{message:'Origen o formato inválido'}},403);
 const target=new URL(base+resource);url.searchParams.delete('resource');const allowed=resource==='catalog'?['category','q']:resource==='product'?['id']:[];for(const [k,v] of url.searchParams){if(k==='x-vercel-protection-bypass'||k==='x-vercel-set-bypass-cookie')continue;if(!allowed.includes(k)||target.searchParams.has(k))return respond({error:{message:'Parámetros inválidos'}},400);target.searchParams.append(k,v)}
 let body;
 if(req.method==='POST'){if([...target.searchParams].length)return respond({error:{message:'Parámetros no admitidos'}},400);const reader=req.body?.getReader();if(!reader)return respond({error:{message:'Solicitud vacía'}},400);let size=0;const chunks=[];try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>16384){await reader.cancel();return respond({error:{message:'Solicitud demasiado grande'}},413)}chunks.push(x.value)}}finally{reader.releaseLock()}body=new Uint8Array(size);let offset=0;for(const a of chunks){body.set(a,offset);offset+=a.byteLength}}
 try{const r=await fetcher(target,{method:req.method,body,headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});const d=await r.json();return respond(d,r.status)}catch{return respond({error:{message:'Servicio de consulta no disponible'}},503)}
 }}
export default {fetch:createPreviewHandler(process.env)};
