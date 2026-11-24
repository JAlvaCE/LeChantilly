// Pure, deterministic operational scenario model. No I/O, no bookings, no authoritative quotes.
const integer=(v,min,max,label)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error(label+' inválido ('+min+' a '+max+')');return v};
const keys=(o,allowed)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
export const recipeFields=['label','unit','demand','yieldGross','loss','ingredientCost','batchOverhead','activeMinutes','setupMinutes','ovenMinutes','coldSlotMinutes'];
export const scenarioFields=['recipes','hourlyLabor','orderPackaging','orderOther','marginTenths','salePrice','laborCapacity','ovenCapacity','coldCapacity'];
export function planProduction(input){
 if(!keys(input,scenarioFields)||!Array.isArray(input.recipes)||input.recipes.length<1||input.recipes.length>8)throw Error('Se requieren entre 1 y 8 preparaciones independientes');
 const hourly=integer(input.hourlyLabor,0,1000000,'Costo hora de trabajo'),pack=integer(input.orderPackaging,0,100000000,'Empaque'),other=integer(input.orderOther,0,100000000,'Otros costos del pedido'),margin=integer(input.marginTenths,0,900,'Margen (décimas de porcentaje)');
 const caps={labor:integer(input.laborCapacity,0,10080,'Capacidad mano de obra'),oven:integer(input.ovenCapacity,0,10080,'Capacidad horno'),cold:integer(input.coldCapacity,0,100800,'Capacidad refrigeración')};
 const sale=input.salePrice===null?null:integer(input.salePrice,0,1000000000000,'Ingreso neto propuesto');
 const seen=new Set();
 const lines=input.recipes.map((r,i)=>{
  if(!keys(r,recipeFields)||typeof r.label!=='string'||!r.label.trim()||r.label.length>60||!['pieza','torta','caja','porción'].includes(r.unit))throw Error('Identificación o unidad inválida en preparación '+(i+1));
  const label=r.label.trim(),key=label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();if(seen.has(key))throw Error('Agrupa la demanda de la misma receta antes de calcular: '+label);seen.add(key);
  const q=integer(r.demand,1,1000,'Demanda'),gross=integer(r.yieldGross,1,1000,'Rendimiento bruto'),loss=integer(r.loss,0,gross-1,'Merma por lote'),useful=gross-loss,batches=Math.ceil(q/useful);
  const ingredients=batches*integer(r.ingredientCost,0,10000000,'Ingredientes por lote'),overhead=batches*integer(r.batchOverhead,0,10000000,'Indirectos por lote');
  const active=batches*integer(r.activeMinutes,0,1440,'Trabajo activo por lote')+integer(r.setupMinutes,0,1440,'Preparación y limpieza por receta');
  const oven=batches*integer(r.ovenMinutes,0,1440,'Horno por lote'),cold=batches*integer(r.coldSlotMinutes,0,10080,'Espacio-minutos de frío por lote');
  const labor=Math.ceil(active*hourly/60),cost=ingredients+overhead+labor;
  return {label,unit:r.unit,demand:q,batches,grossProduced:batches*gross,waste:batches*loss,usable:batches*useful,surplus:batches*useful-q,ingredients,overhead,active,oven,cold,labor,cost,costPerSold:Math.ceil(cost/q),surplusCostEstimate:Math.ceil(cost*(batches*useful-q)/(batches*useful))};
 });
 const sum=k=>lines.reduce((n,r)=>n+r[k],0);
 const totalCost=sum('cost')+pack+other,targetPrice=Math.ceil(totalCost*1000/(1000-margin)),profit=sale===null?null:sale-totalCost;
 const resources=Object.entries({labor:sum('active'),oven:sum('oven'),cold:sum('cold')}).map(([resource,used])=>({resource,used,capacity:caps[resource],overload:Math.max(0,used-caps[resource])}));
 const warnings=['No comprueba inventario, seguridad alimentaria, compatibilidad de recetas, secuencia temporal ni entrega.','No descuenta sobrantes ni presume su venta. Cada línea se calcula como preparación independiente.','Los límites de capacidad son presupuestos agregados, no una agenda factible.'];
 if(hourly===0)warnings.push('La mano de obra está valorada en cero: la rentabilidad puede estar sobreestimada.');
 if(totalCost===0)warnings.push('Costo cero: faltan costos o el escenario no es representativo.');
 if(sum('active')===0)warnings.push('No hay tiempo activo registrado; no se puede estimar utilidad por hora.');
 if(resources.some(r=>r.overload>0))warnings.push('Al menos un recurso supera su presupuesto de capacidad.');
 if(sale!==null&&sale<targetPrice)warnings.push('El ingreso propuesto no alcanza el margen objetivo.');
 return {schemaVersion:1,simulation:true,productionConfirmed:false,requiresManualReview:true,lines,totalCost,targetPrice,packaging:pack,other,activeMinutes:sum('active'),laborCost:sum('labor'),resources,profit,actualMarginPct:sale>0?Math.round(profit/sale*1000)/10:null,profitPerActiveHour:profit!==null&&sum('active')>0?Math.round(profit*60/sum('active')):null,atTargetProfitPerActiveHour:sum('active')>0?Math.round((targetPrice-totalCost)*60/sum('active')):null,warnings};
}
