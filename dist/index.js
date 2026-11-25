const prefix='Custom Loader/images/Add Your GIFs Here/';
export default function(){
 const R=window.SP_REACT, patches=new Map();
 let files=[], current=null, count=0,last='None',error='', stopped=false, timer, scanning=false, lastScan=0,mode='sequential',hook='Waiting',status='Not applied yet',saved='Unknown',busy=false, pending=null, lastAt=0,lastId='', selected=null;
 let preferencesReady=false, preferenceBusy=false, preferenceError='', enabled=true, dependency='Checking dependencies…', dependencyReady=null;
 try{enabled=localStorage.getItem('custom-loader-shuffle-enabled')!=='false'}catch{}
 try{mode=localStorage.getItem('custom-loader-shuffle-mode')==='random'?'random':'sequential'}catch{}
 const rpc=(plugin,method,...args)=>window.DeckyBackend.callable('loader/call_plugin_method')(plugin,method,...args);
 async function initializePreferences(){
  try{const stored=await rpc('Custom Loader Shuffle','load_preferences');if(stored){enabled=stored.enabled;mode=stored.mode;}else{await rpc('Custom Loader Shuffle','save_preferences',enabled,mode);}preferencesReady=true;preferenceError='';}catch(e){preferenceError='Preferences unavailable: '+String(e);console.error('[Custom Loader Shuffle]',e);}
 }
 async function changePreferences(newEnabled,newMode){
  if(!preferencesReady||preferenceBusy)return;preferenceBusy=true;preferenceError='';
  try{const result=await rpc('Custom Loader Shuffle','save_preferences',newEnabled,newMode);if(result?.enabled!==newEnabled||result?.mode!==newMode)throw Error('Preferences verification failed');enabled=result.enabled;mode=result.mode;try{localStorage.setItem('custom-loader-shuffle-enabled',String(enabled));localStorage.setItem('custom-loader-shuffle-mode',mode)}catch{}}catch(e){preferenceError='Could not save preferences: '+String(e);console.error('[Custom Loader Shuffle]',e);}finally{preferenceBusy=false;}
 }
 function gameWindow(){const c=window.GamepadNavTree?.m_context?.m_controller||window.FocusNavController;const ctx=c?.m_ActiveContext||c?.m_LastActiveContext;return Array.from(ctx?.m_rgGamepadNavigationTrees||[]).find(t=>t.m_ID==='root_1_')?.Root?.Element?.ownerDocument?.defaultView||window;}
 function next(){if(!files.length)return null;const i=files.indexOf(current);if(mode==='random'){const pool=files.filter(f=>f!==current);return pool.length?pool[Math.floor(Math.random()*pool.length)]:files[0];}return files[(i+1)%files.length];}
 async function scan(){if(scanning||stopped)return;scanning=true;try{const f=await rpc('Custom Loader Shuffle','list_gifs');if(!Array.isArray(f))throw Error('Unexpected GIF list');files=f.filter(x=>typeof x==='string'&&/\.gif$/i.test(x));}catch(e){error='Scan: '+String(e)}finally{scanning=false;lastScan=Date.now()}}
 async function apply(token={cancelled:false}){if(stopped||token.cancelled||busy)return;busy=true;error='';try{if(!files.length)await scan();if(stopped||token.cancelled)return;const choice=next();if(!choice)throw Error('No GIFs found');selected=choice;status='Applying '+choice+' through CSS Loader';const config=await rpc('Custom Loader Shuffle','read_selection');if(!config.active||config.patch!=='Custom')throw Error('Enable Custom Loader and choose Custom in CSS Loader');if(stopped||token.cancelled)return;const written=await rpc('Custom Loader Shuffle','write_selection',choice);if(written?.image!==prefix+choice)throw Error('Write verification: '+JSON.stringify(written));saved=written.image;if(stopped||token.cancelled)return;status='Saved; refreshing CSS Loader';const reply=await window.DeckyBackend.callable('loader/call_legacy_plugin_method')('CSS Loader','reset',{});if(reply?.success!==true)throw Error('CSS refresh: '+JSON.stringify(reply));if(!reply.result||!Array.isArray(reply.result.fails))throw Error('Unexpected refresh response: '+JSON.stringify(reply));if(stopped||token.cancelled)return;const check=await rpc('Custom Loader Shuffle','read_selection');if(stopped||token.cancelled)return;saved=check.image;if(check.image!==prefix+choice)throw Error('CSS Loader refresh changed saved selection: '+check.image);current=choice;status='Saved and refreshed: '+choice;if(reply.result.fails.length)error='Refresh reported theme errors: '+JSON.stringify(reply.result.fails);}catch(e){error=String(e);status='Apply incomplete; check saved value';console.error('[Custom Loader Shuffle] Apply failed',e);}finally{busy=false}}
 function patch(){for(const w of new Set([window,gameWindow()])){const apps=w.SteamClient?.Apps;if(!apps||patches.has(apps)||typeof apps.RunGame!=='function')continue;const original=apps.RunGame;const wrapped=function(...args){if(!preferencesReady||!enabled||stopped)return Reflect.apply(original,this,args);const id=String(args[0]??'');const now=Date.now();if(pending)return pending;if(id===lastId&&now-lastAt<1500)return Reflect.apply(original,this,args);lastId=id;lastAt=now;count++;last=`App ${id} at ${new Date().toLocaleTimeString()}`;const self=this;pending=(async()=>{try{if(!stopped&&!busy&&dependencyReady!==false){const token={cancelled:false};let timeout;try{await Promise.race([apply(token),new Promise(resolve=>{timeout=setTimeout(()=>{token.cancelled=true;error='CSS Loader timed out; game launch continued.';console.error('[Custom Loader Shuffle]',error);resolve();},5000);})]);}finally{clearTimeout(timeout);}}return await Reflect.apply(original,self,args);}finally{pending=null}})();return pending;};try{apps.RunGame=wrapped;if(apps.RunGame===wrapped){patches.set(apps,{original,wrapped});hook='RunGame hook installed';}else hook='Hook rejected'}catch(e){error=String(e)}}}
 let depAt=0, depBusy=false;
 async function checkDependencies(){if(depBusy||stopped)return;depBusy=true;try{const d=await rpc('Custom Loader Shuffle','dependency_status');dependency=d.message;dependencyReady=d.ready;}catch(e){dependency='Dependency check unavailable: '+String(e);dependencyReady=null;}finally{depBusy=false;depAt=Date.now();}}
 function tick(){if(stopped)return;try{patch();if(Date.now()-depAt>5000&&!busy)checkDependencies();if(Date.now()-lastScan>5000&&!busy)scan()}catch(e){error=String(e)}}
 function Logo(){return R.createElement('svg',{width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},R.createElement('path',{d:'M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 5-5m2-4c2-2 3-3 5-3h3m-4-4 4 4-4 4'}))}
 function Panel(){
  const [,update]=R.useState(0);
  R.useEffect(()=>{const t=setInterval(()=>update(n=>n+1),400);return()=>clearInterval(t)},[]);
  const h=R.createElement,locked=busy||!!pending||!preferencesReady||preferenceBusy;
  const panelRef=R.useRef(null);
  R.useEffect(()=>{
   const node=panelRef.current;if(!node)return;
   const reset=()=>{for(let el=node.parentElement;el&&el!==node.ownerDocument.body;el=el.parentElement){const style=el.ownerDocument.defaultView.getComputedStyle(el);if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight)el.scrollTop=0;}};
   reset();const t=setTimeout(reset,100);return()=>clearTimeout(t);
  },[]);
  const D=window.DFL||{}, Section=D.PanelSection, Row=D.PanelSectionRow, Button=D.ButtonItem, Toggle=D.ToggleField;
  const native=!!(Section&&Row&&Button&&Toggle);
  const row=(label,value)=>h('div',{style:{display:'flex',justifyContent:'space-between',gap:'8px',padding:'2px 0',alignItems:'center'}},h('span',{style:{opacity:.72,flexShrink:0}},label),h('span',{style:{textAlign:'right',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},title:String(value)},value));
  const wrap=(child)=>native?h(Row,null,child):h('div',null,child);
  const section=(title,...children)=>native?h(Section,{title},...children):h('div',{style:{padding:'10px'}},h('strong',null,title),...children);
  const btn=(label,fn,disabled=false)=>wrap(native?h(Button,{layout:'below',onClick:fn,disabled},label):h('button',{disabled,onClick:fn},label));
  const toggle=(label,value,fn,disabled=false,description)=>native?wrap(h(Toggle,{label,description,checked:value,onChange:fn,disabled})):btn(label+': '+(value?'On':'Off'),()=>fn(!value),disabled);
  const info=t=>wrap(h('div',{style:{fontSize:'12px',opacity:.75,overflowWrap:'anywhere'}},t));
  const setEnabled=v=>{changePreferences(!!v,mode).then(()=>update(n=>n+1))};
  const setRandom=v=>{changePreferences(enabled,v?'random':'sequential').then(()=>update(n=>n+1))};
  return h('div',{ref:panelRef},
   h('div',{style:{fontSize:'12px',opacity:.72,textAlign:'center',padding:'4px 8px 0',lineHeight:'16px'}},'v1.0.0 · CSS Loader companion'),
   section('Shuffle',!native?info('Native controls unavailable.'):null,
    toggle('Automatic shuffle',enabled,setEnabled,locked),
    toggle('Random mode',mode==='random',setRandom,locked,'Off = sequential'),
    dependencyReady===true?null:info(dependency),preferenceError?info(preferenceError):null),
   section('Animations',wrap(row('GIFs found',String(files.length))),wrap(row('Current',current||'CSS Loader selection')),wrap(row('Next',mode==='random'?'Random':next()||'None')),
    !files.length?info('Add GIFs to the Custom Loader images folder.'):null,
    btn('Apply next GIF',()=>{if(!busy&&!pending)apply()},locked||!files.length||dependencyReady===false),
    error?info(error):null));
 }

 initializePreferences();tick();timer=setInterval(tick,500);
 return {title:R.createElement('span',null,'Custom Loader Shuffle'),icon:R.createElement(Logo),content:R.createElement(Panel),onDismount(){stopped=true;clearInterval(timer);for(const [apps,p] of patches){try{if(apps.RunGame===p.wrapped)apps.RunGame=p.original}catch{}}patches.clear();}};
}
