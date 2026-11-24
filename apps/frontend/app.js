'use strict';
import {loadCatalog,quotePreview} from './api-client.mjs';
import {todayCO} from './pages-shared.mjs';
const menu=document.querySelector('.menu'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus()}});
const cards=[...document.querySelectorAll('.real-product')],filters=[...document.querySelectorAll('[data-filter]')],search=document.querySelector('#catalog-search'),counter=document.querySelector('#collection-count'),empty=document.querySelector('#empty-catalog');
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let selected='all',catalog=new Map(),business={whatsapp:null};
for(const card of cards){const id=card.dataset.id;catalog.set(id,{id,name:card.querySelector('h3').textContent,category:card.dataset.category,description:card.querySelector('.product-info p:last-child').textContent,sourceUrl:card.querySelector('.source-link').href,price:{amount:null,currency:'COP',mode:'quote'}})}
function formatPrice(p){return p?.price?.mode==='fixed'&&Number.isSafeInteger(p.price.amount)&&p.price.amount>=0?new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(p.price.amount):'Precio a cotizar'}
function renderFilter(){const q=normalize(search.value);let count=0;for(const card of cards){const p=catalog.get(card.dataset.id);const match=(selected==='all'||p.category===selected)&&(!q||normalize(p.name+' '+p.description).includes(q));card.hidden=!match;if(match)count++}counter.textContent=count===1?'1 creación':count+' creaciones';empty.hidden=count!==0;filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===selected)))}
filters.forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;renderFilter()}));search.addEventListener('input',renderFilter);document.querySelector('#clear-search').addEventListener('click',()=>{selected='all';search.value='';renderFilter();search.focus()});
function safeSource(s){try{const u=new URL(s);return u.protocol==='https:'&&u.hostname==='www.instagram.com'?u.href:'https://www.instagram.com/lechantillys/'}catch{return 'https://www.instagram.com/lechantillys/'}}
let apiReady=false;
loadCatalog().then(d=>{apiReady=true;if(d.schemaVersion!==1||!Array.isArray(d.products))return;business=d.business||business;for(const p of d.products){const card=cards.find(c=>c.dataset.id===p.id);if(!card||typeof p.name!=='string'||typeof p.description!=='string')continue;catalog.set(p.id,p);card.querySelector('h3').textContent=p.name;card.querySelector('.product-info p:last-child').textContent=p.description;card.querySelector('.product-price').textContent=formatPrice(p);card.querySelector('.source-link').href=safeSource(p.sourceUrl);card.dataset.category=p.category}renderFilter()}).catch(()=>{counter.textContent='Referencias históricas · Servicio no disponible';});
const dialog=document.querySelector('#detail-dialog'),form=document.querySelector('#quote-form'),result=document.querySelector('#quote-result'),msg=document.querySelector('#quote-message'),note=document.querySelector('#quote-notes'),date=document.querySelector('#quote-date'),qty=document.querySelector('#quote-quantity'),status=document.querySelector('#quote-status'),wa=document.querySelector('#whatsapp-quote');
let activeProduct=null;
function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function openProduct(id,initial=''){const p=catalog.get(id);if(!p)return;activeProduct=p;form.reset();result.hidden=true;msg.value='';status.textContent='';document.querySelector('#quote-error').textContent='';date.min=todayCO();qty.value='1';note.value=initial;document.querySelector('#dialog-title').textContent=p.name;document.querySelector('#dialog-text').textContent=p.description;document.querySelector('#dialog-price').textContent=formatPrice(p);document.querySelector('#dialog-source').href=safeSource(p.sourceUrl);dialog.showModal()}
cards.forEach(card=>card.querySelector('.product-detail').addEventListener('click',()=>openProduct(card.dataset.id)));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{activeProduct=null;form.reset();msg.value='';result.hidden=true;wa.hidden=true});
let quoteGeneration=0;
form.addEventListener('input',()=>{quoteGeneration++;result.hidden=true;document.querySelector('#quote-error').textContent=''});
dialog.addEventListener('close',()=>{quoteGeneration++});
form.addEventListener('submit',async e=>{e.preventDefault();if(!activeProduct||!form.reportValidity())return;const error=document.querySelector('#quote-error');const current=++quoteGeneration;const submit=form.querySelector('button[type=submit]');const productId=activeProduct.id;result.hidden=true;error.textContent='Validando consulta…';submit.disabled=true;try{const draft=await quotePreview(productId,{quantity:qty.value,date:date.value,notes:note.value});if(current!==quoteGeneration||!dialog.open)return;msg.value=draft;const number=business.whatsapp;const valid=business.whatsappStatus==='confirmed'&&typeof number==='string'&&/^57[0-9]{10}$/.test(number);wa.hidden=!valid;if(valid)wa.href='https://wa.me/'+number+'?text='+encodeURIComponent(msg.value);document.querySelector('#quote-channel-note').textContent=valid?'Revisa el mensaje. No se ha realizado ningún pedido.':'Copia y pega tu consulta en Instagram. WhatsApp pendiente de confirmación.';error.textContent='';result.hidden=false;status.textContent='';msg.focus()}catch(e){if(current===quoteGeneration)error.textContent=e.message}finally{submit.disabled=false}});
document.querySelector('#copy-quote').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(msg.value);status.textContent='Mensaje copiado.'}catch{msg.focus();msg.select();status.textContent='Selecciona y copia el texto manualmente.'}});
document.querySelector('#quote-design').addEventListener('click',()=>openProduct('LC-001','Boceto: '+document.querySelector('#design-summary').textContent));
renderFilter();
const colors={rose:{label:'Rosa',fill:'#e8aebd'},vanilla:{label:'Vainilla',fill:'#f6e2b9'},lilac:{label:'Lila',fill:'#d5c3e7'},sage:{label:'Salvia',fill:'#c3d2bb'}};
const decorLabels={floral:'Flores',bow:'Lazo',stars:'Estrellas'};
const design={palette:'rose',tier:'one',decor:'floral'};
const illustration=document.querySelector('#cake-illustration');
function paintDesign(){
  illustration.querySelectorAll('.cake-color').forEach(el=>{el.classList.remove('palette-vanilla','palette-lilac','palette-sage');if(design.palette!=='rose')el.classList.add('palette-'+design.palette)});
  const two=design.tier==='two';
  const tier=document.querySelector('#cake-tier');tier.hidden=!two; tier.toggleAttribute('hidden',!two);tier.setAttribute('display',two?'inline':'none');
  for(const name of Object.keys(decorLabels)){const el=document.querySelector('#cake-'+name);el.toggleAttribute('hidden',name!==design.decor);el.setAttribute('display',name===design.decor?'inline':'none');el.setAttribute('transform','translate(230 '+(two?'154':'215')+')')}
  const label=colors[design.palette].label+' · '+(two?'Dos pisos':'Un piso')+' · '+decorLabels[design.decor];
  document.querySelector('#design-summary').textContent=label;document.querySelector('#cake-desc').textContent=label;
  document.querySelectorAll('[data-palette],[data-tier],[data-decor]').forEach(b=>{const key=Object.keys(b.dataset)[0];b.setAttribute('aria-pressed',String(b.dataset[key]===design[key]))});
}
document.querySelectorAll('[data-palette],[data-tier],[data-decor]').forEach(b=>b.addEventListener('click',()=>{const key=Object.keys(b.dataset)[0];if(Object.hasOwn(design,key)){design[key]=b.dataset[key];paintDesign()}}));
document.querySelector('#save-design').addEventListener('click',()=>{
 const copy=illustration.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width','920');copy.setAttribute('height','840');copy.querySelectorAll('[hidden]').forEach(el=>el.remove());copy.querySelectorAll('.cake-color').forEach(el=>{el.setAttribute('fill',colors[design.palette].fill);el.removeAttribute('class')});const data=new XMLSerializer().serializeToString(copy);
 const url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='lechantilly-boceto.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#design-status').textContent='Se ha iniciado la descarga del boceto conceptual.';
});
paintDesign();
