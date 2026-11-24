// Opt-in development only. No live storefront connection, no private or service-role key.
export function developmentMode(env){return env.LC_CATALOG_MODE==='development-db'&&(!env.VERCEL||env.VERCEL_ENV==='preview')&&env.NODE_ENV!=='test'}
export async function loadDevelopmentCatalog(env,fetcher=fetch){
 if(!developmentMode(env))throw Error('Development database not enabled');
 const base=env.LC_SUPABASE_URL,key=env.LC_SUPABASE_PUBLISHABLE_KEY,id=env.LC_BUSINESS_ID;
 if(typeof base!=='string'||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(base)||typeof key!=='string'||!key.startsWith('sb_publishable_')||typeof id!=='string'||!(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)))throw Error('Development database configuration invalid');
 const url=new URL(base+'/rest/v1/lc_catalog_public');url.searchParams.set('business_id','eq.'+id);url.searchParams.set('select','publication,revision,snapshot');url.searchParams.set('limit','1');
 const response=await fetcher(url,{headers:{apikey:key,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Catalog source unavailable');
 const rows=await response.json();if(!Array.isArray(rows)||rows.length!==1||rows[0]?.snapshot?.schemaVersion!==2||rows[0].snapshot.mode!=='development-preview'||rows[0].snapshot.commerceEnabled!==false)throw Error('No approved preview publication');
 return {...rows[0].snapshot,publication:rows[0].publication,revision:rows[0].revision};
}
export function developmentDispatch(c,resource,query){
 const error=(status,code,message)=>({status,data:{error:{code,message}}});
 if(resource==='catalog'){
 if(Object.keys(query).some(k=>!['category','q'].includes(k))||typeof(query.q??'')!=='string'||(query.q??'').length>120)return error(400,'INVALID_QUERY','Filtro inválido');
 const cat=query.category??'all';if(cat!=='all'&&!c.categories.some(x=>x.id===cat||x.slug===cat))return error(400,'INVALID_QUERY','Categoría inválida');
 const norm=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const id=c.categories.find(x=>x.slug===cat||x.id===cat)?.id;
 return {status:200,data:{...c,products:c.products.filter(p=>(cat==='all'||p.categoryIds.includes(id))&&norm(p.name+' '+p.description).includes(norm(query.q??'')))}};
 }
 if(resource==='product'){if(Object.keys(query).length!==1||typeof query.id!=='string'||query.id.length>120)return error(400,'INVALID_QUERY','Referencia inválida');const p=c.products.find(p=>p.slug===query.id);return p?{status:200,data:p}:error(404,'PRODUCT_NOT_FOUND','Referencia no encontrada')}
 return error(409,'PREVIEW_READ_ONLY','Las consultas y pedidos del catálogo de desarrollo están deshabilitados hasta validar las presentaciones.');
}
