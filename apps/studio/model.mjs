// Practice store and form rules. Server/DB remain authoritative for real operations.
export const emptyDocument=()=>({categories:[],families:[],products:[],productCategories:[],variants:[],collections:[],collectionProducts:[]});
export const clone=x=>JSON.parse(JSON.stringify(x));
export const slugify=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
export function validateForPublish(d){
 const errors=[];
 if(!d||Object.keys(emptyDocument()).some(k=>!Array.isArray(d[k])))return ['El catálogo tiene una estructura inválida.'];
 for(const p of d.products.filter(x=>x.active)){
 if(!d.productCategories.some(pc=>pc.product_id===p.id&&d.categories.some(c=>c.id===pc.category_id&&c.active)))errors.push(p.name+': necesita una categoría visible.');
 if(!d.variants.some(v=>v.product_id===p.id&&v.active))errors.push(p.name+': necesita una presentación visible.');
 }
 for(const v of d.variants)if(!Number.isSafeInteger(v.min_qty)||!Number.isSafeInteger(v.multiple)||v.min_qty<1||v.multiple<1||v.min_qty%v.multiple)errors.push(v.name+': el mínimo debe ser múltiplo de la cantidad de venta.');
 for(const k of ['categories','products','collections'])if(d[k].some(x=>!x.slug||d[k].filter(y=>y.slug===x.slug).length>1))errors.push('Hay enlaces vacíos o duplicados en '+k+'.');
 return errors;
}
export function preview(d){
 const categories=d.categories.filter(c=>c.active).sort((a,b)=>a.position-b.position);
 return {categories,products:d.products.filter(p=>p.active).map(p=>({id:p.id,name:p.name,description:p.description,categories:categories.filter(c=>d.productCategories.some(x=>x.product_id===p.id&&x.category_id===c.id)).map(c=>c.name),variants:d.variants.filter(v=>v.active&&v.product_id===p.id).map(v=>({name:v.name,unit:v.unit,minimum:v.min_qty,multiple:v.multiple,leadHours:v.lead_hours})),price:'Por cotizar'})),collections:d.collections.filter(c=>c.active).map(c=>({name:c.name,products:d.collectionProducts.filter(x=>x.collection_id===c.id&&d.products.some(p=>p.id===x.product_id&&p.active)).length}))};
}
export function sample(){
 const c='00000000-0000-4000-8000-000000000001',p='00000000-0000-4000-8000-000000000002',v='00000000-0000-4000-8000-000000000003',f='00000000-0000-4000-8000-000000000004',g='00000000-0000-4000-8000-000000000005';
 return {categories:[{id:c,name:'Postres de práctica',slug:'postres-practica',position:0,active:true}],families:[{id:f,name:'Masa de ensayo'}],products:[{id:p,name:'Tartaleta ficticia',slug:'tartaleta-ficticia',description:'Ejemplo para aprender a editar, no disponible para comprar.',active:true,custom:false,family_id:f}],productCategories:[{product_id:p,category_id:c}],variants:[{id:v,product_id:p,name:'Caja ficticia de 6',unit:'caja',min_qty:1,multiple:1,lead_hours:48,price_cop:null,active:true}],collections:[{id:g,name:'Colección de prueba',slug:'coleccion-prueba',active:true}],collectionProducts:[{collection_id:g,product_id:p}]};
}
export function practiceStore(){
 let revision=0,publication=0,document=sample(),published=null;const versions=new Map(),releases=[];
 return {async read(){return clone({revision,publication,document})},async save(expected,d){if(expected!==revision)throw Error('Otro cambio ha actualizado el catálogo.');revision++;document=clone(d);versions.set(revision,clone(d));return revision},async publish(r,ep,ed){if(ep!==publication||ed!==revision||!versions.has(r)||r!==revision&&!releases.some(x=>x.revision===r))throw Error('La versión cambió. Vuelve a cargar.');const errors=validateForPublish(versions.get(r));if(errors.length)throw Error(errors[0]);published=preview(versions.get(r));publication++;releases.unshift({publication,revision:r,created_at:new Date().toISOString()});return publication},async history(){return clone(releases)},async published(){return clone(published)}};
}
