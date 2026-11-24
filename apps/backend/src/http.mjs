import {dispatch,allowedMethod} from './service.mjs';
import {randomUUID} from 'node:crypto';
const allowedOrigins=new Set(['https://lechantilly.vercel.app']);
if(process.env.LECHANTILLY_LOCAL_DEV==='true'&&process.env.VERCEL!=='1'&&process.env.NODE_ENV!=='production'){allowedOrigins.add('http://localhost:8000');allowedOrigins.add('http://127.0.0.1:8000')}
const MAX_BYTES=16384;
const fail=(status,message)=>Object.assign(Error(message),{status});
async function readJson(request){
 const type=request.headers.get('content-type')||'';
 if(!/^application\/json(?:\s*;|$)/i.test(type))throw fail(415,'Se requiere application/json');
 const length=Number(request.headers.get('content-length')||0);if(!Number.isFinite(length)||length<0)throw fail(400,'Longitud inválida');if(length>MAX_BYTES)throw fail(413,'Solicitud demasiado grande');
 const reader=request.body?.getReader();if(!reader)throw fail(400,'Solicitud vacía');
 let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw fail(413,'Solicitud demasiado grande')}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw fail(400,'JSON inválido')}
}
export function endpoint(resource){return {async fetch(request){
 const id=randomUUID(),start=Date.now(),origin=request.headers.get('origin');
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",'Vary':'Origin, Access-Control-Request-Method, Access-Control-Request-Headers','Allow':allowedMethod(resource)+', OPTIONS','X-Request-Id':id,'Access-Control-Expose-Headers':'X-Request-Id, Retry-After'});
 if(origin&&allowedOrigins.has(origin))headers.set('Access-Control-Allow-Origin',origin);
 // Structured operational logs: no body, query values, IP, cookies, token or customer data.
 const send=(data,status)=>{if(status>=400)console[status>=500?'error':'warn'](JSON.stringify({event:'api_rejected',requestId:id,resource,status,durationMs:Date.now()-start}));return new Response(JSON.stringify(data),{status,headers})};
 const reject=(status,code,message)=>send({error:{code,message,requestId:id}},status);
 if(origin&&!allowedOrigins.has(origin))return reject(403,'ORIGIN_NOT_ALLOWED','Origen no autorizado');
 if(request.method==='OPTIONS'){const requested=request.headers.get('access-control-request-method');if(requested&&requested!==allowedMethod(resource))return reject(405,'METHOD_NOT_ALLOWED','Método no permitido');const requestedHeaders=(request.headers.get('access-control-request-headers')||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);if(requestedHeaders.some(x=>!['content-type','accept'].includes(x)))return reject(400,'INVALID_HEADERS','Cabeceras no permitidas');headers.set('Access-Control-Allow-Methods',allowedMethod(resource)+', OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, Accept');headers.set('Access-Control-Max-Age','600');return new Response(null,{status:204,headers})}
 if(request.method!==allowedMethod(resource))return reject(405,'METHOD_NOT_ALLOWED','Método no permitido');
 try{if(request.url.length>2048)return reject(414,'URI_TOO_LONG','URL demasiado larga');const params=new URL(request.url).searchParams,query={};for(const [k,v] of params){if(Object.hasOwn(query,k)||['__proto__','constructor','prototype'].includes(k))return reject(400,'INVALID_QUERY','Parámetros inválidos');Object.defineProperty(query,k,{value:v,enumerable:true})}if(request.method==='POST'&&Object.keys(query).length)return reject(400,'INVALID_QUERY','No se admiten parámetros');const body=request.method==='POST'?await readJson(request):{};const result=dispatch(resource,request.method,body,query);if(result.status>=400&&result.data.error)result.data.error.requestId=id;return send(result.data,result.status)}
 catch(e){const status=[400,413,415].includes(e?.status)?e.status:500;return reject(status,status===500?'INTERNAL_ERROR':'INVALID_REQUEST',status===500?'Error interno':e.message)}
}}}
