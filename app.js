'use strict';
const menu=document.querySelector('.menu'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus()}});
const filters=document.querySelectorAll('[data-filter]'),products=document.querySelectorAll('.product');
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));products.forEach(p=>p.hidden=btn.dataset.filter!=='all'&&p.dataset.category!==btn.dataset.filter)}));
const dialog=document.querySelector('#detail-dialog');
document.querySelectorAll('.detail').forEach(b=>b.addEventListener('click',()=>{const card=b.closest('.product'),img=card.querySelector('img'),di=document.querySelector('#dialog-img');di.src=img.src;di.alt=img.alt;document.querySelector('#dialog-title').textContent=card.querySelector('h3').textContent;document.querySelector('#dialog-text').textContent=b.dataset.detail;dialog.showModal()}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
/* Atelier creative preview: local, no orders or personal data. */
const counter=document.querySelector('#collection-count');
filters.forEach(btn=>btn.addEventListener('click',()=>{const n=[...products].filter(p=>!p.hidden).length;counter.textContent=n===1?'1 inspiración':n+' inspiraciones'}));
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
 const url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='lech ant illy-boceto.svg'.replace(/ /g,'');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#design-status').textContent='Se ha iniciado la descarga del boceto conceptual.';
});
paintDesign();
