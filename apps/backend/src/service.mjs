import {validateCatalog,filterProducts,buildQuote,capacityPlan,costPlan} from './domain.mjs';
import catalog from './catalog-data.mjs';

const errors=validateCatalog(catalog);
if(errors.length)throw Error('Invalid release catalog');
// Public projection: never serialize future internal fields by default.
const productView=p=>({id:p.id,slug:p.slug,name:p.name,category:p.category,description:p.description,sourceUrl:p.sourceUrl,price:{amount:p.price.amount,currency:p.price.currency,mode:p.price.mode},availability:p.availability,image:p.image,variants:[],allergens:p.allergens,personalizable:p.personalizable,activeForCheckout:false});
const catalogView=products=>({schemaVersion:catalog.schemaVersion,currency:catalog.currency,business:{name:catalog.business.name,location:catalog.business.location,instagram:catalog.business.instagram,whatsapp:catalog.business.whatsappStatus==='confirmed'?catalog.business.whatsapp:null,whatsappStatus:catalog.business.whatsappStatus},categories:catalog.categories,collections:catalog.collections?.map(c=>({id:c.id,name:c.name,description:c.description,ids:c.ids})),products:products.map(productView)});
const routes={health:'GET',catalog:'GET',product:'GET','quote-preview':'POST','capacity-preview':'POST','cost-preview':'POST'};
const ok=(data)=>({status:200,data});
const err=(status,code,message)=>({status,data:{error:{code,message}}});
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const known=(o,keys)=>plain(o)&&Object.keys(o).every(k=>keys.includes(k));
const number=v=>typeof v==='number'&&Number.isFinite(v);
export function todayCO(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=k=>p.find(x=>x.type===k).value;return get('year')+'-'+get('month')+'-'+get('day')}
export function dispatch(resource,method,body={},query={},today=todayCO()){
 if(!Object.hasOwn(routes,resource))return err(404,'NOT_FOUND','Ruta no encontrada');
 if(method!==routes[resource])return err(405,'METHOD_NOT_ALLOWED','Método no permitido');
 if(resource==='health')return ok({status:'ok',service:'lechantilly-api',version:'0.7.1',commerceEnabled:false,persistence:'versioned-catalog'});
 if(resource==='catalog'){const category=query.category??'all',q=query.q??'';if(typeof q!=='string'||q.length>120||!['all',...catalog.categories].includes(category))return err(400,'INVALID_QUERY','Filtro inválido');if(!known(query,['category','q']))return err(400,'INVALID_QUERY','Filtro inválido');return ok(catalogView(filterProducts(catalog.products,{category,query:q})))}
 if(resource==='product'){if(!known(query,['id'])||typeof query.id!=='string'||query.id.length>120)return err(400,'INVALID_QUERY','Referencia inválida');const p=catalog.products.find(p=>p.slug===query.id);return p?ok(productView(p)):err(404,'PRODUCT_NOT_FOUND','Referencia no encontrada')}
 try{
  if(resource==='quote-preview'){
   if(!known(body,['productId','quantity','date','portions','budget','flavor','filling','design','packaging','dedication','notes']))throw Error('Campos de consulta inválidos');
   if(typeof body.productId!=='string'||body.productId.length>32||!number(body.quantity))throw Error('Producto o cantidad inválidos');
   for(const k of ['date','flavor','filling','design','packaging','dedication','notes'])if(body[k]!=null&&typeof body[k]!=='string')throw Error('Campo '+k+' inválido');
   for(const k of ['portions','budget'])if(body[k]!=null&&body[k]!==''&&!number(body[k]))throw Error('Campo '+k+' inválido');
   const p=catalog.products.find(p=>p.id===body.productId);if(!p)return err(404,'PRODUCT_NOT_FOUND','Referencia no encontrada');
   if(p.availability==='unavailable')return err(409,'UNAVAILABLE','Referencia no disponible');
   return ok({message:buildQuote(p,body,today),confirmed:false,orderCreated:false,price:p.price})
  }
  if(resource==='capacity-preview'){if(!known(body,['limit','tasks'])||!Array.isArray(body.tasks)||body.tasks.length>100||body.tasks.some(t=>!known(t,['minutes'])||!number(t.minutes)))throw Error('Actividades inválidas');return ok(capacityPlan(body.limit,body.tasks))}
  if(resource==='cost-preview'){const keys=['ingredients','packaging','labor','overhead','units','margin'];if(!known(body,keys)||keys.some(k=>!number(body[k])))throw Error('Costos inválidos');return ok(costPlan(body))}
 }catch(e){return err(422,'VALIDATION_ERROR',e instanceof Error?e.message:'Entrada inválida')}
 return err(404,'NOT_FOUND','Ruta no encontrada');
}
export const allowedMethod=resource=>routes[resource];
