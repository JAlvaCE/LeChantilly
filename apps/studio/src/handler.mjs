// Same-origin development BFF; never use a service role. The DB checks ownership/MFA.
const COOKIE='__Host-lc_studio',UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(status,message)=>Object.assign(Error(message),{status});
export function settings(env){
 const base=env.LC_STUDIO_SUPABASE_URL,key=env.LC_STUDIO_PUBLISHABLE_KEY,b=env.LC_STUDIO_BUSINESS_ID;
 if(env.VERCEL_ENV!=='preview'||base!=='https://vrjfyslozdnkgtbgupjx.supabase.co'||typeof key!=='string'||!key.startsWith('sb_publishable_')||!UUID.test(b||''))return null;
 const owner=String(env.LC_STUDIO_OWNER_EMAIL||'').trim().toLowerCase();
 return {base,key,b,enabled:env.LC_STUDIO_AUTH_ENABLED==='true'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner),owner};
}
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
function exact(d,keys){if(!plain(d)||Object.keys(d).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(d,k)))throw fail(400,'Solicitud inválida')}
function number(x,min=0){if(!Number.isSafeInteger(x)||x<min)throw fail(400,'Versión inválida');return x}
function tokenFrom(req){const items=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));if(items.length!==1)return null;const t=items[0].slice(COOKIE.length+1);return t.length<3800&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)?t:null}
function sessionCookie(t,expires){if(typeof t!=='string'||t.length>=3800||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t))throw fail(502,'Sesión inválida');return COOKIE+'='+t+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+Math.min(900,Math.max(1,Number.isSafeInteger(expires)?expires:900))}
const clearCookie=COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0';
async function readBody(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))throw fail(415,'Formato no admitido');
 const declared=Number(req.headers.get('content-length')||0);if(!Number.isFinite(declared)||declared<0||declared>550000)throw fail(413,'Solicitud demasiado grande');
 const reader=req.body?.getReader();if(!reader)throw fail(400,'Solicitud vacía');let size=0;const chunks=[];
 try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>550000){await reader.cancel();throw fail(413,'Solicitud demasiado grande')}chunks.push(x.value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{throw fail(400,'Solicitud inválida')}
}
export function createStudioHandler(env,fetcher=fetch){
 const config=settings(env);
 async function call(path,{method='GET',body,token}={}){
  const headers={apikey:config.key,Accept:'application/json'};if(token)headers.Authorization='Bearer '+token;if(body!==undefined)headers['Content-Type']='application/json';
  let response;try{response=await fetcher(config.base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)})}catch{throw fail(503,'No pudimos conectar con el servicio. Intenta de nuevo.')}
  let d=null;try{d=await response.json()}catch{}
  if(!response.ok){const code=d?.code;if(response.status===429)throw fail(429,'Demasiados intentos. Espera antes de volver a intentar.');if(code==='40001')throw fail(409,'Hay cambios más recientes. No se guardó tu edición.');if(response.status===401||response.status===403||code==='42501')throw fail(403,'Acceso no autorizado o sesión vencida.');if(typeof code==='string'&&/^(22|23)/.test(code))throw fail(422,'Hay datos incompletos o incompatibles. Revisa las categorías, presentaciones y cantidades.');throw fail(response.status>=500?503:400,'No se pudo completar la operación.')}
  return d;
 }
 const rpc=(name,args,token)=>call('/rest/v1/rpc/'+name,{method:'POST',body:args,token});
 async function context(token){if(!token)throw fail(401,'Inicia sesión de nuevo.');const user=await call('/auth/v1/user',{token});if(!user||!UUID.test(user.id||'')||String(user.email||'').toLowerCase()!==config.owner)throw fail(403,'Acceso no autorizado.');const ctx=await rpc('lc_owner_context',{b:config.b},token);if(ctx?.owner!==true||!['aal1','aal2'].includes(ctx.aal))throw fail(403,'Acceso no autorizado.');return {user,aal:ctx.aal}}
 function factors(user){return Array.isArray(user.factors)?user.factors.filter(f=>f.factor_type==='totp'&&f.status==='verified'&&UUID.test(f.id||'')).map(f=>({id:f.id})):[]}
 return async function handle(req){
  const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});
  const send=(data,status=200,cookie)=>{if(cookie)headers.set('Set-Cookie',cookie);return new Response(JSON.stringify(data),{status,headers})};
  try{
   if(!config)throw fail(503,'Este portal solo está habilitado en desarrollo.');
   const url=new URL(req.url);if(url.search)throw fail(400,'Parámetros no admitidos');
   if(req.method==='GET'){
    const rows=await call('/rest/v1/lc_catalog_public?select=publication&business_id=eq.'+config.b+'&limit=1');
    if(!Array.isArray(rows))throw fail(503,'Respuesta de base de datos inválida');
    return send({environment:'development',database:'connected',published:rows.length===1,authEnabled:config.enabled,commerceEnabled:false});
   }
   if(req.method!=='POST')throw fail(405,'Método no admitido');
   if(req.headers.get('origin')!==url.origin||req.headers.get('sec-fetch-site')==='cross-site')throw fail(403,'Origen no autorizado.');
   if(!config.enabled)throw fail(503,'El acceso privado requiere invitación y configuración segura.');
   const d=await readBody(req);if(!plain(d)||typeof d.action!=='string')throw fail(400,'Solicitud inválida');
   if(d.action==='send'){exact(d,['action','email']);const email=typeof d.email==='string'?d.email.trim().toLowerCase():'';if(email===config.owner){await call('/auth/v1/otp',{method:'POST',body:{email,create_user:false}})}return send({ok:true})}
   if(d.action==='verify'){exact(d,['action','email','code']);if(typeof d.email!=='string'||d.email.trim().toLowerCase()!==config.owner||typeof d.code!=='string'||!/^\d{6}$/.test(d.code))throw fail(400,'Código o correo no válido.');const r=await call('/auth/v1/verify',{method:'POST',body:{email:config.owner,token:d.code,type:'email'}});const ctx=await context(r?.access_token);return send({aal:ctx.aal,factors:factors(ctx.user)},200,sessionCookie(r.access_token,r.expires_in))}
   const token=tokenFrom(req);
   if(d.action==='logout'){exact(d,['action']);if(token){try{await call('/auth/v1/logout?scope=local',{method:'POST',token})}catch{}}return send({ok:true},200,clearCookie)}
   const ctx=await context(token);
   if(d.action==='session'){exact(d,['action']);return send({aal:ctx.aal,factors:factors(ctx.user)})}
   if(d.action==='enroll'){exact(d,['action']);if(ctx.aal!=='aal1'||factors(ctx.user).length)throw fail(409,'Ya tienes un segundo factor.');if(Array.isArray(ctx.user.factors)&&ctx.user.factors.some(f=>f.factor_type==='totp'&&f.status!=='verified'))throw fail(409,'Hay una configuración incompleta. Solicita ayuda para recuperarla.');const r=await call('/auth/v1/factors',{method:'POST',token,body:{factor_type:'totp',friendly_name:'Le Chantilly'}});if(!UUID.test(r?.id||'')||typeof r?.totp?.secret!=='string'||!/^[A-Z2-7]{16,128}$/.test(r.totp.secret))throw fail(502,'Configuración no válida.');return send({id:r.id,secret:r.totp.secret})}
   if(d.action==='mfa'){exact(d,['action','factor','code']);if(ctx.aal!=='aal1'||!UUID.test(d.factor||'')||typeof d.code!=='string'||!/^\d{6}$/.test(d.code)||!ctx.user.factors?.some(f=>f.id===d.factor&&f.factor_type==='totp'))throw fail(400,'Código no válido.');const c=await call('/auth/v1/factors/'+d.factor+'/challenge',{method:'POST',token,body:{}});if(!UUID.test(c?.id||''))throw fail(502,'Verificación no válida.');const r=await call('/auth/v1/factors/'+d.factor+'/verify',{method:'POST',token,body:{challenge_id:c.id,code:d.code}});const upgraded=await context(r?.access_token);if(upgraded.aal!=='aal2')throw fail(403,'Segundo factor no verificado.');return send({aal:'aal2'},200,sessionCookie(r.access_token,r.expires_in))}
   if(ctx.aal!=='aal2')throw fail(403,'Completa la verificación de seguridad.');
   if(d.action==='read'){exact(d,['action']);return send(await rpc('lc_read_catalog',{b:config.b},token))}
   if(d.action==='history'){exact(d,['action']);return send(await rpc('lc_catalog_history',{b:config.b},token))}
   if(d.action==='save'){exact(d,['action','expected','document']);if(!plain(d.document))throw fail(400,'Catálogo inválido');return send({revision:await rpc('lc_save_catalog',{b:config.b,expected:number(d.expected),d:d.document},token)})}
   if(d.action==='publish'){exact(d,['action','revision','expectedPublication','expectedDraft']);return send({publication:await rpc('lc_publish_catalog',{b:config.b,r:number(d.revision,1),expected_publication:number(d.expectedPublication),expected_draft:number(d.expectedDraft)},token)})}
   throw fail(400,'Acción no admitida');
  }catch(e){return send({error:{message:e.status?e.message:'No se pudo completar la operación.'}},e.status||500)}
 };
}
