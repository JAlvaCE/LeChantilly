import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const roots=['apps','packages','scripts'];const violations=[];
async function inspect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.name==='node_modules')continue;if(entry.name==='.env'||entry.name.startsWith('.env.')&&!entry.name.endsWith('.example'))violations.push(p+': env file');if(entry.isDirectory())await inspect(p);else if(/\.(mjs|js|json|ts|html|css)$/.test(p)&&p!=='scripts/security-check.mjs'){const s=await readFile(p,'utf8');if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk_live_[A-Za-z0-9]{16,}/.test(s))violations.push(p+': possible secret');if(p.startsWith(join('apps','frontend'))&&/\b(?:eval|new Function)\s*\(/.test(s))violations.push(p+': dynamic execution');}}}
for(const dir of roots)await inspect(dir);
const config=JSON.parse(await readFile('apps/frontend/vercel.json','utf8'));const h=config.headers[0].headers;
if(!h.some(x=>x.key==='Content-Security-Policy'&&x.value.includes("script-src 'self'")&&!x.value.includes("'unsafe-eval'")))violations.push('Frontend CSP');
if(violations.length){console.error(violations.join('\n'));process.exitCode=1}else console.log('Baseline security checks passed (not a comprehensive SAST/secret scan)');
