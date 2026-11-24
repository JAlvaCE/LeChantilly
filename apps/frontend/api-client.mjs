/* HTTP client: presentation only, no authoritative business decisions. */
export const API_BASE='https://lechantilly-api.vercel.app/api/v1';
export async function request(resource,{method='GET',query={},body}={}){
 const url=new URL(API_BASE+'/'+resource);for(const [k,v] of Object.entries(query))if(v!==undefined&&v!==null)url.searchParams.set(k,String(v));
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{const options={method,signal:controller.signal,credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}};if(body!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}
 const response=await fetch(url,options);let data;try{data=await response.json()}catch{throw Error('El servicio no devolvió una respuesta válida. Inténtalo nuevamente.')}
 if(!response.ok)throw Error(typeof data?.error?.message==='string'?data.error.message:'No se pudo completar la consulta.');
 return data;
 }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw Error('No se pudo conectar con Le Chantilly. Inténtalo nuevamente.');throw e}finally{clearTimeout(timer)}
}
export async function loadCatalog(){const d=await request('catalog');if(d?.schemaVersion!==1||!Array.isArray(d.products)||!Array.isArray(d.categories))throw Error('Catálogo no disponible.');return d}
export function quoteInput(productId,values){const input={productId,quantity:Number(values.quantity)};for(const k of ['date','flavor','filling','design','packaging','dedication','notes'])if(typeof values[k]==='string'&&values[k].trim())input[k]=values[k].trim();for(const k of ['portions','budget'])if(values[k]!==''&&values[k]!=null)input[k]=Number(values[k]);return input}
export async function quotePreview(productId,values){const d=await request('quote-preview',{method:'POST',body:quoteInput(productId,values)});if(typeof d.message!=='string'||d.confirmed!==false||d.orderCreated!==false)throw Error('Respuesta de consulta no válida');return d.message}
