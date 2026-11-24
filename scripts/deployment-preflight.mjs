import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
export function validateDeployment(m,d){
 const fail=[];const target=Object.hasOwn(m.releaseTargets,d.component)?m.releaseTargets[d.component]:null;
 if(d.repository!==m.project)fail.push('Wrong repository');
 if(d.teamId!==m.teamId)fail.push('Wrong Vercel team');
 if(!target||d.projectId!==target.projectId)fail.push('Wrong project for component');
 if(!target||d.sourceRoot!==target.sourceRoot)fail.push('Wrong component root');
 if(d.environment!=='preview')fail.push('Production not authorized');
 if(!/^[a-f0-9]{40}$/.test(d.commit||'')||d.commit!==d.checkedCommit)fail.push('Commit mismatch');
 if(d.clean!==true)fail.push('Uncommitted files');
 if(d.branch==='main'||d.branch?.startsWith('recovery/')||!d.branch)fail.push('Deploy only from an explicit work/release branch');
 return fail;
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
function main(){
 const [component,projectId,sourceRoot,environment,commit]=process.argv.slice(2);
 const m=JSON.parse(readFileSync(new URL('../modules.manifest.json',import.meta.url),'utf8'));
 const actualRemote=git('remote','get-url','origin').replace(/\.git$/,'').replace(/^https:\/\/github\.com\//,'').replace(/^git@github\.com:/,'');
 const d={component,projectId,sourceRoot,environment,commit,checkedCommit:git('rev-parse','HEAD'),repository:actualRemote,teamId:process.env.LC_VERCEL_TEAM_ID,clean:git('status','--porcelain')==='',branch:git('branch','--show-current')};
 const errors=validateDeployment(m,d);if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Preflight passed for '+component+' preview; does not publish or grant permission.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{main()}catch(e){console.error('Preflight failed closed: '+e.message);process.exitCode=1}}
