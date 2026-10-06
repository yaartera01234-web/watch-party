// Browser tests of actual lobby functions/CSS; room/MQTT/DM operations are simulated.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(root+'/party-final1.html','utf8');
const css=source.slice(source.indexOf('/* WP_LOBBY_V46_START'),source.indexOf('/* WP_LOBBY_V46_END */')+24);
const logic=source.slice(source.indexOf('  var partyLobbyVisible ='),source.indexOf('  function partyWelcome()'));
const stubs=`
const $=id=>document.getElementById(id);
var myRoom='Sara',mqttUp=true,dmOpenedFromRoom=false,curChat=null;
window.stats={enter:0,leave:0,welcome:0,close:0,open:0,view:'dm-view-inbox',joined:false,enterOk:true};
function dmNavStop(){} function partyWelcome(){stats.welcome++}
function closeSheet(){stats.close++;$('dm-sheet').classList.remove('on')}
function openSheet(){stats.open++;$('dm-sheet').classList.add('on')}
function sheetOpen(){return $('dm-sheet').classList.contains('on')}
function showView(v,noHistory){stats.view=v}
window.wpRoomJoined=()=>stats.joined;
window.wpRoomEnter=()=>{stats.enter++;if(stats.enterOk)stats.joined=true;return stats.enterOk};
window.wpRoomLeave=()=>{stats.leave++;stats.joined=false};window.ypSnapBarNow=()=>{};
`;
const fixture='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#020616}'+css+'</style></head><body class="yp-joined"><div id="dm-sheet" class="on"></div><script>'+stubs+logic+'</script></body></html>';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
 let n=0;
 async function page(size={width:412,height:915},reduce='no-preference'){
  const p=await browser.newPage({viewport:size,reducedMotion:reduce});
  await p.route('**/*',r=>r.request().url().endsWith('.svg')?r.fulfill({contentType:'image/svg+xml',body:fs.readFileSync(root+'/assets/lobby-tail-v47.svg')}):r.request().url().endsWith('.webp')?r.fulfill({contentType:'image/webp',body:fs.readFileSync(root+'/assets/lobby-neon-v46.webp')}):r.fulfill({contentType:'text/html',body:fixture}));
  await p.goto('http://lobby.test/party-final1.html');return p;
 }
 async function show(p){await p.evaluate(()=>partyLobbyShow());await p.locator('.wpl-art').evaluate(e=>e.decode());}
 async function test(name,fn){await fn();console.log('PASS '+name);n++}
 await test('first/Enter page guard: lobby absent, no room entry',async()=>{let p=await page();await p.evaluate(()=>{document.body.classList.remove('yp-joined');partyLobbyShow()});assert.equal(await p.locator('#wp-party-lobby').count(),0);assert.equal(await p.evaluate(()=>stats.enter),0);await p.close()});
 await test('approved art, right arrow and visible ongoing motion; no auto-join',async()=>{let p=await page();await show(p);assert.equal(await p.locator('.wpl-note').first().textContent(),'♪');assert.equal(await p.locator('#wpl-back').getAttribute('aria-label'),'Back to Chat');let box=await p.locator('#wpl-back').boundingBox();assert(box.x>300&&box.width>=44);assert.equal(await p.locator('#wpl-status').textContent(),'Yet Not Joined, Tap On Enter Party');let a=await p.locator('.wpl-note').first().evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(250);let b=await p.locator('.wpl-note').first().evaluate(e=>getComputedStyle(e).transform);assert.notEqual(a,b);assert.equal(await p.evaluate(()=>stats.enter),0);await p.screenshot({path:'/tmp/lobby-v46-phone.png',fullPage:true});await p.close()});
 for(const origin of ['dm-view-inbox','dm-view-calls'])await test('top arrow returns to Chat from '+origin+' without join/leave',async()=>{let p=await page();await p.evaluate(v=>{stats.view=v;dmOpenedFromRoom=true},origin);await show(p);await p.locator('#wpl-back').click();await p.waitForFunction(()=>$('wp-party-lobby').hidden);let s=await p.evaluate(()=>({...stats,origin:dmOpenedFromRoom,historyView:history.state.view}));assert.equal(s.view,'dm-view-inbox');assert.equal(s.historyView,'dm-view-inbox');assert.equal(s.enter,0);assert.equal(s.leave,0);assert.equal(s.origin,false);assert.equal(s.close,0);await p.close()});
 await test('Enter only joins once, closes lobby/sheet and welcomes',async()=>{let p=await page();await show(p);await p.evaluate(()=>{$('wpl-enter').click();$('wpl-enter').click()});await p.waitForFunction(()=>$('wp-party-lobby').hidden);const s=await p.evaluate(()=>stats);assert.equal(s.enter,1);assert.equal(s.close,1);assert.equal(s.welcome,1);assert.equal(s.leave,0);await p.close()});
 await test('offline keeps lobby and Enter does not join',async()=>{let p=await page();await p.evaluate(()=>mqttUp=false);await show(p);await p.locator('#wpl-enter').click();assert.equal(await p.evaluate(()=>stats.enter),0);assert.equal(await p.locator('#wpl-status.wpl-error').count(),1);assert(await p.locator('#wp-party-lobby').isVisible());await p.close()});
 await test('failed room entry stays in lobby',async()=>{let p=await page();await p.evaluate(()=>stats.enterOk=false);await show(p);await p.locator('#wpl-enter').click();assert.equal(await p.locator('#wpl-status.wpl-error').count(),1);assert.equal(await p.evaluate(()=>stats.close),0);assert(await p.locator('#wp-party-lobby').isVisible());await p.close()});
 await test('history-push denial still allows Back to Chat',async()=>{let p=await page();await p.evaluate(()=>{stats.view='dm-view-calls';history.pushState=()=>{throw Error('denied')}});await show(p);await p.locator('#wpl-back').click();assert.equal(await p.evaluate(()=>stats.view),'dm-view-inbox');assert.equal(await p.evaluate(()=>stats.enter),0);assert(await p.locator('#wp-party-lobby').isHidden());await p.close()});
 await test('reopening resets Back/Enter, refreshes safe dynamic room name',async()=>{let p=await page();await show(p);await p.locator('#wpl-back').click();await p.waitForFunction(()=>$('wp-party-lobby').hidden);await p.evaluate(()=>{myRoom='<img src=x onerror=alert(1)> Very Long Room '.repeat(3);partyLobbyShow()});assert(await p.locator('#wpl-back').isEnabled());assert(await p.locator('#wpl-enter').isEnabled());assert((await p.locator('#wpl-room-name').textContent()).startsWith('<img'));assert.equal(await p.locator('#wp-party-lobby img').count(),1);assert.equal(await p.locator('#wpl-room-name').evaluate(e=>getComputedStyle(e).textOverflow),'ellipsis');await p.close()});
 await test('back-arrow/Enter rapid race cannot accidentally join',async()=>{let p=await page();await show(p);await p.evaluate(()=>{$('wpl-back').click();$('wpl-enter').click();$('wpl-back').click()});await p.waitForFunction(()=>$('wp-party-lobby').hidden);assert.equal(await p.evaluate(()=>stats.enter),0);await p.close()});
 await test('existing membership preserved by Chat arrow',async()=>{let p=await page();await p.evaluate(()=>stats.joined=true);await show(p);await p.locator('#wpl-back').click();await p.waitForFunction(()=>$('wp-party-lobby').hidden);const s=await p.evaluate(()=>stats);assert(s.joined);assert.equal(s.leave,0);assert.equal(s.enter,0);await p.close()});
 await test('reduced-motion preference respected',async()=>{let p=await page(undefined,'reduce');await show(p);assert.equal(await p.locator('.wpl-note').first().evaluate(e=>getComputedStyle(e).animationName),'none');await p.close()});
 for(const [w,h] of [[360,780],[768,1024],[820,390]])await test('responsive layout '+w+'x'+h+' has reachable controls and no horizontal overflow',async()=>{let p=await page({width:w,height:h});await show(p);assert(await p.locator('#wp-party-lobby').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.locator('#wpl-enter').scrollIntoViewIfNeeded();assert(await p.locator('#wpl-enter').isVisible());await p.locator('#wpl-back').scrollIntoViewIfNeeded();assert(await p.locator('#wpl-back').isVisible());await p.close()});
 for(const [w,h] of [[344,727],[360,800],[412,915]])await test('v47 full-height decorative footer '+w+'x'+h+' without image distortion',async()=>{
  let p=await page({width:w,height:h});await show(p);
  const art=await p.locator('.wpl-art').boundingBox(),tail=await p.locator('.wpl-tail').boundingBox(),lobby=await p.locator('#wp-party-lobby').boundingBox();
  assert(Math.abs(art.height/art.width-1607/941)<.005);
  assert(tail.height>10);assert(Math.abs(tail.y-(art.y+art.height)+1)<1.1);
  assert(Math.abs(tail.y+tail.height-(lobby.y+lobby.height))<1.1);
  assert.equal(await p.locator('.wpl-tail').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert(await p.locator('#wp-party-lobby').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
  await p.screenshot({path:'/tmp/lobby-v47-'+w+'.png',fullPage:true});await p.close();
 });
 console.log(n+' actual-Chromium scenarios passed; room/MQTT/DM operations simulated, not handset/broker tests.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
