// Conservative inquiry policy, not an approved production batch or packaging specification.
export const giftPolicy={
  "status": "concept",
  "policyVersion": "provisional-1",
  "sizes": [
    6,
    12
  ],
  "increment": 6,
  "maxVarieties": 2,
  "families": [
    {
      "id": "tartaletas",
      "label": "Tartaletas",
      "productIds": [
        "LC-008",
        "LC-009",
        "LC-010",
        "LC-011"
      ]
    },
    {
      "id": "galletas",
      "label": "Galletas",
      "productIds": [
        "LC-012",
        "LC-013"
      ]
    },
    {
      "id": "bombones",
      "label": "Bombones",
      "productIds": [
        "LC-016"
      ]
    }
  ],
  "requiresManualReview": true
};
export function validateGiftComposition(items,size){
 if(!giftPolicy.sizes.includes(size))throw Error('Tamaño de caja no admitido');
 if(!Array.isArray(items)||items.length<1||items.length>giftPolicy.maxVarieties)throw Error('Selecciona una variedad o, para 12 piezas, hasta dos');
 const family=giftPolicy.families.find(f=>items.every(i=>f.productIds.includes(i.productId)));
 if(!family)throw Error('Elige productos de una misma familia. Los surtidos especiales requieren revisión aparte');
 if(items.some(i=>!Number.isSafeInteger(i.quantity)||i.quantity<giftPolicy.increment||i.quantity%giftPolicy.increment!==0))throw Error('Selecciona bloques de seis piezas por variedad');
 if(items.reduce((n,i)=>n+i.quantity,0)!==size)throw Error('Completa exactamente los espacios de la caja');
 if(new Set(items.map(i=>i.productId)).size!==items.length)throw Error('No repitas referencias');
 return family.id;
}
