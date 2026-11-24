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