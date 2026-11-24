import {priceLabel} from './ui-contract.mjs';import {addToBag} from './bag-store.mjs';
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
const link=(text,href,cls)=>{const a=make('a',text,cls);a.href=href;return a};
export function productCard(p,{allowBag=false}={}){
 const article=make('article',undefined,'product-card-v06');article.dataset.id=p.id;
 const href=p.personalizable&&!p.readOnly?'/personaliza.html?producto='+encodeURIComponent(p.id):'/producto.html?id='+encodeURIComponent(p.slug);
 const art=link('',href,'art-link');art.setAttribute('aria-label','Ver '+p.name);
 const box=make('div',undefined,'catalog-art');const artKey=['tortas','galletas','postres','tartaletas','regalos'].includes(p.category)?p.category:'postres';box.classList.add(artKey);
 if(p.image&&/^\/images\/[a-zA-Z0-9/_-]+\.(webp|avif|jpg|jpeg|png)$/.test(p.image)){const img=make('img');img.src=p.image;img.alt=p.name;img.loading='lazy';box.append(img)}else{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 120 110');svg.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#art-'+artKey);svg.append(use);box.append(svg,make('span','Ilustración conceptual'))}
 art.append(box);const copy=make('div',undefined,'card-copy'),h=make('h3');h.append(link(p.name,href));copy.append(make('span',p.categoryLabel,'kicker'),h,make('p',p.description),make('strong',priceLabel(p)),link(p.readOnly?'Ver referencia ↗':p.personalizable?'Diseñar ↗':'Ver detalles ↗',href,'primary'));
 if(allowBag&&!p.readOnly&&!p.personalizable&&p.availability!=='unavailable'){const b=make('button','Añadir a la consulta','secondary add-bag');b.type='button';b.addEventListener('click',()=>{try{addToBag(p.id);b.textContent='Añadir otra presentación'}catch(e){b.textContent=e.message;setTimeout(()=>{b.textContent='Añadir a la consulta'},4000)}});copy.append(b)}
 article.append(art,copy);return article;
}
export function collectionLinks(model,root){root.replaceChildren(...model.collections.map(c=>{const a=link('', '/catalogo.html?coleccion='+encodeURIComponent(c.id),'occasion');a.append(make('span','Colección','kicker'),make('h3',c.name),make('p',c.description||'Explora esta selección.'),make('span','Explorar ↗'));return a}))}
