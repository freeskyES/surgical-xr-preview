import { dateAt, formatPlanMarkdown } from './midas-plan-format.mjs';
// Native navigation and media work without JavaScript. Enhancements stay local.
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
try{if(localStorage.getItem('midas-motion')==='reduce')document.documentElement.dataset.motion='reduce';}catch{}
const reduceMotion={get matches(){return systemMotion.matches||document.documentElement.dataset.motion==='reduce';}};
const motionButton=document.querySelector('[data-motion-toggle]');
function syncMotion(){
 if(motionButton){motionButton.hidden=false;motionButton.setAttribute('aria-pressed',String(reduceMotion.matches));motionButton.title=systemMotion.matches?'기기의 움직임 줄이기 설정이 적용되어 있습니다.':'이 브라우저의 움직임 설정';}
 if(reduceMotion.matches)document.getAnimations().forEach(animation=>animation.cancel());
}
motionButton?.addEventListener('click',()=>{const reduced=document.documentElement.dataset.motion!=='reduce';document.documentElement.dataset.motion=reduced?'reduce':'full';try{localStorage.setItem('midas-motion',reduced?'reduce':'full');}catch{}syncMotion();});
systemMotion.addEventListener('change',syncMotion);syncMotion();
if('IntersectionObserver' in window){
 const reveal=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){if(!reduceMotion.matches)entry.target.animate([{opacity:.45,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});reveal.unobserve(entry.target);}},{threshold:.08});
 document.querySelectorAll('.section-heading,.feature-grid article,.goal-detail,.compact-history,.system-explorer,.priority-grid,.milestone-map,.schedule-weeks>li,.result-figure,[data-capture-scene],.research-gates,.research-focus').forEach(el=>reveal.observe(el));
 const captureLinks=[...document.querySelectorAll('.capture-index a')];
 const captureObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){captureLinks.forEach(a=>{if(a.hash===`#${entry.target.id}`)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});}},{rootMargin:'-20% 0px -45% 0px'});
 document.querySelectorAll('[data-capture-scene]').forEach(scene=>captureObserver.observe(scene));
 const videoObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(!entry.isIntersecting)entry.target.pause();},{threshold:.02});
 document.querySelectorAll('video').forEach(video=>videoObserver.observe(video));
}

