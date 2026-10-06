// Actual source function checks. Fetch/UI are mocked, not device/network tests.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');const source=fs.readFileSync(root+'/party-final1.html','utf8');
const build=source.match(/const WP_BUILD = '([^']+)'/)[1];
assert.equal(build,fs.readFileSync(root+'/wp-ver.txt','utf8').trim());
const helper=source.slice(source.indexOf('function wpIsNewerBuild('),source.indexOf('function wpShowUpdate('));
const check=source.slice(source.indexOf('async function wpVersionCheck()'),source.indexOf('setTimeout(wpVersionCheck, 6000)'));
const future=build.replace(/-(\d+)$/,(_,n)=>'-'+(Number(n)+1));
let marker=build,bg=false,ok=true,fail=false,shown=[],fetches=0;
const context=vm.createContext({WP_BUILD:build,isBg:()=>bg,Date,Number,wpShowUpdate:v=>shown.push(v),fetch:async()=>{fetches++;if(fail)throw Error('offline');return {ok,text:async()=>marker}}});
vm.runInContext(helper+check,context);
const newer=context.wpIsNewerBuild;
for(const [a,b,expected] of [
 ['2026-10-06-47','2026-10-06-48',false],['2026-10-06-49','2026-10-06-49',false],
 ['2026-10-06-50','2026-10-06-49',true],['2026-10-06-100','2026-10-06-99',true],
 ['2026-10-06-9','2026-10-06-49',false],['2026-10-07-1','2026-10-06-49',true],
 ['2026-09-30-99','2026-10-06-49',false],['2027-01-01-1','2026-12-31-99',true],
 ['<html>error</html>',build,false],['',build,false],['2026-10-06-49bad',build,false]
])assert.equal(newer(a,b),expected,a);
(async()=>{
 for(marker of ['2026-10-06-47','2026-10-06-48',build,' '+build+'\n','', '<html>error</html>'])await context.wpVersionCheck();
 assert.equal(shown.length,0,'No repeat for installed/equal/older/invalid marker');
 marker=future;await context.wpVersionCheck();assert.deepEqual(shown,[marker]);
 bg=true;let n=fetches;await context.wpVersionCheck();assert.equal(fetches,n);bg=false;
 ok=false;await context.wpVersionCheck();ok=true;fail=true;await context.wpVersionCheck();assert.equal(shown.length,1);
 // Actual UI function rejects stale marker and prevents duplicate banners.
 const ui=source.slice(source.indexOf('function wpShowUpdate('),source.indexOf('/* 🌙 SLEEP TIMER'));
 let banner=null,appends=0;
 context.document={getElementById:()=>banner,createElement:()=>({style:{},appendChild(){}}),body:{appendChild(el){banner=el;appends++}}};
 vm.runInContext(ui,context);context.wpShowUpdate('2026-10-06-47');context.wpShowUpdate(build);assert.equal(appends,0);
 context.wpShowUpdate(future);context.wpShowUpdate(future);assert.equal(appends,1);
 console.log('PASS version consistency; 11 version comparisons; stale/equal/repeated/invalid fetches; newer prompt; bg/offline/HTTP guards; actual UI duplicate guard.');
})().catch(e=>{console.error(e);process.exit(1)});
