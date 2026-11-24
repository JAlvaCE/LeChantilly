// Shared presentation contract; legacy IDs remain supported during migration.
export const validProductId=id=>typeof id==='string'&&(/^LC-[0-9]{3,12}$/.test(id)||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
export function catalogModel(d){
 if(!d||![1,2].includes(d.schemaVersion)||!Array.isArray(d.categories)||!Array.isArray(d.products))throw Error('Catálogo no disponible');
 const preview=d.schemaVersion===2;
 if(preview&&(d.mode!=='development-preview'||d.commerceEnabled!==false))throw Error('Versión de catálogo no admitida');
 const categories=d.categories.map(c=>typeof c==='string'?{id:c,slug:c,name:c.charAt(0).toUpperCase()+c.slice(1)}:c);
 if(categories.some(c=>!c||typeof c.id!=='string'||typeof c.name!=='string'||typeof c.slug!=='string')||new Set(categories.map(c=>c.id)).size!==categories.length)throw Error('Categorías inválidas');
 const ids=new Set(categories.map(c=>c.id)),products=d.products.map(p=>{
 if(!p||!validProductId(p.id)||typeof p.slug!=='string'||typeof p.name!=='string'||typeof p.description!=='string'||typeof p.personalizable!=='boolean')throw Error('Referencia inválida');
 const categoryIds=preview?p.categoryIds:[p.category];
 if(!Array.isArray(categoryIds)||!categoryIds.length||categoryIds.some(c=>!ids.has(c)))throw Error('Categoría de referencia inválida');
 return {...p,categoryIds,category:categoryIds[0],categoryLabel:categories.find(c=>c.id===categoryIds[0])?.name,readOnly:preview};
 });
 if(new Set(products.map(p=>p.id)).size!==products.length||new Set(products.map(p=>p.slug)).size!==products.length)throw Error('Referencias duplicadas');
 return {...d,categories,products,collections:Array.isArray(d.collections)?d.collections:[],readOnly:preview};
}
const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function selectProducts(model,{category='all',query='',collection=null}={}){
 const group=collection?model.collections.find(c=>c.id===collection||c.slug===collection):null;
 if(collection&&!group)return [];
 const terms=normal(query).split(/\s+/).filter(Boolean);
 return model.products.filter(p=>(category==='all'||p.categoryIds.includes(category))&&(!group||group.ids.includes(p.id))&&terms.every(t=>normal(p.name+' '+p.description+' '+p.categoryIds.map(id=>model.categories.find(c=>c.id===id)?.name||'').join(' ')).includes(t)));
}
export function chooseCustom(model,requested){
 const candidates=model.products.filter(p=>p.personalizable&&p.availability!=='unavailable');
 if(requested)return candidates.find(p=>p.id===requested)||null;
 return candidates[0]||null;
}