// Product navigation stays visible and follows the section being read.
const productNav=document.querySelector('.section-nav');
if(productNav){
 const links=[...productNav.querySelectorAll('a')];
 const sections=links.map(link=>document.getElementById(link.hash.slice(1))).filter(Boolean);
 const header=document.querySelector('.site-header');
 let pending=false;
 function updateProductPosition(){
  pending=false;
  const readingLine=(header?.getBoundingClientRect().height||0)+productNav.getBoundingClientRect().height+32;
  let current=sections[0];
  for(const section of sections){if(section.getBoundingClientRect().top<=readingLine)current=section;else break;}
  links.forEach(link=>{if(link.hash===`#${current?.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 }
 function scheduleProductPosition(){if(!pending){pending=true;requestAnimationFrame(updateProductPosition);}}
 links.forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const target=document.getElementById(link.hash.slice(1));
  if(!target)return;
  target.tabIndex=-1;target.focus({preventScroll:true});
  if(location.hash===link.hash){event.preventDefault();target.scrollIntoView({block:'start',behavior:reduceMotion.matches?'instant':'smooth'});}
  scheduleProductPosition();
 }));
 addEventListener('scroll',scheduleProductPosition,{passive:true});
 addEventListener('resize',scheduleProductPosition);
 addEventListener('hashchange',scheduleProductPosition);
 document.addEventListener('load',scheduleProductPosition,true);
 updateProductPosition();
}

// Article navigation follows the reading position without changing the URL.
const readingArticle=document.querySelector('.build-article--rail');
if(readingArticle){
 const links=[...readingArticle.querySelectorAll('.article-jump-links a')];
 const sections=[...new Set(links.map(link=>document.getElementById(link.hash.slice(1))))].filter(Boolean);
 const disclosure=readingArticle.querySelector('[data-article-jump]');
 const header=document.querySelector('.site-header');
 let pending=false;
 function updateReadingPosition(){
  pending=false;
  const readingLine=(header?.getBoundingClientRect().height||0)+56;
  let current=sections[0];
  for(const section of sections){if(section.getBoundingClientRect().top<=readingLine)current=section;else break;}
  links.forEach(link=>{if(link.hash===`#${current?.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 }
 function scheduleReadingPosition(){if(!pending){pending=true;requestAnimationFrame(updateReadingPosition);}}
 links.forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const target=document.getElementById(link.hash.slice(1));
  if(!target)return;
  disclosure.open=false;
  target.tabIndex=-1;
  target.focus({preventScroll:true});
  // Re-selecting the current fragment should return to its heading after scrolling.
  if(location.hash===link.hash){
   event.preventDefault();
   target.scrollIntoView({block:'start',behavior:reduceMotion.matches?'instant':'smooth'});
  }
  scheduleReadingPosition();
 }));
 disclosure.addEventListener('keydown',event=>{if(event.key==='Escape'&&disclosure.open){disclosure.open=false;disclosure.querySelector('summary').focus();}});
 addEventListener('scroll',scheduleReadingPosition,{passive:true});
 addEventListener('resize',scheduleReadingPosition);
 addEventListener('hashchange',scheduleReadingPosition);
 readingArticle.addEventListener('load',scheduleReadingPosition,true);
 updateReadingPosition();
}

// The selected route remains a conceptual explanation, not live telemetry.
const workspace=document.querySelector('[data-workspace]');
if(workspace){
 const buttons=[...workspace.querySelectorAll('[data-workspace-select]')];
 workspace.classList.add('is-enhanced');workspace.querySelector('.workspace-controls').hidden=false;
 function selectWorkspace(id,animate=false){
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workspaceSelect===id)));
  workspace.querySelectorAll('[data-workspace-zone]').forEach(zone=>zone.classList.toggle('is-selected',zone.dataset.workspaceZone===id));
  workspace.querySelectorAll('[data-workspace-panel]').forEach(panel=>{panel.hidden=panel.dataset.workspacePanel!==id;if(!panel.hidden&&animate&&!reduceMotion.matches)panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});});
 }
 buttons.forEach(button=>button.addEventListener('click',()=>selectWorkspace(button.dataset.workspaceSelect,true)));
 selectWorkspace('video');
}
const system=document.querySelector('[data-system]');
if(system){
 const buttons=[...system.querySelectorAll('[data-route]')];
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const route=button.dataset.route;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  system.querySelectorAll('[data-signal]').forEach(row=>{row.classList.toggle('is-muted',route!=='all'&&row.dataset.signal!==route);row.classList.toggle('is-active',route!=='all'&&row.dataset.signal===route);});
  system.querySelectorAll('[data-route-note]').forEach(note=>{note.hidden=route!=='all'&&note.dataset.routeNote!==route;if(!note.hidden&&!reduceMotion.matches)note.animate([{opacity:.35,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});});
 }));
}

// Only compares an implemented software path with a proposed device; no hardware is simulated.
const appliance=document.querySelector('[data-appliance]');
if(appliance){
 const buttons=[...appliance.querySelectorAll('[data-appliance-mode]')];
 appliance.querySelector('.sketch-switch').hidden=false;
 function selectAppliance(mode,animate=false){
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.applianceMode===mode)));
  appliance.querySelectorAll('[data-appliance-panel]').forEach(panel=>{panel.hidden=panel.dataset.appliancePanel!==mode;if(!panel.hidden&&animate&&!reduceMotion.matches)panel.animate([{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:300,easing:'ease-out'});});
 }
 buttons.forEach(button=>button.addEventListener('click',()=>selectAppliance(button.dataset.applianceMode,true)));
 selectAppliance('now');
}

