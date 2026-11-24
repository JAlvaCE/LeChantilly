// Source of truth lives in packages/domain. Generated mirrors are required for independently deployed static apps.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
const targets={'packages/domain/production-engine.mjs':['apps/frontend/production-engine.mjs','apps/studio/production-engine.mjs'],'packages/domain/calculations.mjs':['apps/studio/legacy-calculations.mjs','apps/backend/src/calculations.mjs'],'packages/domain/ui-contract.mjs':['apps/frontend/ui-contract.mjs','apps/studio/ui-contract.mjs']};
const write=process.argv.includes('--write');let failed=false;
for(const [source,mirrors] of Object.entries(targets)){const expected=await read(source);for(const target of mirrors){if(write)await writeFile(new URL(target,root),expected);else if(await read(target)!==expected){console.error('Generated mirror differs: '+target);failed=true}}}
if(failed)process.exitCode=1;else console.log('Domain mirrors match canonical sources');
