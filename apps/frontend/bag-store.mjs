import {validProductId} from './catalog-model.mjs';
// Only IDs and quantities in sessionStorage; no addresses, dates, free text or photos.
export function sanitizeBag(raw){if(!Array.isArray(raw))return [];const map=new Map();for(const x of raw.slice(0,50)){if(!x||typeof x.productId!=='string'||!validProductId(x.productId)||!Number.isSafeInteger(x.quantity)||x.quantity<1||x.quantity>99)continue;map.set(x.productId,Math.min(99,(map.get(x.productId)||0)+x.quantity))}return [...map].slice(0,17).map(([productId,quantity])=>({productId,quantity}))}
const KEY='lc-bag-v1';let memory=[];
export function readBag(){try{const raw=sessionStorage.getItem(KEY);if(raw!==null)memory=sanitizeBag(JSON.parse(raw));return memory}catch{return memory}}
export function writeBag(items){memory=sanitizeBag(items);try{sessionStorage.setItem(KEY,JSON.stringify(memory))}catch{}if(typeof window!=='undefined')window.dispatchEvent(new Event('lc-bag-change'));return memory}
export function addToBag(id,n=1){return writeBag([...readBag(),{productId:id,quantity:n}])}
export function bagCount(){return readBag().reduce((a,x)=>a+x.quantity,0)}