// A read-only evidence board. Date edits affect the proposed schedule only.
const workFilters=[...document.querySelectorAll('[data-work-filter]')];
const workRows=[...document.querySelectorAll('[data-work-state]')];
const topicSelect=document.querySelector('[data-work-topic]');
let workState='all';
function filterWork(value,topic='all',write=false){
 workState=workFilters.some(b=>b.dataset.workFilter===value)?value:'all';
 if(topicSelect&&!Array.from(topicSelect.options).some(o=>o.value===topic))topic='all';
 if(topicSelect)topicSelect.value=topic;
 let count=0;
 workRows.forEach(row=>{row.hidden=(workState!=='all'&&row.dataset.workState!==workState)||(topic!=='all'&&row.dataset.workTrack!==topic);if(!row.hidden)count++;});
 workFilters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workFilter===workState)));
 const columns=[...document.querySelectorAll('[data-work-column]')];
 columns.forEach(col=>{col.hidden=![...col.querySelectorAll('[data-work-state]')].some(row=>!row.hidden);});
 const board=document.querySelector('.work-board');if(board)board.dataset.single=String(columns.filter(c=>!c.hidden).length===1);
 const live=document.querySelector('[data-work-count]');if(live)live.textContent=`${count}개의 작업 · ${workState==='all'?'전체 상태':workFilters.find(b=>b.dataset.workFilter===workState)?.childNodes[0].textContent.trim()}`;
 const empty=document.querySelector('[data-work-empty]');if(empty)empty.hidden=count!==0;
 if(write){const url=new URL(location.href);url.searchParams.set('state',workState);topic==='all'?url.searchParams.delete('track'):url.searchParams.set('track',topic);url.hash='work';history.replaceState(null,'',url);}
}
function restoreWork(){
 const params=new URL(location.href).searchParams;
 const target=location.hash?document.getElementById(location.hash.slice(1)):null;
 if(target?.matches('[data-work-state]')){filterWork('all','all');const url=new URL(location.href);url.searchParams.set('state','all');url.searchParams.delete('track');history.replaceState(null,'',url);target.querySelector('details').open=true;target.scrollIntoView({behavior:'instant',block:'start'});}
 else {filterWork(params.get('state')||'next',params.get('track')||'all');if(target)target.scrollIntoView({behavior:'instant',block:'start'});}
}
if(workFilters.length){
 workFilters.forEach(button=>button.addEventListener('click',()=>filterWork(button.dataset.workFilter,topicSelect?.value||'all',true)));
 topicSelect?.addEventListener('change',()=>filterWork(workState,topicSelect.value,true));
 document.querySelectorAll('[data-jump-state]').forEach(a=>a.addEventListener('click',()=>filterWork(a.dataset.jumpState,'all',true)));
 document.querySelectorAll('[data-task-jump]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();filterWork('all','all');const target=document.getElementById(`task-${a.dataset.taskJump}`);if(!target)return;target.querySelector('details').open=true;target.tabIndex=-1;const url=new URL(location.href);url.searchParams.set('state','all');url.searchParams.delete('track');url.hash=target.id;history.pushState(null,'',url);target.scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'});target.focus({preventScroll:true});}));
 restoreWork();addEventListener('popstate',restoreWork);addEventListener('hashchange',restoreWork);
}
const planInput=document.querySelector('[data-plan-start]');
const planSource=document.getElementById('plan-data');
if(planInput&&planSource){
 const plan=JSON.parse(planSource.textContent);
 const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=planInput.min&&value<=planInput.max&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&dateAt(value,0)===value;
 function updateDates(value,write=false){
  const start=validDate(value)?value:plan.start;planInput.value=start;
  document.querySelectorAll('[data-schedule-week]').forEach(row=>{const offset=Number(row.dataset.scheduleWeek)*7;const time=row.querySelector('[data-week-date]');time.dateTime=dateAt(start,offset);time.textContent=`${dateAt(start,offset).slice(5).replace('-','.')}–${dateAt(start,offset+6).slice(5).replace('-','.')}`;});
  document.querySelector('[data-schedule-summary]').textContent=`${start.replaceAll('-','.')}–${dateAt(start,41).replaceAll('-','.')} · 검토 후 조정할 6주`;
  if(write){const url=new URL(location.href);start===plan.start?url.searchParams.delete('start'):url.searchParams.set('start',start);history.replaceState(null,'',url);}
 }
 const restoreDates=()=>updateDates(new URL(location.href).searchParams.get('start'));
 planInput.addEventListener('change',()=>updateDates(planInput.value,true));addEventListener('popstate',restoreDates);restoreDates();
 document.querySelector('[data-download-plan]').addEventListener('click',event=>{
  event.preventDefault();
  const start=planInput.value;
  const text=formatPlanMarkdown(plan,start);
  const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`MIDAS-plan-${start}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
}
const videos=[...document.querySelectorAll('video')];
for(const video of videos)video.addEventListener('play',()=>{videos.filter(v=>v!==video).forEach(v=>v.pause());resetYouTubePlayers();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){videos.forEach(v=>v.pause());resetYouTubePlayers();}});

// Progressive enhancement: thumbnail links still open YouTube without JavaScript.
function resetYouTubePlayers(){
 document.querySelectorAll('[data-youtube-frame] iframe').forEach(frame=>frame.remove());
 document.querySelectorAll('[data-youtube-id]').forEach(link=>{link.hidden=false;});
}
document.querySelectorAll('[data-youtube-id]').forEach(link=>link.addEventListener('click',event=>{
 if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const id=link.dataset.youtubeId;if(!/^[\w-]{11}$/.test(id))return;
 event.preventDefault();resetYouTubePlayers();videos.forEach(video=>video.pause());
 const frame=document.createElement('iframe');
 frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
 frame.title=link.dataset.youtubeTitle;
 frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
 frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 link.hidden=true;link.parentElement.append(frame);frame.focus();
}));

const filters=[...document.querySelectorAll('[data-history-filter]')];
const records=[...document.querySelectorAll('[data-history-track]')];
function filterHistory(value,write=false){
 const selected=filters.some(b=>b.dataset.historyFilter===value)?value:'all';
 let count=0;
 for(const row of records){row.hidden=selected!=='all'&&selected!==row.dataset.historyTrack;if(!row.hidden)count++;}
 filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.historyFilter===selected)));
 const live=document.querySelector('[data-history-count]');if(live)live.textContent=(count===1?live.dataset.countOne:live.dataset.countMany)?.replace('{count}',String(count)) || `${count}개의 주요 기록`;
 if(write){const url=new URL(location.href);if(selected==='all')url.searchParams.delete('topic');else url.searchParams.set('topic',selected);url.hash='';history.pushState(null,'',url);}
}
function restoreHistory(){const selected=new URL(location.href).searchParams.get('topic');const target=location.hash?document.getElementById(location.hash.slice(1)):null;filterHistory(target?.dataset.historyTrack?'all':selected);if(target?.dataset.historyTrack)target.scrollIntoView({behavior:'instant',block:'start'});}
filters.forEach(b=>b.addEventListener('click',()=>filterHistory(b.dataset.historyFilter,true)));
if(filters.length){restoreHistory();addEventListener('popstate',restoreHistory);addEventListener('hashchange',restoreHistory);}

const dialog=document.querySelector('.image-dialog');
let imageTrigger;
if(dialog&&typeof dialog.showModal==='function'){
 const enlarged=dialog.querySelector('img');
 document.querySelectorAll('[data-image-open]').forEach(a=>a.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();imageTrigger=a;enlarged.src=a.href;enlarged.alt=a.querySelector('img')?.alt||a.getAttribute('aria-label')||'선택한 이미지';dialog.querySelector('p').textContent=a.dataset.caption||a.closest('figure')?.querySelector('figcaption')?.textContent||enlarged.alt;dialog.showModal();}));
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{enlarged.removeAttribute('src');imageTrigger?.focus({preventScroll:true});});
}
