// Cithadell Module Guard. Only Git objects are inspected; candidate code is never executed.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const own=(o,k)=>Object.hasOwn(o,k);
export const criticalPath=p=>/^(?:\.github\/|scripts\/|tests\/|database\/tests\/|apps\/backend\/tests\/)/.test(p)||p==='modules.manifest.json'||p==='AGENTS.md'||p==='SECURITY.md'||p==='docs/quality/FUNCTIONAL-BASELINE.md'||p==='docs/quality/MODULE-GUARD.md'||p==='docs/quality/DEPLOYMENT-TARGETS.json'||/^apps\/[^/]+\/vercel\.json$/.test(p);
export function riskySQL(sql){
 // Intentionally conservative: flags comments/strings too. SQL is not parsed or proved safe.
 const patterns=[/\bdrop\s+(?:table|schema|column|type|database|function|policy|constraint|view|index|trigger|role|owned)\b/i,/\btruncate\b/i,/\bdelete\s+from\b/i,/\balter\s+(?:table|schema)\b[\s\S]{0,500}\b(?:disable\s+row\s+level\s+security|no\s+force\s+row\s+level\s+security|alter\s+column\b[\s\S]{0,120}\btype|rename\s+(?:column|to))\b/i,/\bexecute\b/i,/\bgrant\b[\s\S]{0,200}\b(?:anon|public)\b/i,/\bsecurity\s+definer\b/i,/\bupdate\s+[\w".]+\s+set\b/i];
 return patterns.some(re=>re.test(sql));
}
export function evaluate({manifest,base,head,readBase,readHead,bootstrap=false}){
 const errors=[],add=(s)=>errors.push(s),required=new Set([...manifest.requiredFiles,...manifest.modules.flatMap(m=>m.paths),...Object.keys(base)]);
 for(const p of required)if(!own(head,p)||!['100644','100755'].includes(head[p].mode))add('Missing/nonregular protected file: '+p);
 for(const p of Object.keys(base)){
 if(!own(head,p))continue;
 if(base[p].sha!==head[p].sha||base[p].mode!==head[p].mode){
 if(p.startsWith('database/migrations/'))add('Applied migration modified: '+p);
 else if(criticalPath(p)&&!(bootstrap&&['.github/workflows/quality.yml','AGENTS.md'].includes(p)))add('Protected control changed: '+p);
 else if(manifest.immutableArchives.includes(p))add('Historical archive changed: '+p);
 }
 }
 for(const p of Object.keys(head))if(!own(base,p)&&p.startsWith('database/migrations/')&&p.endsWith('.sql')&&riskySQL(readHead(p)))add('Potential destructive/privileged migration requires owner review: '+p);
 for(const [p,markers] of Object.entries(manifest.markers))if(own(head,p)){const s=readHead(p);for(const m of markers)if(!s.includes(m))add('Capability marker removed: '+p+' :: '+m)}
 for(const p of ['package.json','apps/frontend/package.json','apps/backend/package.json','apps/studio/package.json'])if(own(base,p)&&own(head,p)){
 try{const a=JSON.parse(readBase(p)),b=JSON.parse(readHead(p));for(const [k,v] of Object.entries(a.scripts||{}))if(b.scripts?.[k]!==v&&!(bootstrap&&p==='package.json'&&k==='check'&&b.scripts[k]===v+' && node scripts/module-guard.mjs --inventory'))add('Existing script modified: '+p+' :: '+k)}catch{add('Invalid package manifest: '+p)}
 }
 const api='packages/contracts/openapi.json';if(own(base,api)&&own(head,api)){try{const a=JSON.parse(readBase(api)),b=JSON.parse(readHead(api));for(const [path,ops] of Object.entries(a.paths))for(const [method,op] of Object.entries(ops))if(JSON.stringify(b.paths?.[path]?.[method])!==JSON.stringify(op))add('Existing API operation changed: '+method+' '+path)}catch{add('Invalid API contract')}}
 return [...new Set(errors)];
}
function git(args){return execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']})}
function ref(s){if(!/^[a-f0-9]{40}$/.test(s||''))throw Error('Exact commit SHA required');return s}
function tree(sha){const out=Object.create(null);for(const row of git(['ls-tree','-rz','--full-tree',sha]).split('\0').filter(Boolean)){const i=row.indexOf('\t'),[mode,type,oid]=row.slice(0,i).split(' ');out[row.slice(i+1)]={mode,sha:oid,type}}return out}
const read=(sha,p)=>git(['show',sha+':'+p]);
function main(){
 const args=process.argv.slice(2),inventory=args[0]==='--inventory';
 const head=ref(inventory?git(['rev-parse','HEAD']).trim():args[1]),base=ref(inventory?head:args[0]);
 const a=tree(base),b=tree(head);
 // Bootstrap only for the fixed, reviewed pre-guard baseline. After merge the manifest always comes from trusted base.
 const bootstrap=!own(a,'modules.manifest.json')&&base==='54ac526dbef20a8cdc20d0fcb0e54edf00b83766';
 if(!own(a,'modules.manifest.json')&&!bootstrap)throw Error('Trusted manifest missing');
 const manifest=JSON.parse(read(bootstrap?head:base,'modules.manifest.json'));
 const errors=evaluate({manifest,base:a,head:b,readBase:p=>read(base,p),readHead:p=>read(head,p),bootstrap});
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Module Guard passed: '+manifest.modules.length+' module groups, '+Object.keys(a).length+' tracked baseline files. Structural gate only.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{main()}catch(e){console.error('Module Guard failed closed: '+e.message);process.exitCode=1}}
